import { TrainingPlan, TrainingWeek, TrainingSession, TrainingCompletion } from '@/lib/supabase'

// Reine Coaching-Kennzahlen aus UNSEREN Daten: Plan-Zielwerte × Erledigt-Status.
// Keine Strava-Daten → rechtlich unabhängig. Keine Füll-Floskeln: ist eine
// Kennzahl nicht belastbar, gibt sie null zurück und die UI blendet sie aus.

export type PlanForMetrics = TrainingPlan & {
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

export interface WeekVolume {
  week_number: number
  plannedKm: number
  doneKm: number
  plannedCount: number
  doneCount: number
}

export interface AthleteMetrics {
  hasKmTargets: boolean
  thisWeek: WeekVolume | null
  consistency: { done: number; planned: number } // letzte 4 Wochen, Lauf-Einheiten
  acwr: { value: number | null; level: 'gruen' | 'gelb' | 'rot' | null }
  raceInDays: number | null
}

function planMonday(startDate: string): Date {
  const d = new Date(startDate + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function computeMetrics(
  plan: PlanForMetrics,
  completionsBySession: Record<string, TrainingCompletion>
): AthleteMetrics {
  const monday = planMonday(plan.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isDone = (id: string) => !!completionsBySession[id]?.completed_at

  const runs: { date: Date; km: number | null; done: boolean }[] = []
  const weeks: WeekVolume[] = []
  let anyKm = false

  for (const w of plan.weeks) {
    const lauf = (w.sessions || []).filter((s) => s.session_type === 'lauf')
    let plannedKm = 0, doneKm = 0, plannedCount = 0, doneCount = 0
    for (const s of lauf) {
      const km = s.target_distance_m ? s.target_distance_m / 1000 : null
      if (km != null) anyKm = true
      const d = new Date(monday)
      d.setDate(monday.getDate() + (w.week_number - 1) * 7 + s.day_of_week)
      const done = isDone(s.id)
      runs.push({ date: d, km, done })
      plannedCount++
      if (done) doneCount++
      if (km != null) { plannedKm += km; if (done) doneKm += km }
    }
    weeks.push({ week_number: w.week_number, plannedKm, doneKm, plannedCount, doneCount })
  }

  const weekIdx = Math.floor((today.getTime() - monday.getTime()) / (7 * 86400000))
  const thisWeek = weeks.find((w) => w.week_number === weekIdx + 1) || null

  const from28 = new Date(today); from28.setDate(today.getDate() - 27)
  const recent = runs.filter((r) => r.date >= from28 && r.date <= today)
  const consistency = { done: recent.filter((r) => r.done).length, planned: recent.length }

  // ACWR: akute 7-Tage-km / chronische 28-Tage-Wochen-km. Nur bei belastbarer Basis.
  let acwr: AthleteMetrics['acwr'] = { value: null, level: null }
  if (anyKm) {
    const from7 = new Date(today); from7.setDate(today.getDate() - 6)
    const acute = runs.filter((r) => r.done && r.km != null && r.date >= from7 && r.date <= today).reduce((a, r) => a + (r.km || 0), 0)
    const chronicWeekly = runs.filter((r) => r.done && r.km != null && r.date >= from28 && r.date <= today).reduce((a, r) => a + (r.km || 0), 0) / 4
    if (chronicWeekly >= 5 && consistency.planned >= 8) {
      const v = acute / chronicWeekly
      let level: 'gruen' | 'gelb' | 'rot' = 'gruen'
      if (v > 1.5) level = 'rot'
      else if (v > 1.3 || v < 0.8) level = 'gelb'
      acwr = { value: Math.round(v * 100) / 100, level }
    }
  }

  let raceInDays: number | null = null
  if (plan.race_date) {
    const r = new Date(plan.race_date + 'T00:00:00'); r.setHours(0, 0, 0, 0)
    raceInDays = Math.round((r.getTime() - today.getTime()) / 86400000)
  }

  return { hasKmTargets: anyKm, thisWeek, consistency, acwr, raceInDays }
}
