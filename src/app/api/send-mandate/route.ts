import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

// Email configuration
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
    const { mandateId } = await request.json()

    if (!mandateId) {
      return NextResponse.json({ error: 'Mandate ID required' }, { status: 400 })
    }

    // Get mandate with client and pricing phases
    const { data: mandate, error: mandateError } = await supabase
      .from('mandates')
      .select(`
        *,
        client:clients(*),
        pricing_phases:mandate_pricing_phases(*)
      `)
      .eq('id', mandateId)
      .single()

    if (mandateError || !mandate) {
      console.error('Mandate not found:', mandateError)
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    if (mandate.status !== 'draft') {
      return NextResponse.json({ error: 'Mandate already sent' }, { status: 400 })
    }

    const client = mandate.client
    if (!client) {
      console.error('Client not found for mandate:', mandate.id)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    const mandateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://laeuft.ch'}/mandat/${mandate.unique_token}`

    // Sort pricing phases
    const pricingPhases = (mandate.pricing_phases || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    )

    // Format pricing for email
    const pricingHtml = pricingPhases.map((phase: { label: string; amount: number; description: string | null }) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
          <strong>${phase.label}</strong><br>
          <span style="color: #71717a; font-size: 13px;">${phase.description || ''}</span>
        </td>
        <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #e4e4e7; font-size: 18px; font-weight: bold;">
          CHF ${new Intl.NumberFormat('de-CH').format(phase.amount)}.–
        </td>
      </tr>
    `).join('')

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #18181b; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="margin-bottom: 30px;">
    <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #a1a1aa">.</span></h1>
    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Digital Systems & Branding</p>
  </div>

  <p style="font-size: 16px; margin-bottom: 8px;">
    ${client.company ? `${client.company}` : ''}
  </p>
  <p style="margin: 0 0 24px 0;">
    ${client.name}
  </p>

  <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 16px 0;">
    ${mandate.title}
  </h2>

  ${mandate.introduction ? `<p style="color: #52525b; margin-bottom: 24px;">${mandate.introduction}</p>` : ''}

  ${pricingPhases.length > 0 ? `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    ${pricingHtml}
  </table>
  ` : ''}

  <div style="text-align: center; margin: 32px 0;">
    <a href="${mandateUrl}" style="display: inline-block; background: #18181b; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Mandat-Offerte ansehen
    </a>
  </div>

  <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
    Die vollständige Offerte mit allen Details und Auswahloptionen findest du unter dem obigen Link. Du kannst dort direkt deine Wahl treffen.
  </p>

  <p style="margin-top: 32px;">
    Freundliche Grüsse<br>
    <strong>Pierre Biege</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; color: #a1a1aa; font-size: 12px;">
    <p style="margin: 0;">Pierre Biege | Digital Systems & Branding</p>
    <p style="margin: 4px 0 0 0;">Tschangaladongastrasse 3 | 3955 Albinen</p>
    <p style="margin: 4px 0 0 0;">079 853 36 72 | pierre@laeuft.ch | laeuft.ch</p>
  </div>

</body>
</html>
`

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER || 'pierre@laeuft.ch'}>`,
      to: client.email,
      bcc: process.env.SMTP_USER || 'pierre@laeuft.ch',
      subject: `${mandate.title} - ${client.company || client.name}`,
      html: emailHtml,
    })

    // Update mandate status
    await supabase
      .from('mandates')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', mandateId)

    return NextResponse.json({
      success: true,
      message: `Mandat gesendet an ${client.email}`,
    })
  } catch (error) {
    console.error('Send mandate error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to send mandate: ${errorMessage}` }, { status: 500 })
  }
}
