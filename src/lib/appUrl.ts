import { NextRequest } from 'next/server'

// Basis-URL aus den Request-Headern ableiten (korrekt auf Vercel/localhost),
// Fallback auf NEXT_PUBLIC_SITE_URL bzw. laeuft.ch.
export function baseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'
}
