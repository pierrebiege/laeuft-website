import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// POST: Add new prospects (from Claude Scheduled Task or external sources)
// Auth via CRON_SECRET or admin session
export async function POST(request: NextRequest) {
  // Check auth: CRON_SECRET header or admin session
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // OK — authenticated via CRON_SECRET
  } else {
    // Check admin session as fallback
    const sessionCookie = request.cookies.get('admin_session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }
    const { data: session } = await supabaseAdmin
      .from('admin_sessions')
      .select('token')
      .eq('token', sessionCookie)
      .gt('expires_at', new Date().toISOString())
      .single()
    if (!session) {
      return NextResponse.json({ error: 'Session abgelaufen' }, { status: 401 })
    }
  }

  try {
    const { prospects } = await request.json()

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: 'prospects Array erwartet' }, { status: 400 })
    }

    let added = 0
    let skipped = 0
    const results: string[] = []

    for (const p of prospects) {
      if (!p.company || !p.contact_name || !p.email) {
        results.push(`Übersprungen: ${p.company || 'unbekannt'} — Pflichtfelder fehlen`)
        skipped++
        continue
      }

      // Duplikat-Check: gleiche E-Mail oder gleicher Firmenname
      const { data: existing } = await supabaseAdmin
        .from('prospects')
        .select('id')
        .or(`email.eq.${p.email},company.ilike.${p.company}`)
        .limit(1)

      if (existing && existing.length > 0) {
        results.push(`Übersprungen: ${p.company} — bereits vorhanden`)
        skipped++
        continue
      }

      const { error } = await supabaseAdmin
        .from('prospects')
        .insert({
          company: p.company,
          contact_name: p.contact_name,
          email: p.email,
          website: p.website || null,
          prototype_url: p.prototype_url || null,
          notes: p.notes || null,
          status: 'neu',
        })

      if (error) {
        results.push(`Fehler: ${p.company} — ${error.message}`)
        skipped++
      } else {
        results.push(`Hinzugefügt: ${p.company} (${p.contact_name})`)
        added++
      }
    }

    // Send Telegram notification if prospects were added
    if (added > 0 && process.env.TELEGRAM_BOT_TOKEN) {
      const telegramMsg = `🎯 ${added} neue Prospects gefunden!\n\n${results.filter(r => r.startsWith('Hinzugefügt')).join('\n')}`

      // Get chat ID from last message (or use stored one)
      try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        // Try to send to stored chat ID
        const chatId = process.env.TELEGRAM_CHAT_ID
        if (chatId) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: telegramMsg }),
          })
        }
      } catch {
        // Telegram notification failed silently
      }
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      results,
    })
  } catch (err) {
    console.error('Prospects API error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

// GET: List prospects (for Claude Scheduled Task to check duplicates)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('prospects')
    .select('company, email, status')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prospects: data })
}
