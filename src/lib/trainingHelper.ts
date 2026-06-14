import { TrainingPlan, TrainingWeek, TrainingSession } from '@/lib/supabase'

interface TodaysSessionsResult {
  week: TrainingWeek | null
  sessions: TrainingSession[]
  dayOfWeek: number
}

export function getTodaysSessions(
  plan: TrainingPlan,
  weeks: TrainingWeek[]
): TodaysSessionsResult {
  const today = new Date()
  const startDate = new Date(plan.start_date)

  // Get Monday of start week
  const day = startDate.getDay()
  const mondayOffset = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  const monday = new Date(startDate)
  monday.setDate(monday.getDate() + mondayOffset)

  // Reset times to midnight for clean day comparison
  today.setHours(0, 0, 0, 0)
  monday.setHours(0, 0, 0, 0)

  const diffDays = Math.floor(
    (today.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0) return { week: null, sessions: [], dayOfWeek: -1 }

  const weekIndex = Math.floor(diffDays / 7)
  const dayOfWeek = diffDays % 7 // 0=Mon, 6=Sun

  const week =
    weeks.find((w) => w.sort_order === weekIndex) || weeks[weekIndex] || null
  if (!week) return { week: null, sessions: [], dayOfWeek }

  const sessions = (week.sessions || []).filter(
    (s) => s.day_of_week === dayOfWeek
  )
  return { week, sessions, dayOfWeek }
}

interface CurrentWeekResult {
  week: TrainingWeek | null
  weekIndex: number
  weekMonday: Date | null
}

// Returns the plan week that contains the reference date (today by default),
// or null if the plan hasn't started yet / has already ended, plus the Monday
// date of that week. Pass a future refDate to look ahead (e.g. the Sunday-evening
// mail sends the week that starts the next day).
export function getCurrentWeek(
  plan: TrainingPlan,
  weeks: TrainingWeek[],
  refDate: Date = new Date()
): CurrentWeekResult {
  const today = new Date(refDate)
  const startDate = new Date(plan.start_date)

  const day = startDate.getDay()
  const mondayOffset = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  const startMonday = new Date(startDate)
  startMonday.setDate(startMonday.getDate() + mondayOffset)

  today.setHours(0, 0, 0, 0)
  startMonday.setHours(0, 0, 0, 0)

  const diffDays = Math.floor(
    (today.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0) return { week: null, weekIndex: -1, weekMonday: null }

  const weekIndex = Math.floor(diffDays / 7)
  const week =
    weeks.find((w) => w.sort_order === weekIndex) || weeks[weekIndex] || null
  if (!week) return { week: null, weekIndex, weekMonday: null }

  const weekMonday = new Date(startMonday)
  weekMonday.setDate(startMonday.getDate() + weekIndex * 7)
  return { week, weekIndex, weekMonday }
}
