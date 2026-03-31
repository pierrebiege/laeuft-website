import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export interface ManualInsight {
  metric_type: 'aufrufe' | 'interaktionen'
  period: 7 | 14 | 30
  total_value: number
  follower_pct: number | null
  non_follower_pct: number | null
  stories_pct: number | null
  reels_pct: number | null
  posts_pct: number | null
  erreichte_konten: number | null
}

const OCR_PROMPT = `Analysiere diesen Instagram Insights Screenshot. Extrahiere EXAKT diese Daten als JSON:

{
  "metric_type": "aufrufe" oder "interaktionen" (was zeigt der Screenshot?),
  "period": 7 oder 14 oder 30 (welcher Zeitraum? "Letzte 7 Tage" = 7, "Letzte 14 Tage" = 14, "Letzte 30 Tage" = 30),
  "total_value": die grosse Zahl in der Mitte (z.B. 390162),
  "follower_pct": Follower Prozent (z.B. 69.1),
  "non_follower_pct": Nicht-Follower Prozent (z.B. 30.9),
  "stories_pct": Stories Prozent (z.B. 54.3),
  "reels_pct": Reels Prozent (z.B. 33.7),
  "posts_pct": Beitraege Prozent (z.B. 12.0),
  "erreichte_konten": Erreichte Konten Zahl (falls sichtbar, sonst null)
}

NUR das JSON zurueckgeben, kein anderer Text. Falls du etwas nicht lesen kannst, setze null.`

export async function extractInsightsFromImage(base64Image: string, mediaType: string = 'image/jpeg'): Promise<ManualInsight> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64Image,
          },
        },
        { type: 'text', text: OCR_PROMPT },
      ],
    }],
  })

  const text = (response.content[0] as { type: string; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Kein JSON in der Antwort gefunden')

  const data = JSON.parse(jsonMatch[0])

  if (!data.metric_type || !data.period || !data.total_value) {
    throw new Error('Pflichtfelder fehlen (metric_type, period, total_value)')
  }

  return data as ManualInsight
}
