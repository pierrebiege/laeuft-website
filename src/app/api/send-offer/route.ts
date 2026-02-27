import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabase'
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

    // Get offer with client
    const { data: offer, error } = await supabase
      .from('offers')
      .select(`*, client:clients(*), items:offer_items(*)`)
      .eq('id', offerId)
      .single()

    if (error || !offer) {
      return NextResponse.json({ error: 'Offerte nicht gefunden' }, { status: 404 })
    }

    const client = offer.client
    const offerUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'}/angebot/${offer.unique_token}`

    // Format amount
    const formatAmount = (amount: number) =>
      new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }).format(amount)

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
      to: client.email,
      bcc: process.env.SMTP_USER,
      subject: `Offerte: ${offer.title}`,
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

          <p>Hier ist die Offerte für <strong>${offer.title}</strong>.</p>

          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Gesamtbetrag</div>
            <div style="font-size: 32px; font-weight: bold;">${formatAmount(offer.total_amount)}</div>
            ${offer.valid_until ? `<div style="font-size: 14px; color: #666; margin-top: 8px;">Gültig bis ${new Date(offer.valid_until).toLocaleDateString('de-CH')}</div>` : ''}
          </div>

          <p>Alle Details findest du in der Offerte. Du kannst sie dort auch direkt online annehmen.</p>

          <a href="${offerUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
            Offerte ansehen
          </a>

          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            Bei Fragen melde dich jederzeit.<br><br>
            Beste Grüsse<br>
            Pierre
          </p>

          <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
            <p>
              Pierre Biege<br>
              pierre@laeuft.ch
            </p>
          </div>

        </body>
        </html>
      `,
      text: `
Hallo ${client.name},

Hier ist die Offerte für ${offer.title}.

Gesamtbetrag: ${formatAmount(offer.total_amount)}

Offerte ansehen: ${offerUrl}

Bei Fragen melde dich jederzeit.

Beste Grüsse
Pierre
      `.trim(),
    })

    // Update offer status
    await supabase
      .from('offers')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', offerId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }
}
