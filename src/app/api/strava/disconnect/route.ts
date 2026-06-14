import { NextRequest, NextResponse } from 'next/server'
import { requireAthlete } from '@/lib/athleteAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getValidAccessToken, deauthorize } from '@/lib/strava'

export const dynamic = 'force-dynamic'

// Strava trennen: bei Strava deautorisieren + alle gespiegelten Daten löschen
// (revDSG: keine verwaisten Aktivitäten/Matches). Auto-Häkchen bleiben bestehen.
export async function POST(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response
  const athleteId = auth.athlete.id

  try {
    const token = await getValidAccessToken(athleteId)
    if (token) await deauthorize(token)
  } catch (err) {
    console.error('strava deauthorize error:', err)
  }

  await supabaseAdmin.from('session_activity_matches').delete().eq('athlete_id', athleteId)
  await supabaseAdmin.from('strava_activities').delete().eq('athlete_id', athleteId)
  await supabaseAdmin.from('strava_connections').delete().eq('athlete_id', athleteId)

  return NextResponse.json({ ok: true })
}
