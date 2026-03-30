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
