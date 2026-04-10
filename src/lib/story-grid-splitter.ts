import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

export interface StoryGridResult {
  rows: number
  cols: number
  stories: Array<{
    row: number
    col: number
    views: number | null
  }>
}

export interface SplitStory {
  imageBuffer: Buffer
  views: number | null
  index: number
}

const CLASSIFY_PROMPT = `Schau dir dieses Bild an. Was ist es?

Antwort NUR mit einem der folgenden Wörter:
- "story_grid" wenn es ein Instagram Story-Archiv/Grid ist (mehrere Story-Thumbnails in einem Raster mit Aufrufzahlen darunter)
- "insights" wenn es ein Instagram Insights Screenshot ist (Aufrufe, Interaktionen, Statistiken)
- "unknown" wenn es keines von beiden ist

NUR das eine Wort, kein anderer Text.`

const GRID_ANALYSIS_PROMPT = `Analysiere dieses Instagram Story-Grid Bild. Es zeigt mehrere Stories in einem Raster mit Aufrufzahlen (Views) unter jedem Thumbnail.

Gib mir NUR ein JSON zurück:
{
  "rows": <Anzahl Zeilen mit Stories>,
  "cols": <Anzahl Spalten (meistens 4)>,
  "stories": [
    {"row": 0, "col": 0, "views": <Zahl oder null>},
    {"row": 0, "col": 1, "views": <Zahl oder null>},
    ...
  ]
}

WICHTIG:
- Zähle NUR Zeilen die tatsächlich Story-Thumbnails enthalten
- "views" ist die Zahl die UNTER jedem Story-Thumbnail steht (z.B. 1800, 1900, 2500)
- Reihenfolge: zeilenweise von links nach rechts, oben nach unten
- Wenn eine Zelle leer ist oder keine Story enthält, lass sie weg
- NUR das JSON, kein anderer Text`

export async function classifyImage(base64Image: string, mediaType: string = 'image/jpeg'): Promise<'story_grid' | 'insights' | 'unknown'> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
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
        { type: 'text', text: CLASSIFY_PROMPT },
      ],
    }],
  })

  const text = (response.content[0] as { type: string; text: string }).text.trim().toLowerCase()
  if (text.includes('story_grid')) return 'story_grid'
  if (text.includes('insights')) return 'insights'
  return 'unknown'
}

export async function analyzeStoryGrid(base64Image: string, mediaType: string = 'image/jpeg'): Promise<StoryGridResult> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
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
        { type: 'text', text: GRID_ANALYSIS_PROMPT },
      ],
    }],
  })

  const text = (response.content[0] as { type: string; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Kein JSON in der Grid-Analyse gefunden')

  // Clean up common AI JSON issues: trailing commas, single quotes, comments
  let jsonStr = jsonMatch[0]
    .replace(/,\s*([}\]])/g, '$1')          // trailing commas
    .replace(/'/g, '"')                       // single quotes
    .replace(/(\w+)\s*:/g, '"$1":')           // unquoted keys
    .replace(/""/g, '"')                      // double-quoted from previous replace
    .replace(/:\s*(\d[\d.]*)\s*([,}\]])/g, ': $1$2')  // ensure numbers aren't quoted

  const data = JSON.parse(jsonStr)
  if (!data.rows || !data.cols || !data.stories) {
    throw new Error('Grid-Analyse unvollständig (rows, cols, stories fehlen)')
  }

  return data as StoryGridResult
}

export async function splitStoryGrid(
  imageBuffer: Buffer,
  gridResult: StoryGridResult
): Promise<SplitStory[]> {
  const metadata = await sharp(imageBuffer).metadata()
  const imgWidth = metadata.width!
  const imgHeight = metadata.height!

  const { rows, cols, stories } = gridResult

  // Each cell includes the story thumbnail (9:16) + view count text below
  // We calculate cell dimensions from the full image
  const cellWidth = Math.floor(imgWidth / cols)
  const cellHeight = Math.floor(imgHeight / rows)

  // The story image is the top ~85% of each cell (the bottom ~15% is the view count)
  const storyHeightRatio = 0.85

  const results: SplitStory[] = []

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]
    const left = story.col * cellWidth
    const top = story.row * cellHeight
    const extractHeight = Math.floor(cellHeight * storyHeightRatio)

    // Clamp to image bounds
    const safeLeft = Math.min(left, imgWidth - 1)
    const safeTop = Math.min(top, imgHeight - 1)
    const safeWidth = Math.min(cellWidth, imgWidth - safeLeft)
    const safeHeight = Math.min(extractHeight, imgHeight - safeTop)

    if (safeWidth <= 0 || safeHeight <= 0) continue

    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: safeLeft,
        top: safeTop,
        width: safeWidth,
        height: safeHeight,
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    results.push({
      imageBuffer: croppedBuffer,
      views: story.views,
      index: i,
    })
  }

  return results
}
