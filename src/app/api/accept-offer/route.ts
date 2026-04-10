import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { businessConfig } from '@/lib/business-config'

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

    if (offer.status !== 'draft' && offer.status !== 'sent') {
      return NextResponse.json({ error: 'Offerte kann nicht mehr angenommen werden' }, { status: 400 })
    }

    // 1. Accept the offer
    const { error: updateError } = await supabaseAdmin
      .from('offers')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', offerId)

    if (updateError) {
      return NextResponse.json({ error: 'Fehler beim Akzeptieren' }, { status: 500 })
    }

    // 2. Create first invoice (50% Anzahlung)
    const halfAmount = Math.round(offer.total_amount * 50) / 100
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + businessConfig.defaultPaymentDays)

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        client_id: offer.client_id,
        offer_id: offer.id,
        title: `${offer.title} – Anzahlung 50%`,
        description: `Erste Teilrechnung (50%) gemäss Offerte "${offer.title}"`,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
        total_amount: halfAmount,
        notes: `Automatisch erstellt bei Auftragsannahme. Zweite Rechnung (50%) folgt bei Projektabschluss.`,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError)
      // Offer is accepted but invoice failed — still return success for the acceptance
      return NextResponse.json({ success: true, invoiceCreated: false })
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

    // 3. Send invoice via email
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

            <p>Vielen Dank für die Annahme der Offerte <strong>${offer.title}</strong>! Anbei die erste Teilrechnung (50% Anzahlung).</p>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Rechnungsnummer</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Betrag (50% Anzahlung)</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; font-weight: bold;">${formatAmount(invoice.total_amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Fällig am</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatDate(invoice.due_date)}</td>
                </tr>
              </table>
            </div>

            <p style="color: #666; font-size: 14px;">Die zweite Teilrechnung (50%) folgt bei Projektabschluss.</p>

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
              Bei Fragen melde dich jederzeit.<br><br>
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

Vielen Dank für die Annahme der Offerte ${offer.title}! Anbei die erste Teilrechnung (50% Anzahlung).

Rechnungsnummer: ${invoice.invoice_number}
Betrag (50% Anzahlung): ${formatAmount(invoice.total_amount)}
Fällig am: ${formatDate(invoice.due_date)}

Die zweite Teilrechnung (50%) folgt bei Projektabschluss.

Rechnung ansehen: ${invoiceUrl}

Zahlungsverbindung:
${businessConfig.ibanFormatted}
${businessConfig.name}
${businessConfig.street}
${businessConfig.postalCode} ${businessConfig.city}

Bei Fragen melde dich jederzeit.

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

      return NextResponse.json({ success: true, invoiceCreated: true, invoiceSent: true })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
      // Invoice created but email failed
      return NextResponse.json({ success: true, invoiceCreated: true, invoiceSent: false })
    }
  } catch (err) {
    console.error('Accept offer error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
