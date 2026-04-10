import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

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
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #999;">.</span></h1>
        <p style="font-size: 13px; color: #999; margin: 4px 0 0 0;">Websites · AI-Integration · Digitale Systeme</p>
      </div>
      ${body}
      <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
        <p>Pierre Biege · <a href="https://laeuft.ch" style="color: #999;">laeuft.ch</a><br>Beste Grüsse aus Albinen</p>
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

// GET for Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  // Step 1: Check inbox for replies
  try {
    const replyCount = await checkInboxForReplies()
    results.push(`Inbox: ${replyCount} Antworten erkannt`)
  } catch (e) {
    results.push(`Inbox-Check fehlgeschlagen: ${e}`)
  }

  // Step 2: Send automatic follow-ups
  try {
    const followUpCount = await sendAutoFollowUps()
    results.push(`Follow-ups: ${followUpCount} gesendet`)
  } catch (e) {
    results.push(`Follow-ups fehlgeschlagen: ${e}`)
  }

  return NextResponse.json({ success: true, results })
}

async function checkInboxForReplies(): Promise<number> {
  const { data: prospects } = await supabaseAdmin
    .from('prospects')
    .select('*')
    .in('status', ['kontaktiert', 'follow_up_1', 'follow_up_2'])

  if (!prospects || prospects.length === 0) return 0

  const emailMap = new Map<string, typeof prospects[0]>()
  for (const p of prospects) {
    emailMap.set(p.email.toLowerCase(), p)
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.mail.hostpoint.ch',
    port: 993,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
    logger: false,
  })

  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  let repliesFound = 0

  try {
    const since = new Date()
    since.setDate(since.getDate() - 14)

    const messages = client.fetch(
      { since },
      { envelope: true, source: true }
    )

    for await (const msg of messages) {
      if (!msg.source) continue
      const parsed = await simpleParser(msg.source)
      const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase()

      if (fromEmail && emailMap.has(fromEmail)) {
        const prospect = emailMap.get(fromEmail)!

        await supabaseAdmin
          .from('prospects')
          .update({
            status: 'geantwortet',
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', prospect.id)

        repliesFound++
        emailMap.delete(fromEmail)
      }
    }
  } finally {
    lock.release()
  }

  await client.logout()
  return repliesFound
}

async function sendAutoFollowUps(): Promise<number> {
  const now = new Date()
  let queued = 0

  // Get Telegram chat ID
  const { data: config } = await supabaseAdmin
    .from('dashboard_config')
    .select('telegram_chat_id')
    .limit(1)
    .single()

  const chatId = process.env.TELEGRAM_CHAT_ID || config?.telegram_chat_id

  // Erstmails for new prospects (added by Scheduled Task or manually)
  const { data: newProspects } = await supabaseAdmin
    .from('prospects')
    .select('*')
    .eq('status', 'neu')
    .is('email_1_sent_at', null)

  for (const prospect of newProspects || []) {
    try {
      const { subject, body } = await generateAIEmail(prospect, 1)
      await queueEmailForApproval(prospect, 1, subject, body, chatId)
      queued++
    } catch (e) {
      console.error(`Erstmail generation failed for ${prospect.company}:`, e)
    }
  }

  // Follow-up 1: 5 days after first email
  const { data: needFollowUp1 } = await supabaseAdmin
    .from('prospects')
    .select('*')
    .eq('status', 'kontaktiert')
    .is('email_2_sent_at', null)
    .lt('email_1_sent_at', new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString())

  for (const prospect of needFollowUp1 || []) {
    try {
      const { subject, body } = await generateAIEmail(prospect, 2)
      await queueEmailForApproval(prospect, 2, subject, body, chatId)
      queued++
    } catch (e) {
      console.error(`Follow-up 1 failed for ${prospect.company}:`, e)
    }
  }

  // Follow-up 2: 5 days after second email
  const { data: needFollowUp2 } = await supabaseAdmin
    .from('prospects')
    .select('*')
    .eq('status', 'follow_up_1')
    .is('email_3_sent_at', null)
    .lt('email_2_sent_at', new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString())

  for (const prospect of needFollowUp2 || []) {
    try {
      const { subject, body } = await generateAIEmail(prospect, 3)
      await queueEmailForApproval(prospect, 3, subject, body, chatId)
      queued++
    } catch (e) {
      console.error(`Follow-up 2 failed for ${prospect.company}:`, e)
    }
  }

  return queued
}

async function queueEmailForApproval(
  prospect: { id: string; company: string; contact_name: string; email: string },
  emailNumber: 1 | 2 | 3,
  subject: string,
  body: string,
  chatId: string | null
) {
  // Check if there's already a pending email for this prospect + emailNumber
  const { data: existing } = await supabaseAdmin
    .from('pending_emails')
    .select('id')
    .eq('prospect_id', prospect.id)
    .eq('email_number', emailNumber)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) return // already queued

  // Create pending email
  const { data: pending, error } = await supabaseAdmin
    .from('pending_emails')
    .insert({
      prospect_id: prospect.id,
      email_number: emailNumber,
      subject,
      body,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !pending) return

  // Send Telegram approval message — full mail text + buttons
  if (chatId) {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
    const emailLabel = emailNumber === 1 ? 'Erstmail' : `Follow-up ${emailNumber - 1}`

    // First message: full mail content
    const fullText = `📧 ${emailLabel} an ${prospect.company}\n👤 ${prospect.contact_name} (${prospect.email})\n📋 Betreff: ${subject}\n\n${body}`

    // Telegram limit is 4096 chars — truncate cleanly if needed
    const safeText = fullText.length > 4000
      ? fullText.slice(0, 3997) + '...'
      : fullText

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: safeText,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Senden', callback_data: `approve:${pending.id}` },
            { text: '❌ Überspringen', callback_data: `reject:${pending.id}` },
          ]],
        },
      }),
    })

    const data = await res.json()
    if (data.result?.message_id) {
      await supabaseAdmin
        .from('pending_emails')
        .update({ telegram_message_id: data.result.message_id })
        .eq('id', pending.id)
    }
  }
}

