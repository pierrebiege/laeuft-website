import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
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

function wrapHtml(body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">

      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #999;">.</span></h1>
        <p style="font-size: 13px; color: #999; margin: 4px 0 0 0;">Websites · AI-Integration · Digitale Systeme</p>
      </div>

      ${body}

      <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
        <p>
          Pierre Biege · <a href="https://laeuft.ch" style="color: #999;">laeuft.ch</a><br>
          Beste Grüsse aus Albinen
        </p>
      </div>

    </body>
    </html>
  `
}

function plainTextToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

const STATUS_AFTER_EMAIL: Record<number, string> = {
  1: 'kontaktiert',
  2: 'follow_up_1',
  3: 'follow_up_2',
}

export async function POST(request: NextRequest) {
  // Allow auth via CRON_SECRET or admin session
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    // OK — CRON_SECRET auth
  } else {
    const authError = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const { prospectId, emailNumber, customSubject, customBody } = await request.json()

    if (![1, 2, 3].includes(emailNumber)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Nummer' }, { status: 400 })
    }

    // Get prospect
    const { data: prospect, error } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()

    if (error || !prospect) {
      return NextResponse.json({ error: 'Prospect nicht gefunden' }, { status: 404 })
    }

    const subject = customSubject
    const htmlBody = wrapHtml(plainTextToHtml(customBody))

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
      to: prospect.email,
      bcc: 'pierre@laeuft.ch',
      subject,
      html: htmlBody,
      text: customBody,
    })

    // Update prospect status and email timestamp
    const emailField = `email_${emailNumber}_sent_at`
    await supabaseAdmin
      .from('prospects')
      .update({
        status: STATUS_AFTER_EMAIL[emailNumber],
        [emailField]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', prospectId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Prospect email error:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }
}
