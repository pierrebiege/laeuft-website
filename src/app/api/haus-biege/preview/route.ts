import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

const PRIVATE_HOSTNAME_RE = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1)/i
const BOT_WALL_SIGNATURES = ['captcha-delivery.com', 'awswafintegration', 'datadome', 'cf-turnstile', 'hcaptcha.com']

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

// Wandelt DE/CH-Zahlenformate ("450.000,00", "650'000.–", "299.000", "497.00") in eine Zahl um.
function parsePriceNumber(raw: string): number | null {
  let cleaned = raw.replace(/[^0-9.,]/g, '')
  if (!cleaned) return null
  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')
    cleaned = lastComma > lastDot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '')
  } else if (hasComma) {
    cleaned = /^\d{1,3}(,\d{3})+$/.test(cleaned) ? cleaned.replace(/,/g, '') : cleaned.replace(',', '.')
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '')
  }

  const n = parseFloat(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Für kleinere Werte (Zimmer, m²) — Komma ist hier so gut wie immer Dezimaltrenner.
function parseDecimalNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

interface ExtractResult {
  price: number | null
  currency: string | null
  rooms: number | null
  size_m2: number | null
  location: string | null
}

function empty(): ExtractResult {
  return { price: null, currency: null, rooms: null, size_m2: null, location: null }
}

// 1) schema.org-Microdata (itemprop=...) — z.B. eBay Kleinanzeigen
function extractFromMicrodata($: cheerio.CheerioAPI): ExtractResult {
  const result = empty()
  const priceAttr = $('[itemprop="price"]').first()
  const priceRaw = priceAttr.attr('content') || priceAttr.text()
  if (priceRaw) result.price = parsePriceNumber(priceRaw)

  const currencyAttr = $('[itemprop="priceCurrency"], [itemprop="currency"]').first()
  const currencyRaw = currencyAttr.attr('content') || currencyAttr.text()
  if (currencyRaw) result.currency = currencyRaw.trim().toUpperCase()

  const roomsAttr = $('[itemprop="numberOfRooms"]').first()
  const roomsRaw = roomsAttr.attr('content') || roomsAttr.text()
  if (roomsRaw) result.rooms = parseDecimalNumber(roomsRaw)

  const sizeAttr = $('[itemprop="floorSize"]').first()
  const sizeRaw = sizeAttr.attr('content') || sizeAttr.text()
  if (sizeRaw) result.size_m2 = parseDecimalNumber(sizeRaw)

  const postalCode = $('[itemprop="postalCode"]').first().text().trim()
  const locality = $('[itemprop="addressLocality"]').first().text().trim()
  if (postalCode || locality) {
    result.location = [postalCode, locality].filter(Boolean).join(' ')
  } else {
    const addressLine = $('[itemprop="address"]').first().text().trim()
    if (addressLine) result.location = addressLine.replace(/\s+/g, ' ').slice(0, 120)
  }

  // Generische Detail-Listen wie bei Kleinanzeigen (Label + Value nebeneinander)
  $('li, .addetailslist--detail, [class*="detail"]').each((_, el) => {
    const label = $(el).clone().children().remove().end().text().trim().toLowerCase()
    const value = $(el).find('[class*="value"]').first().text().trim()
    if (!value) return
    if (!result.rooms && /^(zimmer|rooms?)$/i.test(label)) result.rooms = parseDecimalNumber(value)
    if (!result.size_m2 && /(wohnfläche|fläche|floor.?size)/i.test(label)) result.size_m2 = parseDecimalNumber(value)
  })

  return result
}

// Nur diese schema.org-Typen taugen als Quelle für Objekt-Preis/-Adresse —
// Organization/WebSite/ImageObject etc. tragen die Betreiber-Adresse der Seite,
// nicht die des Inserats, und würden sonst falsche Werte einschleusen.
const RELEVANT_JSONLD_TYPES = new Set([
  'product',
  'offer',
  'realestatelisting',
  'house',
  'apartment',
  'singlefamilyresidence',
  'residence',
  'accommodation',
  'lodgingbusiness',
  'place',
])

function hasRelevantType(node: Record<string, unknown>): boolean {
  const type = node['@type']
  const types = Array.isArray(type) ? type : [type]
  return types.some((t) => typeof t === 'string' && RELEVANT_JSONLD_TYPES.has(t.toLowerCase()))
}

// 2) JSON-LD (schema.org Product/Offer/RealEstateListing/House/…)
function extractFromJsonLd($: cheerio.CheerioAPI): ExtractResult {
  const result = empty()
  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown
    try {
      parsed = JSON.parse($(el).contents().text())
    } catch {
      return
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed]
    for (const node of nodes) {
      const candidates = (node as Record<string, unknown>)?.['@graph']
        ? (node as { '@graph': unknown[] })['@graph']
        : [node]
      for (const c of candidates as Record<string, unknown>[]) {
        if (!c || typeof c !== 'object' || !hasRelevantType(c)) continue
        const offers = (c.offers as Record<string, unknown>) || c
        const price = offers?.price ?? offers?.priceSpecification
        if (price != null && result.price === null) {
          const priceValue = typeof price === 'object' ? (price as Record<string, unknown>).price : price
          if (priceValue != null) result.price = parsePriceNumber(String(priceValue))
        }
        const currency = (offers?.priceCurrency as string) || (c.priceCurrency as string)
        if (currency && !result.currency) result.currency = String(currency).toUpperCase()

        if (c.numberOfRooms != null && result.rooms === null) {
          result.rooms = parseDecimalNumber(String(c.numberOfRooms))
        }
        const floorSize = c.floorSize as Record<string, unknown> | number | string | undefined
        if (floorSize != null && result.size_m2 === null) {
          const val = typeof floorSize === 'object' ? floorSize.value : floorSize
          if (val != null) result.size_m2 = parseDecimalNumber(String(val))
        }
        const address = c.address as Record<string, unknown> | string | undefined
        if (address && !result.location) {
          if (typeof address === 'string') result.location = address
          else {
            result.location = [address.postalCode, address.addressLocality].filter(Boolean).join(' ') || null
          }
        }
      }
    }
  })
  return result
}

