import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getAthletePlan } from '@/lib/athletePlan'

// Läufe (Strava sport_type), die als Lauf-Einheit zählen.
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])
const PACE_TOLERANCE_S = 15      // ±15 s/km (Pierres Pace-Range-Toleranz)
const MIN_AUTO_DISTANCE_M = 1000 // Mini-Aktivitäten (<1 km) nicht auto-matchen

// Montag der Plan-Startwoche, als UTC-Kalenderdatum (keine TZ-Drift).
function planMonday(startDate: string): Date {
  const d = new Date(startDate + 'T00:00:00Z')
  const day = d.getUTCDay()
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface PlanSession {
  id: string
  target_distance_m: number | null
  target_pace_min_s: number | null
  target_pace_max_s: number | null
}

// Pace-/Distanz-Bewertung gegen die Zielwerte einer Einheit.
export function evaluate(
  session: { target_distance_m: number | null; target_pace_min_s: number | null; target_pace_max_s: number | null },
  totalDistanceM: number | null,
  totalPaceS: number | null
): { paceInRange: boolean | null; distanceDeltaM: number | null } {
  const paceInRange =
    session.target_pace_min_s && session.target_pace_max_s && totalPaceS
      ? totalPaceS >= session.target_pace_min_s - PACE_TOLERANCE_S &&
        totalPaceS <= session.target_pace_max_s + PACE_TOLERANCE_S
      : null
  const distanceDeltaM =
    session.target_distance_m && totalDistanceM ? Math.round(totalDistanceM - session.target_distance_m) : null
  return { paceInRange, distanceDeltaM }
}

/**
 * Auto-Match: ordnet Strava-Läufe geplanten Lauf-Einheiten zu — NUR bei
 * Eindeutigkeit (genau 1 brauchbarer Lauf + genau 1 offene Lauf-Einheit am
 * selben Tag). Mehrdeutige Tage (mehrere Läufe) bleiben offen → manuell
 * (zuordnen/zusammenzählen) in der App.
 */
export async function matchAthlete(athleteId: string): Promise<number> {
  const result = await getAthletePlan(athleteId)
  if (!result) return 0
  const { plan } = result

  const monday = planMonday(plan.start_date)
  const sessionsByDate = new Map<string, PlanSession[]>()
  for (const w of plan.weeks) {
    for (const s of w.sessions || []) {
      if (s.session_type !== 'lauf') continue
      const d = new Date(monday)
      d.setUTCDate(monday.getUTCDate() + (w.week_number - 1) * 7 + s.day_of_week)
      const arr = sessionsByDate.get(isoDate(d)) || []
      arr.push({
        id: s.id,
        target_distance_m: s.target_distance_m ?? null,
        target_pace_min_s: s.target_pace_min_s ?? null,
        target_pace_max_s: s.target_pace_max_s ?? null,
      })
      sessionsByDate.set(isoDate(d), arr)
    }
  }
  if (sessionsByDate.size === 0) return 0

  const { data: acts } = await supabaseAdmin
    .from('strava_activities')
    .select('id, sport_type, local_date, distance_m, moving_time_s, average_pace_s')
    .eq('athlete_id', athleteId)

  const runsByDate = new Map<string, { id: string; distance_m: number | null; moving_time_s: number | null; average_pace_s: number | null }[]>()
  for (const a of acts || []) {
    if (!a.local_date || !RUN_TYPES.has(a.sport_type) || (a.distance_m ?? 0) < MIN_AUTO_DISTANCE_M) continue
    const arr = runsByDate.get(a.local_date) || []
    arr.push({ id: a.id, distance_m: a.distance_m, moving_time_s: a.moving_time_s, average_pace_s: a.average_pace_s })
    runsByDate.set(a.local_date, arr)
  }

  const { data: existing } = await supabaseAdmin
    .from('session_activity_matches')
    .select('session_id, activity_ids')
    .eq('athlete_id', athleteId)
  const matchedSessions = new Set((existing || []).map((m) => m.session_id))
  const matchedActivities = new Set((existing || []).flatMap((m) => (m.activity_ids as string[] | null) || []))

  let count = 0
  for (const [date, sessions] of sessionsByDate) {
    const freeSessions = sessions.filter((s) => !matchedSessions.has(s.id))
    const freeRuns = (runsByDate.get(date) || []).filter((r) => !matchedActivities.has(r.id))
    if (freeSessions.length !== 1 || freeRuns.length !== 1) continue

    const s = freeSessions[0]
    const r = freeRuns[0]
    const { paceInRange, distanceDeltaM } = evaluate(s, r.distance_m, r.average_pace_s)

    const { error } = await supabaseAdmin.from('session_activity_matches').upsert(
      {
        session_id: s.id,
        activity_id: r.id,
        activity_ids: [r.id],
        athlete_id: athleteId,
        source: 'auto',
        confidence: 'hoch',
        total_distance_m: r.distance_m,
        total_moving_time_s: r.moving_time_s,
        total_pace_s: r.average_pace_s,
        activity_count: 1,
        distance_delta_m: distanceDeltaM,
        pace_in_range: paceInRange,
      },
      { onConflict: 'session_id' }
    )
    if (error) continue

    await supabaseAdmin.from('training_completions').upsert(
      { session_id: s.id, plan_token: plan.unique_token, completed_at: new Date().toISOString() },
      { onConflict: 'session_id,plan_token' }
    )
    matchedSessions.add(s.id)
    matchedActivities.add(r.id)
    count++
  }

  return count
}
