import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// This cron reads data/pending-prospects.json (committed by the Claude Scheduled Task)
// and imports new prospects into the database.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const filePath = join(process.cwd(), 'data', 'pending-prospects.json')
    let prospects: Array<{
      company: string
      contact_name: string
      email: string
      website?: string
      notes?: string
    }>

    try {
      const raw = await readFile(filePath, 'utf-8')
      prospects = JSON.parse(raw)
    } catch {
      return NextResponse.json({ message: 'Keine pending-prospects.json gefunden', imported: 0 })
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

      // Skip if no email
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

      const { error } = await supabaseAdmin
        .from('prospects')
        .insert({
          company: p.company,
          contact_name: p.contact_name,
          email: p.email,
          website: p.website || null,
          notes: p.notes || null,
          status: 'neu',
        })

      if (error) {
        results.push(`Fehler: ${p.company} — ${error.message}`)
        skipped++
      } else {
        results.push(`Importiert: ${p.company}`)
        imported++
      }
    }

    // Send Telegram notification
    if (imported > 0) {
      const chatId = process.env.TELEGRAM_CHAT_ID
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (chatId && botToken) {
        const msg = `🎯 ${imported} neue Prospects importiert!\n\n${results.filter(r => r.startsWith('Importiert')).join('\n')}`
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg }),
        })
      }
    }

    // Clear the file after import
    await writeFile(filePath, '[]', 'utf-8')

    return NextResponse.json({ success: true, imported, skipped, results })
  } catch (err) {
    console.error('Import prospects error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
