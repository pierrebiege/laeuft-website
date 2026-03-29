'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  supabase,
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  TrainingCompletion,
  SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  DAY_LABELS,
} from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

type FullPlan = TrainingPlan & {
  client: { id: string; name: string; company: string | null }
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

type CompletionMap = Record<string, TrainingCompletion>

export default function TrainingPlanPage() {
  const params = useParams()
  const token = params.token as string

  const [plan, setPlan] = useState<FullPlan | null>(null)
  const [completions, setCompletions] = useState<CompletionMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [togglingSession, setTogglingSession] = useState<string | null>(null)
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({})
  const feedbackTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    loadPlan()
  }, [token])

  async function loadPlan() {
    try {
      // Fetch plan with nested weeks and sessions
      const { data: planData, error: planError } = await supabase
        .from('training_plans')
        .select(`
          *,
          client:clients(id, name, company),
          weeks:training_weeks(
            *,
            sessions:training_sessions(*)
          )
        `)
        .eq('unique_token', token)
        .single()

      if (planError || !planData) {
        setError('not_found')
        setLoading(false)
        return
      }

      // Sort weeks by sort_order, sessions by sort_order
      const fullPlan = planData as FullPlan
      fullPlan.weeks = (fullPlan.weeks || []).sort((a, b) => a.sort_order - b.sort_order)
      fullPlan.weeks.forEach((w) => {
        w.sessions = (w.sessions || []).sort((a, b) => a.sort_order - b.sort_order)
      })

      setPlan(fullPlan)

      // Fetch completions
      const { data: completionData } = await supabase
        .from('training_completions')
        .select('*')
        .eq('plan_token', token)

      const map: CompletionMap = {}
      const fbValues: Record<string, string> = {}
      ;(completionData || []).forEach((c: TrainingCompletion) => {
        map[c.session_id] = c
        if (c.feedback) fbValues[c.session_id] = c.feedback
      })
      setCompletions(map)
      setFeedbackValues(fbValues)

      // Auto-detect current week
      const startDate = new Date(fullPlan.start_date)
      const today = new Date()
      const diffMs = today.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const currentWeek = Math.floor(diffDays / 7)
      const clampedIndex = Math.max(0, Math.min(currentWeek, fullPlan.weeks.length - 1))
      setCurrentWeekIndex(clampedIndex)

      setLoading(false)
    } catch {
      setError('not_found')
      setLoading(false)
    }
  }

  const toggleSession = useCallback(
    async (sessionId: string) => {
      if (togglingSession) return
      setTogglingSession(sessionId)

      const isCompleted = !!completions[sessionId]

      try {
        const res = await fetch('/api/training/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            plan_token: token,
            completed: !isCompleted,
          }),
        })

        if (res.ok) {
          if (isCompleted) {
            // Remove completion
            setCompletions((prev) => {
              const next = { ...prev }
              delete next[sessionId]
              return next
            })
            setFeedbackValues((prev) => {
              const next = { ...prev }
              delete next[sessionId]
              return next
            })
          } else {
            // Add completion
            const data = await res.json()
            setCompletions((prev) => ({ ...prev, [sessionId]: data }))
          }
        }
      } catch {
        // Silently fail
      }
      setTogglingSession(null)
    },
    [completions, token, togglingSession]
  )

  const saveFeedback = useCallback(
    (sessionId: string, feedback: string) => {
      // Clear previous debounce
      if (feedbackTimeouts.current[sessionId]) {
        clearTimeout(feedbackTimeouts.current[sessionId])
      }

      setFeedbackValues((prev) => ({ ...prev, [sessionId]: feedback }))

      // Debounce save
      feedbackTimeouts.current[sessionId] = setTimeout(async () => {
        await fetch('/api/training/complete', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            plan_token: token,
            feedback,
          }),
        })
      }, 800)
    },
    [token]
  )

  const toggleExpand = useCallback((sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs">Lade Trainingsplan...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !plan) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Trainingsplan nicht gefunden
          </h1>
          <p className="text-zinc-500 text-sm">
            Dieser Trainingsplan existiert nicht oder ist nicht mehr verfügbar.
          </p>
        </div>
      </div>
    )
  }

  const weeks = plan.weeks
  const currentWeek = weeks[currentWeekIndex]
  if (!currentWeek) return null

  // Group sessions by day_of_week (0=Mo, 6=So)
  const sessionsByDay: Record<number, TrainingSession[]> = {}
  for (let d = 0; d < 7; d++) {
    sessionsByDay[d] = currentWeek.sessions.filter((s) => s.day_of_week === d)
  }

  // Progress for current week
  const totalSessions = currentWeek.sessions.filter((s) => s.session_type !== 'ruhe').length
  const completedSessions = currentWeek.sessions.filter(
    (s) => s.session_type !== 'ruhe' && completions[s.id]
  ).length

  // Get Monday of the week containing start_date
  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay() // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
    d.setDate(d.getDate() + diff)
    return d
  }

  // Calculate day date
  function getDayDate(dayOfWeek: number): string {
    const monday = getMonday(new Date(plan!.start_date + 'T00:00:00'))
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + (currentWeek.week_number - 1) * 7 + dayOfWeek)
    return dayDate.toLocaleDateString('de-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  // Check if a day is today
  function isToday(dayOfWeek: number): boolean {
    const monday = getMonday(new Date(plan!.start_date + 'T00:00:00'))
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + (currentWeek.week_number - 1) * 7 + dayOfWeek)
    const today = new Date()
    return (
      dayDate.getFullYear() === today.getFullYear() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getDate() === today.getDate()
    )
  }

  // Intensity dots
  function renderIntensity(intensity: number | null) {
    if (!intensity) return null
    const filled = Math.min(intensity, 10)
    const empty = 10 - filled
    return (
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs text-zinc-500 mr-1">Intensität:</span>
        <span className="text-xs tracking-wider">
          <span className="text-zinc-900 dark:text-white">{'●'.repeat(filled)}</span>
          <span className="text-zinc-300 dark:text-zinc-700">{'○'.repeat(empty)}</span>
        </span>
      </div>
    )
  }

  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-16">
        {/* Header */}
        <header className="mb-6">
          <div className="text-xl font-bold mb-0.5">
            Läuft<span className="text-zinc-400">.</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {plan.title}
          </h1>
          <p className="text-sm text-zinc-500">
            {plan.client?.name}
          </p>
        </header>

        {/* Week Navigator */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentWeekIndex((i) => Math.max(0, i - 1))}
            disabled={currentWeekIndex === 0}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft size={20} className="text-zinc-700 dark:text-zinc-300" />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Woche {currentWeek.week_number} von {weeks.length}
            </span>
            {currentWeek.label && (
              <span className="block text-xs text-zinc-500">{currentWeek.label}</span>
            )}
          </div>
          <button
            onClick={() => setCurrentWeekIndex((i) => Math.min(weeks.length - 1, i + 1))}
            disabled={currentWeekIndex === weeks.length - 1}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Nächste Woche"
          >
            <ChevronRight size={20} className="text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">
              {completedSessions}/{totalSessions} erledigt
            </span>
            {completedSessions === totalSessions && totalSessions > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <Check size={12} /> Alles geschafft!
              </span>
            )}
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Day Cards */}
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const daySessions = sessionsByDay[dayIndex] || []
            const today = isToday(dayIndex)

            return (
              <div
                key={dayIndex}
                className={`rounded-xl border transition-colors ${
                  today
                    ? 'border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-4 py-2.5 border-b ${
                    today
                      ? 'border-zinc-300 dark:border-zinc-600'
                      : 'border-zinc-100 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium capitalize ${
                        today
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {getDayDate(dayIndex)}
                    </span>
                    {today && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                        Heute
                      </span>
                    )}
                  </div>
                </div>

                {/* Sessions */}
                <div className="px-4 py-2">
                  {daySessions.length === 0 ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-600 py-2 italic">
                      Ruhetag
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {daySessions.map((session) => {
                        const isCompleted = !!completions[session.id]
                        const isExpanded = expandedSessions.has(session.id)
                        const isToggling = togglingSession === session.id
                        const colors = SESSION_TYPE_COLORS[session.session_type as SessionType]
                        const typeLabel =
                          SESSION_TYPE_LABELS[session.session_type as SessionType] ||
                          session.session_type

                        return (
                          <div key={session.id} className="py-1.5">
                            {/* Session Row */}
                            <div className="flex items-center gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSession(session.id)
                                }}
                                disabled={isToggling}
                                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                  isCompleted
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-zinc-300 dark:border-zinc-600 hover:border-green-400'
                                } ${isToggling ? 'opacity-50' : ''}`}
                                aria-label={
                                  isCompleted ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'
                                }
                              >
                                {isCompleted && <Check size={14} strokeWidth={3} />}
                              </button>

                              {/* Session Info (clickable to expand) */}
                              <button
                                onClick={() => toggleExpand(session.id)}
                                className="flex-1 flex items-center gap-2 min-w-0 text-left"
                              >
                                {/* Type Badge */}
                                <span
                                  className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                                >
                                  {typeLabel}
                                </span>

                                {/* Title */}
                                <span
                                  className={`text-sm truncate ${
                                    isCompleted
                                      ? 'text-zinc-400 dark:text-zinc-600 line-through'
                                      : 'text-zinc-900 dark:text-white'
                                  }`}
                                >
                                  {session.title}
                                </span>

                                {/* Duration Badge */}
                                {session.duration_minutes && (
                                  <span className="flex-shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                    {session.duration_minutes}min
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Expanded Content */}
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="ml-9 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2 pb-1">
                                {/* Subtype */}
                                {session.session_subtype && (
                                  <p className="text-xs text-zinc-500">
                                    {session.session_subtype}
                                  </p>
                                )}

                                {/* Description */}
                                {session.description && (
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                                    {session.description}
                                  </p>
                                )}

                                {/* Intensity */}
                                {renderIntensity(session.intensity)}

                                {/* Feedback textarea (only when completed) */}
                                {isCompleted && (
                                  <div className="mt-2">
                                    <textarea
                                      placeholder="Wie war das Training? (optional)"
                                      value={feedbackValues[session.id] || ''}
                                      onChange={(e) =>
                                        saveFeedback(session.id, e.target.value)
                                      }
                                      rows={2}
                                      className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 resize-none transition-colors"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
            Powered by <span className="text-zinc-500">läuft.</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
