import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { extractInsightsFromImage } from '@/lib/instagram-ocr'

// POST: Receive image as FormData, run OCR, return parsed data
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Kein Bild hochgeladen' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64Image = Buffer.from(buffer).toString('base64')

  // Determine media type
  let mediaType = 'image/jpeg'
  if (file.type === 'image/png') mediaType = 'image/png'
  else if (file.type === 'image/webp') mediaType = 'image/webp'

  try {
    const data = await extractInsightsFromImage(base64Image, mediaType)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: `OCR fehlgeschlagen: ${(e as Error).message}` },
      { status: 422 }
    )
  }
}