// 3) Regex-Fallback auf dem sichtbaren Text (z.B. Ferienhaus-Seiten ohne strukturierte Daten)
function extractFromText(text: string): ExtractResult {
  const result = empty()

  const pricePatterns: Array<{ re: RegExp; currency: string; group: number }> = [
    { re: /(?:CHF|Fr\.)\s?([\d'.,]{3,})/i, currency: 'CHF', group: 1 },
    { re: /([\d'.,]{3,})\s?(?:CHF|Fr\.-?)/i, currency: 'CHF', group: 1 },
    { re: /(?:€|EUR)\s?([\d.,]{3,})/i, currency: 'EUR', group: 1 },
    { re: /([\d.,]{3,})\s?(?:€|EUR)/i, currency: 'EUR', group: 1 },
    { re: /\$\s?([\d.,]{3,})/, currency: 'USD', group: 1 },
    { re: /£\s?([\d.,]{3,})/, currency: 'GBP', group: 1 },
  ]
  for (const p of pricePatterns) {
    const m = text.match(p.re)
    if (m) {
      const value = parsePriceNumber(m[p.group])
      if (value != null) {
        result.price = value
        result.currency = p.currency
        break
      }
    }
  }

  const roomsMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[- ]?(?:Zimmer|zimmer|rooms?)\b/)
  if (roomsMatch) result.rooms = parseDecimalNumber(roomsMatch[1])

  const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m²|m2\b|qm\b)/i)
  if (sizeMatch) result.size_m2 = parseDecimalNumber(sizeMatch[1])

  const locationMatch = text.match(/\b(\d{4,5})\s+([A-ZÄÖÜ][\wäöüÄÖÜß\-]{2,30}(?:[\s-][A-ZÄÖÜ][\wäöüÄÖÜß\-]{2,30}){0,2})/)
  if (locationMatch) result.location = `${locationMatch[1]} ${locationMatch[2]}`.trim()

  return result
}

function mergeResults(...results: ExtractResult[]): ExtractResult {
  const merged = empty()
  for (const r of results) {
    if (merged.price === null && r.price !== null) merged.price = r.price
    if (merged.currency === null && r.currency !== null) merged.currency = r.currency
    if (merged.rooms === null && r.rooms !== null) merged.rooms = r.rooms
    if (merged.size_m2 === null && r.size_m2 !== null) merged.size_m2 = r.size_m2
    if (merged.location === null && r.location !== null) merged.location = r.location
  }
  return merged
}

function looksBotBlocked(html: string, status: number): boolean {
  if (status === 401 || status === 403) return true
  const lower = html.toLowerCase()
  return BOT_WALL_SIGNATURES.some((sig) => lower.includes(sig))
}

// POST /api/haus-biege/preview — lädt so viel wie möglich vom Inserat automatisch (best effort)
export async function POST(request: NextRequest) {
  const { url } = await request.json()
  const parsed = isSafeHttpUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: 'Ungültiger Link' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
    })
    clearTimeout(timeout)

    const html = await res.text()

    if (looksBotBlocked(html, res.status)) {
      return NextResponse.json({
        title: parsed.hostname,
        image_url: null,
        description: null,
        blocked: true,
        message: 'Diese Seite blockiert automatisches Auslesen (Bot-Schutz) — bitte Angaben von Hand eintragen.',
      })
    }

    if (!res.ok) {
      return NextResponse.json({ title: parsed.hostname, image_url: null, description: null })
    }

    const $ = cheerio.load(html)
    const meta = (name: string) =>
      $(`meta[property="${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content')

    const title = meta('og:title') || $('title').first().text() || parsed.hostname
    const description = meta('og:description') || meta('description') || null
    const image_url = absolutize(meta('og:image'), parsed)

    const bodyText = $('body')
      .clone()
      .find('script, style, noscript')
      .remove()
      .end()
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    const extracted = mergeResults(extractFromMicrodata($), extractFromJsonLd($), extractFromText(bodyText))

    return NextResponse.json({
      title: title.trim(),
      image_url,
      description,
      price: extracted.price,
      currency: extracted.currency,
      rooms: extracted.rooms,
      size_m2: extracted.size_m2,
      location: extracted.location,
    })
  } catch {
    return NextResponse.json({ title: parsed.hostname, image_url: null, description: null })
  }
}
