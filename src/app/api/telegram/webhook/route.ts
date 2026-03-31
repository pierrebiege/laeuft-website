import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { extractInsightsFromImage } from '@/lib/instagram-ocr'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function POST(request: NextRequest) {
  const body = await request.json()
  const message = body.message

  if (!message?.photo) {
    if (message?.text) {
      await sendTelegramMessage(
        message.chat.id,
        'Schick mir einen Screenshot von Instagram Insights (Aufrufe oder Interaktionen) und ich erkenne die Daten automatisch. \u{1F4CA}'
      )
    }
    return NextResponse.json({ ok: true })
  }

  // Get the largest photo
  const photo = message.photo[message.photo.length - 1]
  const fileId = photo.file_id

  // Download photo from Telegram
  const fileRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`
  )
  const fileData = await fileRes.json()
  const filePath = fileData.result.file_path
  const imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`

  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')

  try {
    const data = await extractInsightsFromImage(base64Image)

    // Calculate absolute values from percentages
    const total = data.total_value
    const storiesValue = data.stories_pct ? Math.round(total * data.stories_pct / 100) : null
    const reelsValue = data.reels_pct ? Math.round(total * data.reels_pct / 100) : null
    const postsValue = data.posts_pct ? Math.round(total * data.posts_pct / 100) : null

    // Upsert to Supabase
    const { error } = await supabaseAdmin
      .from('instagram_manual_insights')
      .upsert(
        {
          period: data.period,
          metric_type: data.metric_type,
          total_value: data.total_value,
          follower_pct: data.follower_pct,
          non_follower_pct: data.non_follower_pct,
          stories_pct: data.stories_pct,
          reels_pct: data.reels_pct,
          posts_pct: data.posts_pct,
          erreichte_konten: data.erreichte_konten,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'period,metric_type' }
      )

    if (error) throw error

    // Format confirmation message
    const typeLabel = data.metric_type === 'aufrufe' ? '\u{1F441} Aufrufe' : '\u{1F4AC} Interaktionen'
    const periodLabel = `${data.period} Tage`

    let msg = `\u2705 ${typeLabel} (${periodLabel}) gespeichert!\n\n`
    msg += `\u{1F4CA} Gesamt: ${total.toLocaleString('de-CH')}\n`
    if (data.follower_pct != null) {
      msg += `\u{1F465} Follower: ${data.follower_pct}% | Nicht-Follower: ${data.non_follower_pct}%\n`
    }
    msg += `\n\u{1F4C8} Nach Content-Art:\n`
    if (storiesValue != null) msg += `  Stories: ${storiesValue.toLocaleString('de-CH')} (${data.stories_pct}%)\n`
    if (reelsValue != null) msg += `  Reels: ${reelsValue.toLocaleString('de-CH')} (${data.reels_pct}%)\n`
    if (postsValue != null) msg += `  Beitr\u00e4ge: ${postsValue.toLocaleString('de-CH')} (${data.posts_pct}%)\n`
    if (data.erreichte_konten) {
      msg += `\n\u{1F3AF} Erreichte Konten: ${data.erreichte_konten.toLocaleString('de-CH')}`
    }

    await sendTelegramMessage(message.chat.id, msg)
  } catch (e) {
    await sendTelegramMessage(
      message.chat.id,
      `\u274C Konnte die Daten nicht erkennen. Bitte einen klaren Screenshot schicken.\n\nFehler: ${(e as Error).message}`
    )
  }

  return NextResponse.json({ ok: true })
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}
