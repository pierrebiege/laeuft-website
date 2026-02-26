import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabase'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

function getEmailTemplate(emailNumber: 1 | 2 | 3, prospect: { contact_name: string; company: string; website: string | null }) {
  const firstName = prospect.contact_name.split(' ')[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'

  const wrapper = (subject: string, body: string, plainBody: string) => ({
    subject,
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

        ${body}

        <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
          <p>
            Pierre Biege<br>
            pierre@laeuft.ch
          </p>
        </div>

      </body>
      </html>
    `,
    text: plainBody,
  })

  if (emailNumber === 1) {
    return wrapper(
      'Ihre Website – ein kurzer Gedanke',
      `
        <p>Hallo ${firstName},</p>

        <p>Ich bin auf die Website von ${prospect.company} gestossen${prospect.website ? ` (<a href="${prospect.website}" style="color: #1a1a1a;">${prospect.website.replace(/^https?:\/\//, '')}</a>)` : ''} und habe mir ein paar Gedanken gemacht.</p>

        <p>Mir ist aufgefallen, dass es ein paar Bereiche gibt, in denen eure Online-Präsenz noch stärker wirken könnte – sei es beim Design, der Ladezeit oder der mobilen Darstellung.</p>

        <p>Ich bin Pierre von <strong>Läuft.</strong> – wir gestalten moderne, performante Websites für Unternehmen im Wallis und der ganzen Schweiz.</p>

        <p>Hättet ihr Interesse an einem kurzen, unverbindlichen Austausch? Ich könnte euch konkret zeigen, wo Potenzial liegt.</p>

        <p>Mehr über uns: <a href="${siteUrl}" style="color: #1a1a1a; font-weight: 500;">${siteUrl.replace(/^https?:\/\//, '')}</a></p>

        <p style="color: #666; font-size: 14px; margin-top: 32px;">
          Beste Grüsse<br>
          Pierre
        </p>
      `,
      `Hallo ${firstName},

Ich bin auf die Website von ${prospect.company} gestossen${prospect.website ? ` (${prospect.website})` : ''} und habe mir ein paar Gedanken gemacht.

Mir ist aufgefallen, dass es ein paar Bereiche gibt, in denen eure Online-Präsenz noch stärker wirken könnte – sei es beim Design, der Ladezeit oder der mobilen Darstellung.

Ich bin Pierre von Läuft. – wir gestalten moderne, performante Websites für Unternehmen im Wallis und der ganzen Schweiz.

Hättet ihr Interesse an einem kurzen, unverbindlichen Austausch? Ich könnte euch konkret zeigen, wo Potenzial liegt.

Mehr über uns: ${siteUrl}

Beste Grüsse
Pierre`.trim()
    )
  }

  if (emailNumber === 2) {
    return wrapper(
      'Kurzes Follow-up',
      `
        <p>Hallo ${firstName},</p>

        <p>Ich habe euch vor ein paar Tagen geschrieben bezüglich eurer Website. Ich wollte nochmal kurz nachhaken, falls die Nachricht untergegangen ist.</p>

        <p>Wir haben kürzlich für ähnliche Unternehmen Websites umgesetzt, die messbar mehr Anfragen generieren – durch besseres Design, schnellere Ladezeiten und eine klare Struktur.</p>

        <p>Wäre ein kurzer Austausch (15 Min.) für euch interessant? Gerne auch einfach per Antwort auf dieses Mail.</p>

        <p style="color: #666; font-size: 14px; margin-top: 32px;">
          Beste Grüsse<br>
          Pierre
        </p>
      `,
      `Hallo ${firstName},

Ich habe euch vor ein paar Tagen geschrieben bezüglich eurer Website. Ich wollte nochmal kurz nachhaken, falls die Nachricht untergegangen ist.

Wir haben kürzlich für ähnliche Unternehmen Websites umgesetzt, die messbar mehr Anfragen generieren – durch besseres Design, schnellere Ladezeiten und eine klare Struktur.

Wäre ein kurzer Austausch (15 Min.) für euch interessant? Gerne auch einfach per Antwort auf dieses Mail.

Beste Grüsse
Pierre`.trim()
    )
  }

  // emailNumber === 3
  return wrapper(
    'Letzter Versuch',
    `
      <p>Hallo ${firstName},</p>

      <p>Ich melde mich ein letztes Mal – ich verstehe, dass ihr viel um die Ohren habt.</p>

      <p>Falls ihr in Zukunft eure Website überarbeiten möchtet, stehe ich gerne zur Verfügung. Ihr könnt euch jederzeit melden.</p>

      <p>Ansonsten wünsche ich euch weiterhin viel Erfolg mit ${prospect.company}!</p>

      <p style="color: #666; font-size: 14px; margin-top: 32px;">
        Beste Grüsse<br>
        Pierre
      </p>
    `,
    `Hallo ${firstName},

Ich melde mich ein letztes Mal – ich verstehe, dass ihr viel um die Ohren habt.

Falls ihr in Zukunft eure Website überarbeiten möchtet, stehe ich gerne zur Verfügung. Ihr könnt euch jederzeit melden.

Ansonsten wünsche ich euch weiterhin viel Erfolg mit ${prospect.company}!

Beste Grüsse
Pierre`.trim()
  )
}

const STATUS_AFTER_EMAIL: Record<number, string> = {
  1: 'kontaktiert',
  2: 'follow_up_1',
  3: 'follow_up_2',
}

export async function POST(request: NextRequest) {
  try {
    const { prospectId, emailNumber } = await request.json()

    if (![1, 2, 3].includes(emailNumber)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Nummer' }, { status: 400 })
    }

    // Get prospect
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()

    if (error || !prospect) {
      return NextResponse.json({ error: 'Prospect nicht gefunden' }, { status: 404 })
    }

    const template = getEmailTemplate(emailNumber as 1 | 2 | 3, prospect)

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
      to: prospect.email,
      bcc: 'pierre@laeuft.ch',
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    // Update prospect status and email timestamp
    const emailField = `email_${emailNumber}_sent_at`
    await supabase
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
