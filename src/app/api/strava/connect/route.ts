import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAthlete } from '@/lib/athleteAuth'
import { authorizeUrl, signState, stravaConfigured } from '@/lib/strava'
import { baseUrl } from '@/lib/appUrl'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const base = baseUrl(request)
  const auth = await requireAthlete(request)
  if ('response' in auth) {
    return NextResponse.redirect(new URL('/athlet/login', base))
  }
  if (!stravaConfigured()) {
    return NextResponse.redirect(new URL('/athlet?strava=notconfigured', base))
  }

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = signState(auth.athlete.id, nonce)
  const redirectUri = `${base}/api/strava/callback`

  const res = NextResponse.redirect(authorizeUrl(redirectUri, state))
  res.cookies.set('strava_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
