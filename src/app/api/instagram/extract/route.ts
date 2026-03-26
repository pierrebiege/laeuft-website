import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Allow auth via API key (for mobile app) or session cookie (for web admin)
async function requireAuthOrApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey && process.env.INSTAGRAM_ADMIN_API_KEY && apiKey === process.env.INSTAGRAM_ADMIN_API_KEY) {
    return null // authorized
  }
  return requireAuth(request)
}

const SYSTEM_PROMPT = `Du bist ein Datenextraktions-Assistent für Instagram Insights Screenshots.

Der Benutzer lädt Screenshots aus der Instagram App hoch (Insights-Bereich). Extrahiere ALLE sichtbaren Metriken und gib sie als JSON zurück.

Erkenne folgende Screenshot-Typen und extrahiere die entsprechenden Daten:

**Account Overview / Übersicht:**
- followers_count, follows_count, media_count
- reach (Reichweite), impressions, profile_views
- website_clicks, accounts_engaged
- engagement_rate (falls sichtbar)
- Zeitraum der Daten (z.B. "Letzte 30 Tage")

**Follower / Wachstum:**
- follower_growth (Zuwachs/Verlust im Zeitraum)
- follower_growth_pct (prozentual falls sichtbar)

**Reichweite & Impressions Verlauf:**
- Tägliche oder wöchentliche Werte als Array: [{date, value}]

**Zielgruppe / Audience:**
- age_gender: [{range: "18-24", gender: "M"/"F", value: number/percentage}]
- countries: [{name: "Schweiz"/"CH", value: number/percentage}]
- cities: [{name: "Zürich", value: number/percentage}]
- online_times: [{day: "Monday", hour: number, value: number}] (falls Heatmap sichtbar)

**Einzelner Post / Reel:**
- media_type: "IMAGE"/"REEL"/"CAROUSEL_ALBUM"/"VIDEO"
- caption (falls sichtbar)
- like_count, comments_count, saves_count, shares_count
- reach, impressions, plays (bei Reels/Videos)
- engagement_rate

**Content Overview:**
- Liste von Posts mit Metriken

Regeln:
- Gib NUR valides JSON zurück, keine Erklärungen
- Verwende englische Schlüsselnamen
- Wenn ein Wert nicht sichtbar ist, lasse das Feld weg
- Zahlen wie "12.4K" → 12400, "1.2M" → 1200000
- Prozente als Dezimalzahl: "4.5%" → 4.5
- Erkenne die Sprache des Screenshots (DE/EN/FR) und extrahiere trotzdem korrekt
- Bei mehreren Screenshots: kombiniere die Daten in einem JSON

Antwortformat:
{
  "screenshot_type": "overview" | "audience" | "post" | "reach" | "content" | "followers" | "mixed",
  "period": "last_30_days" | "last_7_days" | "last_90_days" | null,
  "date_extracted": "2026-03-26",
  "account_metrics": { ... },
  "audience_data": { ... },
  "post_data": [ ... ],
  "reach_data": [ ... ],
  "raw_text": "Zusammenfassung aller erkannten Werte als Freitext"
}`

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const authError = await requireAuthOrApiKey(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { images, context } = body as {
      images: Array<{ data: string; media_type: string }>
      context?: string
    }

    if (!images?.length) {
      return NextResponse.json({ error: 'Keine Bilder hochgeladen' }, { status: 400 })
    }

    // Build content array for Claude
    const content: Anthropic.Messages.ContentBlockParam[] = []

    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.media_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: img.data,
        },
      })
    }

    content.push({
      type: 'text',
      text: context
        ? `Kontext: ${context}\n\nExtrahiere alle Metriken aus den Screenshots.`
        : 'Extrahiere alle Metriken aus den Instagram Insights Screenshots.',
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    // Parse Claude's response
    const text = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    let extracted
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      extracted = null
    }

    if (!extracted) {
      return NextResponse.json({
        error: 'Konnte keine Daten extrahieren',
        raw_response: text,
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      extracted,
      raw_response: text,
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
    }, { status: 500 })
  }
}

