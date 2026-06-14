import { TrainingSession } from '@/lib/supabase'

// Reine Formatierungs-Helfer (client + server nutzbar). Pierres Regel:
// Läufe IMMER als km + Zielzeit + Pace-Range — nie nur Minuten.

export function fmtPace(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.round(totalSec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function fmtDistance(meters: number): string {
  const km = meters / 1000
  const str = Number.isInteger(km) ? String(km) : km.toFixed(1).replace('.', ',')
  return `${str} km`
}

export function fmtDuration(seconds: number): string {
  const min = Math.round(seconds / 60)
  if (min < 60) return `ca. ${min} min`
  const h = Math.floor(min / 60)
  const rem = min % 60
  return rem ? `ca. ${h}:${rem.toString().padStart(2, '0')} h` : `ca. ${h} h`
}

/**
 * Zielzeile für eine Einheit:
 *   Lauf mit Zielwerten → "9 km · ca. 1:10 h · 7:45–8:10 min/km"
 *   ohne Zielwerte      → Fallback auf duration_minutes ("ca. 45 min") oder null.
 */
export function targetLine(s: TrainingSession): string | null {
  const parts: string[] = []
  if (s.target_distance_m) parts.push(fmtDistance(s.target_distance_m))
  if (s.target_duration_s) parts.push(fmtDuration(s.target_duration_s))
  else if (!s.target_distance_m && s.duration_minutes) parts.push(`ca. ${s.duration_minutes} min`)
  if (s.target_pace_min_s && s.target_pace_max_s) {
    parts.push(`${fmtPace(s.target_pace_min_s)}–${fmtPace(s.target_pace_max_s)} min/km`)
  }
  return parts.length ? parts.join(' · ') : null
}
