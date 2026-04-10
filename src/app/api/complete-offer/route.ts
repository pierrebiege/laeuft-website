import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { businessConfig } from '@/lib/business-config'
import { requireAuth } from '@/lib/auth'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { offerId } = await request.json()

    if (!offerId) {
      return NextResponse.json({ error: 'offerId fehlt' }, { status: 400 })
    }

    // Load offer with client and items
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select(`*, client:clients(*), items:offer_items(*)`)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offerte nicht gefunden' }, { status: 404 })
    }

    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Offerte muss angenommen sein' }, { status: 400 })
    }

    // Check if final invoice already exists
    const { data: existingInvoices } = await supabaseAdmin
      .from('invoices')
      .select('id, title')
      .eq('offer_id', offerId)
      .ilike('title', '%Schlussrechnung%')

    if (existingInvoices && existingInvoices.length > 0) {
      return NextResponse.json({ error: 'Schlussrechnung wurde bereits erstellt' }, { status: 400 })
    }

    // Create final invoice (50% Schlussrechnung)
    const halfAmount = Math.round(offer.total_amount * 50) / 100
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + businessConfig.defaultPaymentDays)

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        client_id: offer.client_id,
        offer_id: offer.id,
        title: `${offer.title} – Schlussrechnung 50%`,
        description: `Zweite Teilrechnung (50%) gemäss Offerte "${offer.title}"`,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        total_amount: halfAmount,
        notes: `Automatisch erstellt bei Projektabschluss.`,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Fehler beim Erstellen der Rechnung' }, { status: 500 })
    }

    // Create invoice items (each at 50%)
    const items = (offer.items || [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

    if (items.length > 0) {
      const invoiceItems = items.map((item: { title: string; description: string | null; amount: number }, index: number) => ({
        invoice_id: invoice.id,
        title: item.title,
        description: item.description || '',
        quantity: 1,
        unit_price: Math.round(item.amount * 50) / 100,
        amount: Math.round(item.amount * 50) / 100,
        sort_order: index,
      }))

      await supabaseAdmin.from('invoice_items').insert(invoiceItems)
    }

    // Send invoice via email
    const client = offer.client
    const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'}/rechnung/${invoice.unique_token}`

    const formatAmount = (amount: number) =>
      new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(amount)

    const formatDate = (date: string) =>
      new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

    try {
      await transporter.sendMail({
        from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
        to: client.email,
        bcc: process.env.SMTP_USER,
        subject: `Rechnung ${invoice.invoice_number}: ${invoice.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">

            <div style="margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #999;">.</span></h1>
            </div>

            <p>Hallo ${client.name},</p>

            <p>Das Projekt <strong>${offer.title}</strong> wurde abgeschlossen. Anbei die Schlussrechnung (50%).</p>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Rechnungsnummer</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Betrag (50% Schlussrechnung)</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; font-weight: bold;">${formatAmount(invoice.total_amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Fällig am</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatDate(invoice.due_date)}</td>
                </tr>
              </table>
            </div>

            <a href="${invoiceUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
              Rechnung ansehen
            </a>

            <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 14px;">
              <strong>Zahlungsverbindung</strong><br>
              ${businessConfig.ibanFormatted}<br>
              ${businessConfig.name}<br>
              ${businessConfig.street}<br>
              ${businessConfig.postalCode} ${businessConfig.city}
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 32px;">
              Vielen Dank für die Zusammenarbeit!<br><br>
              Beste Grüsse<br>
              Pierre
            </p>

            <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
              <p>
                ${businessConfig.name}<br>
                ${businessConfig.email}
              </p>
            </div>

          </body>
          </html>
        `,
        text: `
Hallo ${client.name},

Das Projekt ${offer.title} wurde abgeschlossen. Anbei die Schlussrechnung (50%).

Rechnungsnummer: ${invoice.invoice_number}
Betrag (50% Schlussrechnung): ${formatAmount(invoice.total_amount)}
Fällig am: ${formatDate(invoice.due_date)}

Rechnung ansehen: ${invoiceUrl}

Zahlungsverbindung:
${businessConfig.ibanFormatted}
${businessConfig.name}
${businessConfig.street}
${businessConfig.postalCode} ${businessConfig.city}

Vielen Dank für die Zusammenarbeit!

Beste Grüsse
Pierre
        `.trim(),
      })

      // Mark invoice as sent
      await supabaseAdmin
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)

      return NextResponse.json({ success: true, invoiceSent: true })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
      return NextResponse.json({ success: true, invoiceSent: false })
    }
  } catch (err) {
    console.error('Complete offer error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
