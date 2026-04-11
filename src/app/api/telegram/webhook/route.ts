import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { extractInsightsFromImage } from '@/lib/instagram-ocr'
import { classifyImage, analyzeStoryGrid, splitStoryGrid } from '@/lib/story-grid-splitter'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Handle callback queries (inline button clicks)
  if (body.callback_query) {
    await handleCallbackQuery(body.callback_query)
    return NextResponse.json({ ok: true })
  }

  const message = body.message

  // Handle reply-to-message with prototype URL
  if (message?.reply_to_message && message?.text) {
    const repliedMsgId = message.reply_to_message.message_id
    const urlMatch = message.text.match(/https?:\/\/\S+/)

    if (urlMatch) {
      await handlePrototypeReply(message.chat.id, repliedMsgId, urlMatch[0])
      return NextResponse.json({ ok: true })
    }
  }

  if (!message?.photo) {
    if (message?.text) {
      await sendTelegramMessage(
        message.chat.id,
        '📸 Schick mir einen Screenshot!\n\n' +
        '• Story-Grid → Stories werden automatisch zerschnitten & gespeichert\n' +
        '• Insights-Screenshot → Aufrufe/Interaktionen werden erkannt\n\n' +
        'Oder antworte auf eine Prospect-Nachricht mit dem Prototyp-Link.'
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

  // Get the highest existing telegram story number for auto-increment
  const { data: lastStory } = await supabaseAdmin
    .from('instagram_story_archive')
    .select('story_id')
    .like('story_id', 'telegram-%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = 1
  if (lastStory?.story_id) {
    const match = lastStory.story_id.match(/telegram-(\d+)/)
    if (match) nextNumber = parseInt(match[1]) + 1
  }

  let saved = 0

  for (const story of splitStories) {
    const storyId = `telegram-${(nextNumber + story.index).toString().padStart(5, '0')}`

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
  msg += `\n\n📊 Grid: ${gridResult.rows} Zeilen × ${gridResult.cols} Spalten`
  msg += `\n🔢 IDs: ${nextNumber.toString().padStart(5, '0')} – ${(nextNumber + splitStories.length - 1).toString().padStart(5, '0')}`

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

async function handlePrototypeReply(chatId: number, replyToMsgId: number, prototypeUrl: string) {
  // Find prospect by research_msg_id
  const { data: prospect, error } = await supabaseAdmin
    .from('prospects')
    .select('*')
    .eq('research_msg_id', replyToMsgId)
    .single()

  if (error || !prospect) {
    await sendTelegramMessage(chatId, '❌ Keine Prospect-Nachricht gefunden zum Antworten.')
    return
  }

  await sendTelegramMessage(chatId, `🔨 Generiere Mail für ${prospect.company}...`)

  // Update prototype URL on prospect
  await supabaseAdmin
    .from('prospects')
    .update({ prototype_url: prototypeUrl })
    .eq('id', prospect.id)

  // Generate the email via Claude
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic()
    const firstName = prospect.contact_name.split(' ')[0]
    const isGeneric = /^(info|kontakt|office|hello|contact|admin)@/i.test(prospect.email)
    const salutation = isGeneric ? 'Hallo zusammen,' : `Hallo ${firstName},`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `Du schreibst Cold-Outreach-Mails für Pierre Biege von laeuft.ch.

KONTEXT:
- Pierre hat für jeden Lead einen personalisierten Prototyp gebaut
- Der Prototyp-Link wird immer mitgeschickt
- Region: Wallis, Schweiz. Die Leute kennen sich.

REGELN:
1. Maximal 6 Sätze. Kein Wort zu viel.
2. KEIN Kompliment ("tolles Unternehmen", "starke Marke", "Respekt"). Das ist Schleimerei.
3. KEINE Behauptung über die Firma oder deren Website. Nichts was falsch sein könnte.
4. KEINE Buzzwords (AI-gestützt, digital transformieren, Potenzial ausschöpfen, Mehrwert).
5. KEIN Verkaufsgespräch anbieten. KEIN "15 Minuten". KEIN Call-to-Action mit Zeitdruck.
6. Der Prototyp spricht für sich. Du stellst ihn hin und gehst.
7. Ton: direkt, ruhig, selbstbewusst. Wie jemand der es nicht nötig hat.
8. Sprache: Schweizer Hochdeutsch, du-Form.

STRUKTUR:
- Zeile 1: Anrede (${salutation})
- Zeile 2: Was du gemacht hast (nicht warum)
- Zeile 3-4: Was der Prototyp zeigt — konkret, ohne zu übertreiben
- Zeile 5: Der Link
- Zeile 6: Ein Satz der signalisiert: kein Druck, Ball liegt bei dir
- Signatur: Pierre Biege / laeuft.ch

VERBOTEN: "Ich bin überzeugt dass...", "Das könnte euch helfen...", "Viele Unternehmen in eurer Branche...", "Hast du 15 Minuten?", "Lass uns sprechen", jede Form von Dringlichkeit.

BEISPIEL:
---
Betreff: Etwas für euch gebaut

Hallo Manfred,

ich hab mir eure Garage angeschaut und ein Buchungssystem zusammengebaut — Kunden wählen Fahrzeug und Service, kriegen automatisch einen Termin und eine Erinnerung per SMS.

Hier zum Anschauen: laeuft.ch/demo/garage-st-christophe

Wenns interessiert, meld dich. Wenns nicht passt, kein Ding.

Pierre Biege
laeuft.ch
---`,
      messages: [{
        role: 'user',
        content: `Firma: ${prospect.company}
Anrede: ${salutation}
Branche/Research: ${prospect.notes || 'keine Infos'}
Prototyp-URL: ${prototypeUrl}

Schreibe die Mail gemäss den Regeln. Format:
BETREFF: [Betreff]
---
[Mail-Text]`
      }],
    })

    const text = (response.content[0] as { type: string; text: string }).text
    const subjectMatch = text.match(/BETREFF:\s*(.+)/i)
    const bodyMatch = text.split(/---\n?/)
    const subject = subjectMatch?.[1]?.trim() || `Etwas für ${prospect.company} gebaut`
    const body = (bodyMatch[1] || text).trim()

    // Create pending_email
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_emails')
      .insert({
        prospect_id: prospect.id,
        email_number: 1,
        subject,
        body,
        status: 'pending',
      })
      .select()
      .single()

    if (pendingError || !pending) {
      await sendTelegramMessage(chatId, '❌ Fehler beim Erstellen der Mail.')
      return
    }

    // Send final preview with approve/reject buttons
    const previewText = `📧 Finale Mail für ${prospect.company}\n👤 ${prospect.contact_name} (${prospect.email})\n📋 Betreff: ${subject}\n\n${body}`
    const safeText = previewText.length > 4000 ? previewText.slice(0, 3997) + '...' : previewText

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: safeText,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Senden', callback_data: `approve:${pending.id}` },
            { text: '❌ Verwerfen', callback_data: `reject:${pending.id}` },
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
  } catch (e) {
    console.error('Prototype reply error:', e)
    await sendTelegramMessage(chatId, `❌ Fehler bei Mail-Generierung: ${(e as Error).message}`)
  }
}

async function handleCallbackQuery(query: { id: string; data: string; message: { chat: { id: number }; message_id: number } }) {
  const { id: callbackId, data, message } = query
  const chatId = message.chat.id
  const messageId = message.message_id

  // Parse callback data: "approve:{pendingEmailId}" or "reject:{pendingEmailId}"
  const [action, pendingEmailId] = data.split(':')

  if (!pendingEmailId || !['approve', 'reject'].includes(action)) {
    await answerCallback(callbackId, '❌ Ungültige Aktion')
    return
  }

  // Get pending email
  const { data: pending, error } = await supabaseAdmin
    .from('pending_emails')
    .select('*, prospect:prospects(*)')
    .eq('id', pendingEmailId)
    .single()

  if (error || !pending) {
    await answerCallback(callbackId, '❌ Mail nicht gefunden')
    return
  }

  if (pending.status !== 'pending') {
    await answerCallback(callbackId, '⚠️ Bereits verarbeitet')
    return
  }

  if (action === 'approve') {
    // Send the email
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'}/api/send-prospect-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `admin_session=telegram-bypass`,
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          prospectId: pending.prospect_id,
          emailNumber: pending.email_number,
          customSubject: pending.subject,
          customBody: pending.body,
        }),
      })

      if (!res.ok) {
        // Fallback: send directly via nodemailer import
        await answerCallback(callbackId, '❌ Versand fehlgeschlagen')
        await editTelegramMessage(chatId, messageId, `❌ Versand fehlgeschlagen für ${pending.prospect?.company}`)
        return
      }

      // Update pending email status
      await supabaseAdmin
        .from('pending_emails')
        .update({ status: 'sent', decided_at: new Date().toISOString(), sent_at: new Date().toISOString() })
        .eq('id', pendingEmailId)

      await answerCallback(callbackId, '✅ Mail gesendet!')
      await editTelegramMessage(chatId, messageId,
        `✅ GESENDET an ${pending.prospect?.company}\n📧 ${pending.subject}\n👤 ${pending.prospect?.contact_name} (${pending.prospect?.email})`)
    } catch {
      await answerCallback(callbackId, '❌ Fehler beim Senden')
    }
  } else {
    // Reject — mark pending email and update prospect status
    await supabaseAdmin
      .from('pending_emails')
      .update({ status: 'rejected', decided_at: new Date().toISOString() })
      .eq('id', pendingEmailId)

    // Mark prospect as "kein_interesse" with note
    if (pending.prospect) {
      const existingNotes = pending.prospect.notes || ''
      await supabaseAdmin
        .from('prospects')
        .update({
          status: 'kein_interesse',
          updated_at: new Date().toISOString(),
          notes: existingNotes
            ? `${existingNotes}\n\n--- Per Telegram abgelehnt am ${new Date().toLocaleDateString('de-CH')} ---`
            : `--- Per Telegram abgelehnt am ${new Date().toLocaleDateString('de-CH')} ---`,
        })
        .eq('id', pending.prospect_id)
    }

    await answerCallback(callbackId, '⏭ Übersprungen — als kein Interesse markiert')
    await editTelegramMessage(chatId, messageId,
      `⏭ ABGELEHNT: ${pending.prospect?.company}\n📝 Status → Kein Interesse`)
  }
}

async function answerCallback(callbackId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  })
}

async function editTelegramMessage(chatId: number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  })
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

// Send a message with inline approve/reject buttons
export async function sendTelegramEmailApproval(chatId: string, pendingEmailId: string, prospect: { company: string; contact_name: string; email: string }, subject: string, bodyPreview: string) {
  const text = `📧 Neue Mail bereit:\n\n🏢 ${prospect.company}\n👤 ${prospect.contact_name} (${prospect.email})\n\n📋 Betreff: ${subject}\n---\n${bodyPreview.slice(0, 500)}\n---`

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Senden', callback_data: `approve:${pendingEmailId}` },
          { text: '❌ Überspringen', callback_data: `reject:${pendingEmailId}` },
        ]],
      },
    }),
  })

  const data = await res.json()
  return data.result?.message_id
}
