import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// This cron fetches data/pending-prospects.json from GitHub (committed by Claude Scheduled Task)
// and imports new prospects into the database, then clears the file via GitHub API.

const GITHUB_REPO = 'pierrebiege/laeuft-website'
const FILE_PATH = 'data/pending-prospects.json'

async function fetchFromGitHub(): Promise<{ content: string; sha: string } | null> {
  // Use GitHub API to read the file — no auth needed for public repos,
  // but we use the token if available for private repos
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' }
  const token = process.env.GITHUB_TOKEN
  if (token) headers['Authorization'] = `token ${token}`

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, { headers })

  if (!res.ok) return null

  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

async function clearFileOnGitHub(sha: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return // Can't clear without token

  const emptyContent = Buffer.from('[]').toString('base64')

  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'chore: Prospects importiert, Datei geleert',
      content: emptyContent,
      sha,
    }),
  })
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch from GitHub API instead of filesystem
    const file = await fetchFromGitHub()

    if (!file) {
      return NextResponse.json({ message: 'pending-prospects.json nicht auf GitHub gefunden', imported: 0 })
    }

    let prospects: Array<{
      company: string
      contact_name: string
      email: string
      website?: string
      notes?: string
    }>

    try {
      prospects = JSON.parse(file.content)
    } catch {
      return NextResponse.json({ message: 'JSON parse error', imported: 0 })
    }

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ message: 'Keine neuen Prospects', imported: 0 })
    }

    let imported = 0
    let skipped = 0
    const results: string[] = []

    for (const p of prospects) {
      if (!p.company || !p.contact_name) {
        skipped++
        continue
      }

      if (!p.email) {
        results.push(`Übersprungen: ${p.company} — keine E-Mail`)
        skipped++
        continue
      }

      // Duplikat-Check
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

      const { data: inserted, error } = await supabaseAdmin
        .from('prospects')
        .insert({
          company: p.company,
          contact_name: p.contact_name,
          email: p.email,
          website: p.website || null,
          notes: p.notes || null,
          status: 'neu',
        })
        .select()
        .single()

      if (error || !inserted) {
        results.push(`Fehler: ${p.company} — ${error?.message}`)
        skipped++
        continue
      }

      results.push(`Importiert: ${p.company}`)
      imported++

      // Send research Telegram message per prospect
      const chatId = process.env.TELEGRAM_CHAT_ID
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (chatId && botToken) {
        const notesText = p.notes ? `\n📋 Research:\n${p.notes.slice(0, 800)}` : ''
        const text = `🎯 Neuer Prospect: ${p.company}\n👤 ${p.contact_name}\n📧 ${p.email}${p.website ? `\n🌐 ${p.website}` : ''}${notesText}\n\n💡 Baue einen Prototyp und antworte auf diese Nachricht mit dem Link.`

        const safeText = text.length > 4000 ? text.slice(0, 3997) + '...' : text

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: safeText }),
        })

        const tgData = await tgRes.json()
        if (tgData.result?.message_id) {
          await supabaseAdmin
            .from('prospects')
            .update({
              research_msg_id: tgData.result.message_id,
              research_chat_id: String(chatId),
            })
            .eq('id', inserted.id)
        }
      }
    }

    // Clear the file on GitHub after successful import
    if (imported > 0) {
      await clearFileOnGitHub(file.sha)
    }

    return NextResponse.json({ success: true, imported, skipped, results })
  } catch (err) {
    console.error('Import prospects error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
