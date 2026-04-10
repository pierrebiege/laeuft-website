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
      </div>
      ${body}
      <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
        <p>Pierre Biege<br>pierre@laeuft.ch</p>
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
    host: process.env.SMTP_HOST!,
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
  let sent = 0

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
      await sendAndTrack(prospect, 2, subject, body)
      sent++
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
      await sendAndTrack(prospect, 3, subject, body)
      sent++
    } catch (e) {
      console.error(`Follow-up 2 failed for ${prospect.company}:`, e)
    }
  }

  return sent
}

async function generateAIEmail(
  prospect: { company: string; contact_name: string; website: string | null; notes: string | null; prototype_url: string | null; email_1_sent_at: string | null },
  emailNumber: 2 | 3
): Promise<{ subject: string; body: string }> {
  const anthropic = new Anthropic()
  const firstName = prospect.contact_name.split(' ')[0]

  const prompt = emailNumber === 2
    ? `Schreibe ein kurzes, freundliches Follow-up für ${firstName} von ${prospect.company}. Erstmail war am ${prospect.email_1_sent_at ? new Date(prospect.email_1_sent_at).toLocaleDateString('de-CH') : 'vor ein paar Tagen'}.${prospect.prototype_url ? ` Prototyp: ${prospect.prototype_url}` : ''} Nachhaken ob die Mail angekommen ist. Max 4 Sätze.

Format: BETREFF: [Betreff]\n---\n[Text]`
    : `Schreibe ein letztes, freundliches Abschluss-Follow-up für ${firstName} von ${prospect.company}. Tür offen lassen, kein Druck. Max 4 Sätze.

Format: BETREFF: [Betreff]\n---\n[Text]`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: 'Du bist Pierre Biege von "Läuft." im Wallis. Schreibe kurze, direkte Mails auf Deutsch. Keine Marketing-Floskeln. Duze den Empfänger. Unterschreibe mit "Beste Grüsse\nPierre".',
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
