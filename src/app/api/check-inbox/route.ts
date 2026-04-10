import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  return handler()
}

// GET for Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handler()
}

async function handler() {
  try {
    // Get all prospects that are waiting for a reply
    const { data: prospects } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .in('status', ['kontaktiert', 'follow_up_1', 'follow_up_2'])

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ message: 'Keine offenen Prospects', checked: 0, replies: 0 })
    }

    // Build email lookup map
    const emailMap = new Map<string, typeof prospects[0]>()
    for (const p of prospects) {
      emailMap.set(p.email.toLowerCase(), p)
    }

    // Connect to IMAP
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

    // Search for recent emails (last 14 days)
    const lock = await client.getMailboxLock('INBOX')
    let repliesFound = 0
    const repliedProspects: string[] = []

    try {
      const since = new Date()
      since.setDate(since.getDate() - 14)

      const messages = client.fetch(
        { since, seen: false },
        { envelope: true, source: true }
      )

      for await (const msg of messages) {
        if (!msg.source) continue
        const parsed = await simpleParser(msg.source)
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase()

        if (fromEmail && emailMap.has(fromEmail)) {
          const prospect = emailMap.get(fromEmail)!

          // Update prospect status to "geantwortet"
          await supabaseAdmin
            .from('prospects')
            .update({
              status: 'geantwortet',
              responded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              notes: prospect.notes
                ? `${prospect.notes}\n\n--- Antwort am ${new Date().toLocaleDateString('de-CH')} ---\n${parsed.text?.slice(0, 500) || '(Antwort erkannt)'}`
                : `--- Antwort am ${new Date().toLocaleDateString('de-CH')} ---\n${parsed.text?.slice(0, 500) || '(Antwort erkannt)'}`,
            })
            .eq('id', prospect.id)

          repliesFound++
          repliedProspects.push(`${prospect.contact_name} (${prospect.company})`)

          // Remove from map so we don't process duplicates
          emailMap.delete(fromEmail)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()

    return NextResponse.json({
      success: true,
      checked: prospects.length,
      replies: repliesFound,
      repliedProspects,
    })
  } catch (err) {
    console.error('Inbox check error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
