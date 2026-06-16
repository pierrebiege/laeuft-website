import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Strava-Vorgabe: keine Rohdaten länger als 7 Tage im Cache.
export const STRAVA_RETENTION_DAYS = 7

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Montag (UTC) der Woche, in der `dateStr` (YYYY-MM-DD) liegt.
function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay() // 0=So..6=Sa
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return isoDate(d)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return isoDate(d)
}

/**
 * Friert abgeschlossene Wochen (week_end < heute) eines Athleten EINMALIG als
 * abgeleitetes Aggregat ein (insert-if-missing). Nur Läufe, keine HF, keine
 * Rohdaten — bleibt dauerhaft erhalten, auch nach Disconnect/Purge.
 * Wirft bei DB-Fehler (z.B. fehlende Tabelle) -> Aufrufer überspringt dann
 * den Purge, damit nie Rohdaten ohne vorherige Sicherung gelöscht werden.
 * Gibt die Anzahl neu eingefrorener Wochen zurück.
 */
export async function freezeCompletedWeeks(athleteId: string): Promise<number> {
  const { data: acts, error: actErr } = await supabaseAdmin
    .from('strava_activities')
    .select('local_date, distance_m, moving_time_s, total_elevation_gain, sport_type')
    .eq('athlete_id', athleteId)
  if (actErr) throw actErr
  if (!acts || acts.length === 0) return 0

  const currentWeekMonday = mondayOf(isoDate(new Date()))

  type Agg = { dist: number; time: number; elev: number; count: number; longest: number }
  const weeks = new Map<string, Agg>()
  for (const a of acts) {
    if (!a.local_date) continue
    const sport = (a.sport_type || '').toLowerCase()
    if (sport && !sport.includes('run')) continue // nur Läufe
    const ws = mondayOf(a.local_date)
    if (ws >= currentWeekMonday) continue // laufende Woche noch nicht einfrieren
    const w = weeks.get(ws) || { dist: 0, time: 0, elev: 0, count: 0, longest: 0 }
    const dist = Number(a.distance_m) || 0
    w.dist += dist
    w.time += Number(a.moving_time_s) || 0
    w.elev += Number(a.total_elevation_gain) || 0
    w.count += 1
    if (dist > w.longest) w.longest = dist
    weeks.set(ws, w)
  }
  if (weeks.size === 0) return 0

  const { data: existing, error: exErr } = await supabaseAdmin
    .from('athlete_insights')
    .select('week_start')
    .eq('athlete_id', athleteId)
  if (exErr) throw exErr
  const have = new Set((existing || []).map((r) => r.week_start as string))

  const rows = []
  for (const [ws, w] of weeks) {
    if (have.has(ws)) continue
    rows.push({
      athlete_id: athleteId,
      week_start: ws,
      week_end: addDays(ws, 6),
      run_count: w.count,
      total_distance_m: Math.round(w.dist),
      total_moving_time_s: Math.round(w.time),
      total_elevation_m: Math.round(w.elev),
      avg_pace_s: w.dist > 0 ? Math.round(w.time / (w.dist / 1000)) : null,
      longest_run_m: Math.round(w.longest),
    })
  }
  if (rows.length === 0) return 0

  const { error: insErr } = await supabaseAdmin.from('athlete_insights').insert(rows)
  if (insErr) throw insErr
  return rows.length
}

/**
 * Löscht Strava-Roh-Aktivitäten, die länger als 7 Tage im Cache liegen
 * (gemessen an created_at = Zeitpunkt der Speicherung). Match-Zeilen bleiben
 * dank FK ON DELETE SET NULL erhalten (Aggregate stecken in der Match-Zeile).
 * Gibt die Anzahl gelöschter Aktivitäten zurück.
 */
export async function purgeOldStravaActivities(): Promise<number> {
  const cutoff = new Date(Date.now() - STRAVA_RETENTION_DAYS * 86400 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('strava_activities')
    .delete()
    .lt('created_at', cutoff)
    .select('id')
  if (error) throw error
  return data?.length || 0
}
