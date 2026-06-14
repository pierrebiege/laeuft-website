import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getValidAccessToken, fetchActivities } from '@/lib/strava'
import { matchAthlete } from '@/lib/stravaMatch'

// Holt neue Aktivitäten eines Athleten von Strava, spiegelt die für den
// Soll-Ist-Abgleich nötigen Felder (KEINE Karte/Polyline) und matcht sie.
export async function syncAthlete(athleteId: string): Promise<{ imported: number; matched: number } | null> {
  const token = await getValidAccessToken(athleteId)
  if (!token) return null

  const { data: conn } = await supabaseAdmin
    .from('strava_connections')
    .select('last_sync_at')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  const after = conn?.last_sync_at
    ? Math.floor(new Date(conn.last_sync_at).getTime() / 1000) - 86400 // 1 Tag Überlappung
    : Math.floor(Date.now() / 1000) - 35 * 86400 // erster Sync: 35 Tage zurück

  const activities = await fetchActivities(token, after, 100)

  let imported = 0
  for (const a of activities) {
    const localDate = a.start_date_local ? a.start_date_local.slice(0, 10) : null
    const pace =
      a.distance > 0 && a.moving_time ? Math.round(a.moving_time / (a.distance / 1000)) : null
    const { error } = await supabaseAdmin.from('strava_activities').upsert(
      {
        athlete_id: athleteId,
        strava_activity_id: a.id,
        sport_type: a.sport_type || a.type || null,
        name: a.name,
        start_date: a.start_date,
        start_date_local: a.start_date_local,
        local_date: localDate,
        distance_m: a.distance,
        moving_time_s: a.moving_time,
        elapsed_time_s: a.elapsed_time,
        average_pace_s: pace,
        average_heartrate: a.average_heartrate ?? null,
        total_elevation_gain: a.total_elevation_gain ?? null,
      },
      { onConflict: 'strava_activity_id' }
    )
    if (!error) imported++
  }

  const matched = await matchAthlete(athleteId)

  await supabaseAdmin
    .from('strava_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('athlete_id', athleteId)

  return { imported, matched }
}