async function generateAIEmail(
  prospect: { company: string; contact_name: string; website: string | null; notes: string | null; prototype_url: string | null; email_1_sent_at: string | null },
  emailNumber: 1 | 2 | 3
): Promise<{ subject: string; body: string }> {
  const anthropic = new Anthropic()
  const firstName = prospect.contact_name.split(' ')[0]

  let prompt: string

  if (emailNumber === 1) {
    prompt = `ERSTMAIL an ${firstName} von ${prospect.company}.
${prospect.website ? `Website: ${prospect.website}` : 'Keine Website bekannt.'}
${prospect.notes ? `Research: ${prospect.notes}` : ''}
${prospect.prototype_url ? `Prototyp gebaut: ${prospect.prototype_url}` : ''}

REGELN:
- Erster Satz: Zeige dass du dich mit DEREN Geschäft beschäftigt hast. Nenne ein KONKRETES Detail aus den Research-Notizen.
- Kernbotschaft: In 2-3 Sätzen den Wert klar machen. Ein konkretes Ergebnis oder eine Beobachtung.
- Falls Prototyp-Link: "Ich hab mir eure Website angeschaut und einen kurzen Entwurf gemacht" + Link
- CTA: GENAU EINE Frage, niedrige Hürde. "Lohnt sich ein kurzer Austausch?" oder "Darf ich den Entwurf zeigen — 15 Min reichen."
- STRIKT 80-120 Wörter. Auf dem Handy ohne Scrollen lesbar.
- VERBOTEN: Selbstvorstellung, "Ich bin...", "Mein Name ist...", mehrere CTAs, Anhänge erwähnen, Höflichkeitsfloskeln

KRITISCH — KEINE SPEKULATIONEN:
- Behaupte NUR Dinge die EXPLIZIT in den Research-Notizen stehen
- Wenn in den Notizen steht "kein Buchungssystem" → darfst du das sagen
- Wenn es NICHT in den Notizen steht → NICHT behaupten dass etwas fehlt
- ERFINDE KEINE fehlenden Features. Du hast die Website nicht selbst gesehen.
- Lieber einen allgemeineren aber wahren Angle als einen spezifischen aber falschen
- Im Zweifelsfall: Frage stellen statt behaupten. "Wie läuft bei euch X?" statt "Euch fehlt X."

Format:
BETREFF: [3-7 Wörter, Bezug zum Empfänger, z.B. "Idee für ${prospect.company}"]
---
[Mail-Text, 80-120 Wörter, dann Signatur]`
  } else if (emailNumber === 2) {
    prompt = `FOLLOW-UP #1 an ${firstName} von ${prospect.company}.
Erstmail: ${prospect.email_1_sent_at ? new Date(prospect.email_1_sent_at).toLocaleDateString('de-CH') : 'vor ein paar Tagen'}
${prospect.prototype_url ? `Prototyp: ${prospect.prototype_url}` : ''}

REGELN:
- NICHT "Ich wollte nur mal nachhaken" — das ist wertlos
- Bringe NEUEN Wert: eine Beobachtung, ein Insight, ein konkreter Quick-Win für deren Business
- Erwähne beiläufig die letzte Mail
- EINE Ja/Nein-Frage am Ende
- STRIKT 60-80 Wörter. Kürzer als die Erstmail.

Format:
BETREFF: [3-5 Wörter, kurz und persönlich]
---
[Mail-Text, 60-80 Wörter, dann Signatur]`
  } else {
    prompt = `BREAKUP-MAIL an ${firstName} von ${prospect.company}.

REGELN:
- Ehrlich und menschlich. "Ich will nicht nerven."
- Respektiere dass jetzt nicht der Zeitpunkt ist
- Tür offen lassen für die Zukunft
- STRIKT 40-60 Wörter. Maximal 3-4 Sätze.
- Kein Druck, keine Schuldgefühle

Format:
BETREFF: [3-4 Wörter, ehrlich]
---
[Mail-Text, 40-60 Wörter, dann Signatur]`
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `Du bist Pierre Biege. Cold Outreach für "Läuft." — Agentur für Websites, AI-Integration, digitale Systeme. Albinen VS. https://laeuft.ch

GOLDENE REGELN:
1. BETREFF: 3-7 Wörter. Konkret. Bezug zum Empfänger. Kein Clickbait. z.B. "Idee für [Firma]" oder "Kurze Frage zu [Thema]"
2. ANREDE: Wenn die E-Mail eine persönliche Adresse ist (vorname@firma.ch) → "Hallo [Vorname],". Wenn es eine allgemeine Adresse ist (info@, kontakt@, office@) → "Hallo zusammen," und das Team ansprechen, KEINEN einzelnen Namen verwenden.
3. ERSTER SATZ: Über SIE. Nie über dich. Zeige dass du recherchiert hast.
3. KERN: 2-3 Sätze konkreter Wert. Kein Feature-Listing. Ein Ergebnis oder eine Beobachtung.
4. CTA: Genau EINE Frage. Niedrige Hürde. "Lohnt sich ein kurzer Austausch?" oder "15 Min reichen."
5. LÄNGE: 80-120 Wörter Erstmail. 60-80 Follow-up. 40-60 Breakup. Auf dem Handy ohne Scrollen lesbar.
6. SIGNATUR: Beste Grüsse, Pierre Biege, https://laeuft.ch

VERBOTEN: "Ich bin Pierre Biege", Firmenvorstellung, mehrere CTAs, Anhänge, "revolutionär", "Game-Changer", "innovativ", "Ich hoffe diese Mail findet dich gut", übertriebene Höflichkeit, SPEKULATIONEN über Features die nicht in den Research-Notizen stehen.

STIL: Mensch, nicht Agentur. Duzen. Konkret. Greifbar. Jeder Satz hat einen Zweck. NUR FAKTEN aus den Research-Notizen verwenden — im Zweifel fragen statt behaupten ("Wie löst ihr X aktuell?" statt "Euch fehlt X.").

REFERENZ:
"Eure Weinkarte online ist ein PDF aus 2019 — ich hab mir vorgestellt wie das als interaktive Seite aussehen könnte. Hier der Entwurf: [link]. Was meinst du?"`,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as { type: string; text: string }).text
  const subjectMatch = text.match(/BETREFF:\s*(.+)/i)
  const bodyMatch = text.split(/---\n?/)

  return {
    subject: subjectMatch?.[1]?.trim() || `Follow-up – ${prospect.company}`,
    body: (bodyMatch[1] || text).trim(),
  }
}

async function sendAndTrack(
  prospect: { id: string; email: string; company: string },
  emailNumber: 2 | 3,
  subject: string,
  body: string
) {
  await transporter.sendMail({
    from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
    to: prospect.email,
    bcc: 'pierre@laeuft.ch',
    subject,
    html: wrapHtml(plainTextToHtml(body)),
    text: body,
  })

  const emailField = `email_${emailNumber}_sent_at`
  const statusMap: Record<number, string> = { 2: 'follow_up_1', 3: 'follow_up_2' }

  await supabaseAdmin
    .from('prospects')
    .update({
      status: statusMap[emailNumber],
      [emailField]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', prospect.id)
}
