import { NextRequest, NextResponse } from 'next/server'
import { requireAthlete } from '@/lib/athleteAuth'
import { exchangeCode, saveConnection, verifyState } from '@/lib/strava'
import { syncAthlete } from '@/lib/stravaSync'
import { baseUrl } from '@/lib/appUrl'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const base = baseUrl(request)
  const go = (q: string) => NextResponse.redirect(new URL(`/athlet?strava=${q}`, base))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state') || ''
  if (request.nextUrl.searchParams.get('error') || !code) return go('denied')

  const auth = await requireAthlete(request)
  if ('response' in auth) return NextResponse.redirect(new URL('/athlet/login', base))

  // State: Signatur + eingeloggte Identität + Nonce-Cookie müssen zusammenpassen.
  const parsed = verifyState(state)
  const nonceCookie = request.cookies.get('strava_oauth_nonce')?.value
  if (!parsed || parsed.athleteId !== auth.athlete.id || !nonceCookie || nonceCookie !== parsed.nonce) {
    return go('invalid')
  }

  try {
    const tokens = await exchangeCode(code)
    await saveConnection(auth.athlete.id, tokens)
    await syncAthlete(auth.athlete.id) // erster Backfill (35 Tage) + Matching
  } catch (err) {
    console.error('strava callback error:', err)
    return go('error')
  }

  const res = go('connected')
  res.cookies.delete('strava_oauth_nonce')
  return res
}
