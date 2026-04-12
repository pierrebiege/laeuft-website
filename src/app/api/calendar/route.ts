import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

// GET /api/calendar?start=...&end=...
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const startISO = searchParams.get('start')
  const endISO = searchParams.get('end')

  if (!startISO || !endISO) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  const startStr = startISO.split('T')[0]
  const endStr = endISO.split('T')[0]

  const [realRes, partnerRes, invoiceRes, mandateRes, todoRes] = await Promise.all([
    supabaseAdmin
      .from('calendar_events')
      .select('*')
      .or(`and(start_at.gte.${startISO},start_at.lte.${endISO}),recurrence_rule.not.is.null`)
      .order('start_at', { ascending: true }),

    supabaseAdmin
      .from('partners')
      .select('id, name, follow_up_date, status')
      .not('follow_up_date', 'is', null)
      .not('status', 'in', '("Closed","Declined")')
      .gte('follow_up_date', startStr)
      .lte('follow_up_date', endStr),

    supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, due_date, status, client:clients(name)')
      .not('due_date', 'is', null)
      .in('status', ['sent', 'overdue'])
      .gte('due_date', startStr)
      .lte('due_date', endStr),

    supabaseAdmin
      .from('mandates')
      .select('id, title, next_invoice_date, status, client:clients(name)')
      .not('next_invoice_date', 'is', null)
      .in('status', ['active'])
      .gte('next_invoice_date', startStr)
      .lte('next_invoice_date', endStr),

    supabaseAdmin
      .from('todos')
      .select('id, title, due_date, priority, completed')
      .eq('completed', false)
      .not('due_date', 'is', null)
      .gte('due_date', startStr)
      .lte('due_date', endStr),
  ])

  return NextResponse.json({
    events: realRes.data || [],
    partners: partnerRes.data || [],
    invoices: invoiceRes.data || [],
    mandates: mandateRes.data || [],
    todos: todoRes.data || [],
  })
}

// POST /api/calendar — create event
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const payload = await request.json()
  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PUT /api/calendar — update event
export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id, ...payload } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/calendar?id=...
export async function DELETE(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('calendar_events')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
