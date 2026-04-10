import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { extractInsightsFromImage } from '@/lib/instagram-ocr'
import { classifyImage, analyzeStoryGrid, splitStoryGrid } from '@/lib/story-grid-splitter'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function POST(request: NextRequest) {
  const body = await request.json()
  const message = body.message

  if (!message?.photo) {
    if (message?.text) {
      await sendTelegramMessage(
        message.chat.id,
        '📸 Schick mir einen Screenshot!\n\n' +
        '• Story-Grid → Stories werden automatisch zerschnitten & gespeichert\n' +
        '• Insights-Screenshot → Aufrufe/Interaktionen werden erkannt\n\n' +
        'Einfach Bild schicken, ich erkenne automatisch was es ist.'
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
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
  const base64Image = imageBuffer.toString('base64')

  try {
    // Classify the image first
    const imageType = await classifyImage(base64Image)

    if (imageType === 'story_grid') {
      await handleStoryGrid(message.chat.id, imageBuffer, base64Image)
    } else if (imageType === 'insights') {
      await handleInsights(message.chat.id, base64Image)
    } else {
      await sendTelegramMessage(
        message.chat.id,
        '🤔 Konnte das Bild nicht zuordnen. Bitte schick mir entweder:\n• Ein Story-Grid (mehrere Stories im Raster)\n• Einen Insights-Screenshot (Aufrufe/Interaktionen)'
      )
    }
  } catch (e) {
    await sendTelegramMessage(
      message.chat.id,
      `❌ Fehler: ${(e as Error).message}`
    )
  }

  return NextResponse.json({ ok: true })
}

async function handleStoryGrid(chatId: number, imageBuffer: Buffer, base64Image: string) {
  await sendTelegramMessage(chatId, '🔍 Story-Grid erkannt! Analysiere...')

  // Analyze grid structure + view counts
  const gridResult = await analyzeStoryGrid(base64Image)

  // Split into individual stories
  const splitStories = await splitStoryGrid(imageBuffer, gridResult)

  if (splitStories.length === 0) {
    await sendTelegramMessage(chatId, '⚠️ Keine Stories im Grid gefunden.')
    return
  }

  const now = new Date()
  const timestamp = `${now.toISOString().split('T')[0]}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`
  let saved = 0
  let skipped = 0

  for (const story of splitStories) {
    const storyId = `telegram-${timestamp}-${story.index.toString().padStart(2, '0')}`

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('instagram_story_archive')
      .select('id')
      .eq('story_id', storyId)
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Upload image to Supabase Storage
    const storagePath = `stories/${storyId}.jpg`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('instagram')
      .upload(storagePath, story.imageBuffer, {
        upsert: true,
        contentType: 'image/jpeg',
      })

    if (uploadError) {
      console.error('Story upload error:', uploadError.message)
      continue
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('instagram')
      .getPublicUrl(storagePath)

    // Insert into DB
    const { error: dbError } = await supabaseAdmin
      .from('instagram_story_archive')
      .insert({
        story_id: storyId,
        media_type: 'IMAGE',
        media_url: urlData.publicUrl,
        thumbnail_url: null,
        timestamp: new Date().toISOString(),
        permalink: null,
        reach: 0,
        impressions: story.views || 0,
        replies: 0,
        exits: 0,
      })

    if (!dbError) saved++
  }

  let msg = `✅ ${saved} Stories gespeichert!`
  if (skipped > 0) msg += ` (${skipped} bereits vorhanden)`
  msg += `\n\n📊 Grid: ${gridResult.rows} Zeilen × ${gridResult.cols} Spalten`
  msg += `\n📅 Datum: ${now.toISOString().split('T')[0]}`

  // List view counts
  const viewsList = splitStories
    .filter(s => s.views != null)
    .map(s => s.views!.toLocaleString('de-CH'))
  if (viewsList.length > 0) {
    msg += `\n👁 Views: ${viewsList.join(', ')}`
  }

  await sendTelegramMessage(chatId, msg)
}

async function handleInsights(chatId: number, base64Image: string) {
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
  const typeLabel = data.metric_type === 'aufrufe' ? '👁 Aufrufe' : '💬 Interaktionen'
  const periodLabel = `${data.period} Tage`

  let msg = `✅ ${typeLabel} (${periodLabel}) gespeichert!\n\n`
  msg += `📊 Gesamt: ${total.toLocaleString('de-CH')}\n`
  if (data.follower_pct != null) {
    msg += `👥 Follower: ${data.follower_pct}% | Nicht-Follower: ${data.non_follower_pct}%\n`
  }
  msg += `\n📈 Nach Content-Art:\n`
  if (storiesValue != null) msg += `  Stories: ${storiesValue.toLocaleString('de-CH')} (${data.stories_pct}%)\n`
  if (reelsValue != null) msg += `  Reels: ${reelsValue.toLocaleString('de-CH')} (${data.reels_pct}%)\n`
  if (postsValue != null) msg += `  Beiträge: ${postsValue.toLocaleString('de-CH')} (${data.posts_pct}%)\n`
  if (data.erreichte_konten) {
    msg += `\n🎯 Erreichte Konten: ${data.erreichte_konten.toLocaleString('de-CH')}`
  }

  await sendTelegramMessage(chatId, msg)
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}
