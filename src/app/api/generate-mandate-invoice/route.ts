import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { mandateId, amount: customAmount } = await request.json()

    if (!mandateId) {
      return NextResponse.json({ error: 'Mandate ID required' }, { status: 400 })
    }

    // Get mandate with pricing phases and client
    const { data: mandate, error: mandateError } = await supabaseAdmin
      .from('mandates')
      .select(`
        *,
        client:clients(*),
        pricing_phases:mandate_pricing_phases(*),
        accepted_option:mandate_options(*)
      `)
      .eq('id', mandateId)
      .single()

    if (mandateError || !mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    if (mandate.status !== 'active' && mandate.status !== 'accepted') {
      return NextResponse.json({ error: 'Mandate is not active' }, { status: 400 })
    }

    const today = new Date()

    // Use custom amount if provided, otherwise determine automatically
    let invoiceAmount = customAmount || 0

    if (!invoiceAmount) {
      // Check pricing phases for the applicable amount
      const sortedPhases = (mandate.pricing_phases || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      )

      for (const phase of sortedPhases) {
        // Check if this phase applies based on date
        const phaseStart = phase.start_date ? new Date(phase.start_date) : null
        const phaseEnd = phase.end_date ? new Date(phase.end_date) : null

        if (phaseStart && today < phaseStart) continue
        if (phaseEnd && today > phaseEnd) continue

        invoiceAmount = phase.amount
        break
      }

      // Fallback: use accepted option monthly amount
      if (invoiceAmount === 0 && mandate.accepted_option_id) {
        const acceptedOption = (mandate.accepted_option || []).find(
          (o: { id: string }) => o.id === mandate.accepted_option_id
        )
        if (acceptedOption?.monthly_amount) {
          invoiceAmount = acceptedOption.monthly_amount
        }
      }

      // Fallback: use primary phase
      if (invoiceAmount === 0) {
        const primaryPhase = sortedPhases.find((p: { is_primary: boolean }) => p.is_primary)
        if (primaryPhase) {
          invoiceAmount = primaryPhase.amount
        }
      }
    }

    if (invoiceAmount === 0) {
      return NextResponse.json({ error: 'Could not determine invoice amount' }, { status: 400 })
    }

    // Calculate invoice period
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const periodLabel = periodStart.toLocaleDateString('de-CH', {
      month: 'long',
      year: 'numeric',
    })

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Clean title: remove "Offerte" from mandate title for invoices
    const cleanTitle = mandate.title.replace(/[-–]\s*Offerte/gi, '').replace(/Offerte[-–\s]*/gi, '').replace(/\s+/g, ' ').trim()

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        client_id: mandate.client_id,
        title: `${cleanTitle} - ${periodLabel}`,
        description: `Monatliche Betreuung gemäss Mandat`,
        status: 'draft',
        issue_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        total_amount: invoiceAmount,
        notes: `Mandat: ${cleanTitle}`,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice item
    const { error: itemError } = await supabaseAdmin
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        title: `IT-Betreuung ${periodLabel}`,
        description: cleanTitle,
        quantity: 1,
        unit_price: invoiceAmount,
        amount: invoiceAmount,
        sort_order: 0,
      })

    if (itemError) {
      console.error('Error creating invoice item:', itemError)
    }

    // Link invoice to mandate
    const { error: linkError } = await supabaseAdmin
      .from('mandate_invoices')
      .insert({
        mandate_id: mandate.id,
        invoice_id: invoice.id,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        amount: invoiceAmount,
      })

    if (linkError) {
      console.error('Error linking mandate invoice:', linkError)
    }

    // Update mandate
    const nextInvoiceDate = new Date(today.getFullYear(), today.getMonth() + 1, mandate.billing_day || 1)

    await supabaseAdmin
      .from('mandates')
      .update({
        last_invoice_date: today.toISOString(),
        next_invoice_date: nextInvoiceDate.toISOString().split('T')[0],
        invoices_generated: (mandate.invoices_generated || 0) + 1,
        status: 'active', // Ensure it's marked as active
      })
      .eq('id', mandate.id)

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: invoiceAmount,
      period: periodLabel,
    })
  } catch (error) {
    console.error('Generate mandate invoice error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