// Save extracted data to Supabase
export async function PUT(request: NextRequest) {
  const authError = await requireAuthOrApiKey(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { extracted } = body
    const today = new Date().toISOString().split('T')[0]
    const results: string[] = []

    // Save account metrics
    if (extracted.account_metrics) {
      const m = extracted.account_metrics
      const { error } = await supabaseAdmin
        .from('instagram_metrics')
        .upsert({
          date: today,
          followers_count: m.followers_count || 0,
          follows_count: m.follows_count || null,
          media_count: m.media_count || null,
          impressions: m.impressions || null,
          reach: m.reach || null,
          profile_views: m.profile_views || null,
          website_clicks: m.website_clicks || null,
          accounts_engaged: m.accounts_engaged || null,
          engagement_rate: m.engagement_rate || null,
        }, { onConflict: 'date' })

      if (error) results.push(`Metrics error: ${error.message}`)
      else results.push('Account metrics saved')
    }

    // Save audience data
    if (extracted.audience_data) {
      const ad = extracted.audience_data

      // Age/Gender
      if (ad.age_gender) {
        for (const item of ad.age_gender) {
          const key = `${item.gender}.${item.range}`
          await supabaseAdmin
            .from('instagram_audience')
            .upsert({
              date: today,
              metric_type: 'age_gender',
              dimension_key: key,
              value: Math.round(item.value),
            }, { onConflict: 'date,metric_type,dimension_key' })
        }
        results.push('Age/gender data saved')
      }

      // Countries
      if (ad.countries) {
        for (const item of ad.countries) {
          await supabaseAdmin
            .from('instagram_audience')
            .upsert({
              date: today,
              metric_type: 'country',
              dimension_key: item.name,
              value: Math.round(item.value),
            }, { onConflict: 'date,metric_type,dimension_key' })
        }
        results.push('Country data saved')
      }

      // Cities
      if (ad.cities) {
        for (const item of ad.cities) {
          await supabaseAdmin
            .from('instagram_audience')
            .upsert({
              date: today,
              metric_type: 'city',
              dimension_key: item.name,
              value: Math.round(item.value),
            }, { onConflict: 'date,metric_type,dimension_key' })
        }
        results.push('City data saved')
      }

      // Online times
      if (ad.online_times) {
        for (const item of ad.online_times) {
          await supabaseAdmin
            .from('instagram_audience')
            .upsert({
              date: today,
              metric_type: 'online_followers',
              dimension_key: `${item.day}-${item.hour}`,
              value: Math.round(item.value),
            }, { onConflict: 'date,metric_type,dimension_key' })
        }
        results.push('Online times saved')
      }
    }

    // Save post data
    if (extracted.post_data && Array.isArray(extracted.post_data)) {
      for (const post of extracted.post_data) {
        if (!post.media_type) continue
        const igId = post.ig_media_id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        await supabaseAdmin
          .from('instagram_posts')
          .upsert({
            ig_media_id: igId,
            media_type: post.media_type,
            media_url: post.media_url || null,
            thumbnail_url: post.thumbnail_url || null,
            permalink: post.permalink || null,
            caption: post.caption || null,
            timestamp: post.timestamp || new Date().toISOString(),
            like_count: post.like_count || 0,
            comments_count: post.comments_count || 0,
            saves_count: post.saves_count || 0,
            shares_count: post.shares_count || 0,
            reach: post.reach || 0,
            impressions: post.impressions || 0,
            plays: post.plays || null,
            engagement_rate: post.engagement_rate || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'ig_media_id' })
      }
      results.push(`${extracted.post_data.length} posts saved`)
    }

    // Save daily reach data as metrics
    if (extracted.reach_data && Array.isArray(extracted.reach_data)) {
      for (const item of extracted.reach_data) {
        if (!item.date || !item.value) continue
        await supabaseAdmin
          .from('instagram_metrics')
          .upsert({
            date: item.date,
            followers_count: extracted.account_metrics?.followers_count || 0,
            reach: item.value,
          }, { onConflict: 'date' })
      }
      results.push(`${extracted.reach_data.length} reach data points saved`)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
