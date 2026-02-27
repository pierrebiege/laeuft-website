import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabase'
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
    const { invoiceId } = await request.json()

    // Get invoice with client
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, client:clients(*), items:invoice_items(*)`)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    const client = invoice.client
    const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'}/rechnung/${invoice.unique_token}`

    // Format amount
    const formatAmount = (amount: number) =>
      new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(amount)

    // Format date
    const formatDate = (date: string) =>
      new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

    // Send email
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

          <p>Anbei die Rechnung für <strong>${invoice.title}</strong>.</p>

          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Rechnungsnummer</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Betrag</td>
                <td style="padding: 8px 0; text-align: right; font-size: 24px; font-weight: bold;">${formatAmount(invoice.total_amount)}</td>
              </tr>
              ${invoice.due_date ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Fällig am</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatDate(invoice.due_date)}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p>Die Rechnung enthält einen Swiss QR-Code für eine einfache Zahlung via E-Banking oder Mobile Banking.</p>

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

Anbei die Rechnung für ${invoice.title}.

Rechnungsnummer: ${invoice.invoice_number}
Betrag: ${formatAmount(invoice.total_amount)}
${invoice.due_date ? `Fällig am: ${formatDate(invoice.due_date)}` : ''}

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

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }
}
