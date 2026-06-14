import 'server-only'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { encryptToken, decryptToken } from '@/lib/cryptoTokens'

const OAUTH_TOKEN_URL = 'https://www.strava.com/oauth/token'
const API = 'https://www.strava.com/api/v3'

export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number // unix seconds
  scope?: string
  athlete?: { id: number }
}

export interface StravaActivity {
  id: number
  name: string
  sport_type?: string
  type?: string
  distance: number          // Meter
  moving_time: number       // Sekunden
  elapsed_time: number
  total_elevation_gain?: number
  start_date: string
  start_date_local: string
  average_heartrate?: number
}

export function stravaConfigured(): boolean {
  return !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET)
}

export function authorizeUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state,
  })
  return `https://www.strava.com/oauth/authorize?${p.toString()}`
}

export async function exchangeCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`)
  return res.json()
}

async function refresh(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`)
  return res.json()
}

export async function saveConnection(athleteId: string, t: StravaTokenResponse): Promise<void> {
  await supabaseAdmin.from('strava_connections').upsert(
    {
      athlete_id: athleteId,
      strava_athlete_id: t.athlete?.id,
      access_token_enc: encryptToken(t.access_token),
      refresh_token_enc: encryptToken(t.refresh_token),
      expires_at: new Date(t.expires_at * 1000).toISOString(),
      scope: t.scope ?? null,
    },
    { onConflict: 'athlete_id' }
  )
}

// Gültiges Access-Token (refresht serverseitig, wenn < 5 Min Restlaufzeit).
export async function getValidAccessToken(athleteId: string): Promise<string | null> {
  const { data: conn } = await supabaseAdmin
    .from('strava_connections')
    .select('access_token_enc, refresh_token_enc, expires_at')
    .eq('athlete_id', athleteId)
    .maybeSingle()
  if (!conn) return null

  if (new Date(conn.expires_at).getTime() - Date.now() > 5 * 60 * 1000) {
    return decryptToken(conn.access_token_enc)
  }

  const t = await refresh(decryptToken(conn.refresh_token_enc))
  await supabaseAdmin
    .from('strava_connections')
    .update({
      access_token_enc: encryptToken(t.access_token),
      refresh_token_enc: encryptToken(t.refresh_token),
      expires_at: new Date(t.expires_at * 1000).toISOString(),
    })
    .eq('athlete_id', athleteId)
  return t.access_token
}

export async function fetchActivities(
  accessToken: string,
  afterUnix?: number,
  perPage = 100
): Promise<StravaActivity[]> {
  const p = new URLSearchParams({ per_page: String(perPage) })
  if (afterUnix) p.set('after', String(afterUnix))
  const res = await fetch(`${API}/athlete/activities?${p.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`)
  return res.json()
}

export async function deauthorize(accessToken: string): Promise<void> {
  try {
    await fetch('https://www.strava.com/oauth/deauthorize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    /* best effort */
  }
}

// --- CSRF/State: an die eingeloggte athlete-Identität + Nonce gebunden ---
export function signState(athleteId: string, nonce: string): string {
  const secret = process.env.STRAVA_TOKEN_KEY || ''
  const payload = `${athleteId}.${nonce}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyState(state: string): { athleteId: string; nonce: string } | null {
  const parts = state.split('.')
  if (parts.length !== 3) return null
  const [athleteId, nonce, sig] = parts
  const secret = process.env.STRAVA_TOKEN_KEY || ''
  const expected = crypto.createHmac('sha256', secret).update(`${athleteId}.${nonce}`).digest('hex')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return { athleteId, nonce }
}
