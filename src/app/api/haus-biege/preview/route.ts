import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

const PRIVATE_HOSTNAME_RE = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1)/i

function isSafeHttpUrl(value: string): URL | null {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  if (PRIVATE_HOSTNAME_RE.test(parsed.hostname)) return null
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)) return null
  return parsed
}

function absolutize(maybeUrl: string | undefined, base: URL): string | null {
  if (!maybeUrl) return null
  try {
    return new URL(maybeUrl, base).toString()
  } catch {
    return null
  }
}

// POST /api/haus-biege/preview — lädt Titel/Bild/Beschreibung eines Inserat-Links (best effort)
export async function POST(request: NextRequest) {
  const { url } = await request.json()
  const parsed = isSafeHttpUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: 'Ungültiger Link' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({ title: parsed.hostname, image_url: null, description: null })
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const meta = (name: string) =>
      $(`meta[property="${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content')

    const title = meta('og:title') || $('title').first().text() || parsed.hostname
    const description = meta('og:description') || meta('description') || null
    const imageRaw = meta('og:image')
    const image_url = absolutize(imageRaw, parsed)

    return NextResponse.json({ title: title.trim(), image_url, description })
  } catch {
    return NextResponse.json({ title: parsed.hostname, image_url: null, description: null })
  }
}
