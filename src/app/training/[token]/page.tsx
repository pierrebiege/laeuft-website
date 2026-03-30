'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  supabase,
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  TrainingCompletion,
  SessionExercise,
  Exercise,
  SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
} from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Check, Footprints, Dumbbell, Wind, Moon, Clock } from 'lucide-react'

type FullPlan = TrainingPlan & {
  client: { id: string; name: string; company: string | null }
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

type CompletionMap = Record<string, TrainingCompletion>

const TYPE_ICONS: Record<SessionType, React.ElementType> = {
  lauf: Footprints,
  kraft: Dumbbell,
  mobility: Wind,
  ruhe: Moon,
}

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vim = url.match(/vimeo\.com\/(\d+)/)
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`
  return null
}

function ExerciseCard({ exercise, sets, notes }: {
  exercise: { name: string; instructions: string | null; video_url: string | null; image_url: string | null; muscle_group: string | null }
  sets: string | null
  notes: string | null
}) {
  const embedUrl = exercise.video_url ? getVideoEmbedUrl(exercise.video_url) : null

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
      {/* Header: name + badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{exercise.name}</span>
        {sets && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{sets}</span>
        )}
        {exercise.muscle_group && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{exercise.muscle_group}</span>
        )}
      </div>

      {/* Video embed */}
      {embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Image fallback (only if no video) */}
      {!embedUrl && exercise.image_url && (
        <img
          src={exercise.image_url}
          alt={exercise.name}
          className="w-full max-h-48 object-cover rounded-lg"
        />
      )}

      {/* Instructions */}
      {exercise.instructions && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{exercise.instructions}</p>
      )}

      {/* Session-specific notes */}
      {notes && (
        <p className="text-xs text-zinc-500 italic">{notes}</p>
      )}
    </div>
  )
}

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

  useEffect(() => { loadPlan() }, [token])

  async function loadPlan() {
    try {
      const { data: planData, error: planError } = await supabase
        .from('training_plans')
        .select(`*, client:clients(id, name, company), weeks:training_weeks(*, sessions:training_sessions(*, exercises:session_exercises(*, exercise:exercises(*))))`)
        .eq('unique_token', token)
        .single()

      if (planError || !planData) { setError('Plan nicht gefunden'); setLoading(false); return }

      const fullPlan = planData as FullPlan
      fullPlan.weeks.sort((a, b) => a.sort_order - b.sort_order)
      fullPlan.weeks.forEach((w) => w.sessions?.sort((a, b) => a.sort_order - b.sort_order))
      setPlan(fullPlan)

      const { data: compData } = await supabase
        .from('training_completions')
        .select('*')
        .eq('plan_token', token)

      const map: CompletionMap = {}
      const fbValues: Record<string, string> = {}
      for (const c of compData || []) {
        map[c.session_id] = c
        if (c.feedback) fbValues[c.session_id] = c.feedback
      }
      setCompletions(map)
      setFeedbackValues(fbValues)

      // Auto-detect current week
      const startDate = new Date(fullPlan.start_date)
      const today = new Date()
      const diffMs = today.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const weekIdx = Math.max(0, Math.min(Math.floor(diffDays / 7), fullPlan.weeks.length - 1))
      setCurrentWeekIndex(weekIdx)
    } catch { setError('Verbindungsfehler') }
    setLoading(false)
  }

  const toggleSession = useCallback(async (sessionId: string) => {
    setTogglingSession(sessionId)
    const isCompleted = !!completions[sessionId]
    try {
      const res = await fetch('/api/training/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, plan_token: token, completed: !isCompleted }),
      })
      if (res.ok) {
        if (isCompleted) {
          setCompletions((prev) => { const next = { ...prev }; delete next[sessionId]; return next })
        } else {
          const data = await res.json()
          setCompletions((prev) => ({ ...prev, [sessionId]: data }))
        }
      }
    } catch { console.error('Toggle error') }
    setTogglingSession(null)
  }, [completions, token])

  const saveFeedback = useCallback((sessionId: string, feedback: string) => {
    if (feedbackTimeouts.current[sessionId]) clearTimeout(feedbackTimeouts.current[sessionId])
    setFeedbackValues((prev) => ({ ...prev, [sessionId]: feedback }))
    feedbackTimeouts.current[sessionId] = setTimeout(async () => {
      await fetch('/api/training/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, plan_token: token, feedback }),
      })
    }, 800)
  }, [token])

  const toggleExpand = useCallback((sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Plan nicht gefunden</h1>
          <p className="text-zinc-500 text-sm">Dieser Trainingsplan existiert nicht oder ist nicht mehr verfugbar.</p>
        </div>
      </div>
    )
  }

  const weeks = plan.weeks
  const currentWeek = weeks[currentWeekIndex]
  if (!currentWeek) return null

  // --- Stats ---
  const allSessions = weeks.flatMap(w => w.sessions || [])
  const totalAllSessions = allSessions.filter(s => s.session_type !== 'ruhe').length
  const completedAll = allSessions.filter(s => s.session_type !== 'ruhe' && completions[s.id]).length
  const totalMinutes = allSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedMinutes = allSessions.filter(s => completions[s.id]).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const typeCounts: Record<string, number> = {}
  allSessions.forEach(s => {
    if (s.session_type !== 'ruhe') typeCounts[s.session_type] = (typeCounts[s.session_type] || 0) + 1
  })

  // Week stats
  const weekSessions = currentWeek.sessions.filter(s => s.session_type !== 'ruhe')
  const weekCompleted = weekSessions.filter(s => completions[s.id]).length
  const weekMinutes = currentWeek.sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const weekTypeCounts: Record<string, number> = {}
  currentWeek.sessions.forEach(s => {
    if (s.session_type !== 'ruhe') weekTypeCounts[s.session_type] = (weekTypeCounts[s.session_type] || 0) + 1
  })

  const progressPercent = weekSessions.length > 0 ? (weekCompleted / weekSessions.length) * 100 : 0

  // Day sessions
  const sessionsByDay: Record<number, TrainingSession[]> = {}
  for (let d = 0; d < 7; d++) {
    const typeOrder: Record<string, number> = { lauf: 0, kraft: 1, mobility: 2, ruhe: 3 }
    sessionsByDay[d] = (currentWeek.sessions || [])
      .filter(s => s.day_of_week === d)
      .sort((a, b) => (typeOrder[a.session_type] ?? 9) - (typeOrder[b.session_type] ?? 9))
  }

  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
    d.setDate(d.getDate() + diff)
    return d
  }

  function getDayDate(dayOfWeek: number): string {
    const monday = getMonday(new Date(plan!.start_date + 'T00:00:00'))
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + (currentWeek.week_number - 1) * 7 + dayOfWeek)
    return dayDate.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function isToday(dayOfWeek: number): boolean {
    const monday = getMonday(new Date(plan!.start_date + 'T00:00:00'))
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + (currentWeek.week_number - 1) * 7 + dayOfWeek)
    const today = new Date()
    return dayDate.toDateString() === today.toDateString()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-16">

        {/* ===== HERO HEADER ===== */}
        <header className="mb-8">
          <div className="text-xl font-bold mb-4">
            Lauft<span className="text-zinc-400">.</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-sm text-zinc-500 mb-1">Trainingsplan fur</p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{plan.client?.name}</h1>
            <h2 className="text-base text-zinc-600 dark:text-zinc-400 mb-4">{plan.title}</h2>

            {/* Intro text from coach */}
            {plan.intro_text && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 mb-4 border-l-2 border-zinc-900 dark:border-white">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line italic">
                  {plan.intro_text}
                </p>
                <p className="text-xs text-zinc-400 mt-2">-- Pierre</p>
              </div>
            )}

            {/* Compact stats row */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
              <span>{weeks.length} Wochen</span>
              <span>{totalAllSessions} Sessions</span>
              <span>{Math.round(totalMinutes / 60)}h gesamt</span>
            </div>

            {/* Overall progress */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                <span>Gesamtfortschritt</span>
                <span>{completedAll}/{totalAllSessions} ({totalAllSessions > 0 ? Math.round(completedAll / totalAllSessions * 100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${totalAllSessions > 0 ? completedAll / totalAllSessions * 100 : 0}%` }} />
              </div>
            </div>

            {/* Type breakdown */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(typeCounts) as [SessionType, number][]).map(([type, count]) => {
                const colors = SESSION_TYPE_COLORS[type]
                const Icon = TYPE_ICONS[type]
                return (
                  <div key={type} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                    <Icon size={12} />
                    <span className="font-medium">{count}x {SESSION_TYPE_LABELS[type]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </header>

        {/* ===== WEEK NAVIGATOR ===== */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentWeekIndex(i => Math.max(0, i - 1))} disabled={currentWeekIndex === 0}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
            <ChevronLeft size={20} className="text-zinc-700 dark:text-zinc-300" />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Woche {currentWeek.week_number} von {weeks.length}
            </span>
            {currentWeek.label && <span className="block text-xs text-zinc-500">{currentWeek.label}</span>}
          </div>
          <button onClick={() => setCurrentWeekIndex(i => Math.min(weeks.length - 1, i + 1))} disabled={currentWeekIndex === weeks.length - 1}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
            <ChevronRight size={20} className="text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        {/* ===== WEEK SUMMARY + STATS ===== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
          {/* Week summary text */}
          {currentWeek.summary && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 italic">
              {currentWeek.summary}
            </p>
          )}

          {/* Week progress */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">{weekCompleted}/{weekSessions.length} erledigt</span>
            {weekCompleted === weekSessions.length && weekSessions.length > 0 && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check size={12} />Alles geschafft!</span>
            )}
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Week mini stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Clock size={12} />{weekMinutes} min</span>
            {(Object.entries(weekTypeCounts) as [SessionType, number][]).map(([type, count]) => {
              const Icon = TYPE_ICONS[type]
              const colors = SESSION_TYPE_COLORS[type]
              return <span key={type} className={`flex items-center gap-1 ${colors.text}`}><Icon size={12} />{count}</span>
            })}
          </div>
        </div>

        {/* ===== DAY CARDS ===== */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const daySessions = sessionsByDay[dayIndex] || []
            const today = isToday(dayIndex)

            // Skip empty non-today days to keep it clean
            if (daySessions.length === 0 && !today) {
              return (
                <div key={dayIndex} className="px-4 py-2">
                  <span className="text-xs text-zinc-300 dark:text-zinc-700 capitalize">{getDayDate(dayIndex)} -- Ruhetag</span>
                </div>
              )
            }

            return (
              <div key={dayIndex} className={`rounded-xl border transition-colors ${
                today ? 'border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-900 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
              }`}>
                <div className={`px-4 py-2.5 border-b ${today ? 'border-zinc-300 dark:border-zinc-600' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium capitalize ${today ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {getDayDate(dayIndex)}
                    </span>
                    {today && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Heute</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2">
                  {daySessions.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-2 italic">Ruhetag</p>
                  ) : (
                    <div className="space-y-1">
                      {daySessions.map((session) => {
                        const isCompleted = !!completions[session.id]
                        const isExpanded = expandedSessions.has(session.id)
                        const isToggling = togglingSession === session.id
                        const colors = SESSION_TYPE_COLORS[session.session_type as SessionType]
                        const typeLabel = SESSION_TYPE_LABELS[session.session_type as SessionType]

                        return (
                          <div key={session.id} className="py-1.5">
                            <div className="flex items-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); toggleSession(session.id) }}
                                disabled={isToggling}
                                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-green-400'
                                } ${isToggling ? 'opacity-50' : ''}`}>
                                {isCompleted && <Check size={14} strokeWidth={3} />}
                              </button>

                              <button onClick={() => toggleExpand(session.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                                <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{typeLabel}</span>
                                <span className={`text-sm truncate ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>{session.title}</span>
                                {session.duration_minutes && (
                                  <span className="flex-shrink-0 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{session.duration_minutes}min</span>
                                )}
                              </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                              <div className="ml-9 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2 pb-1">
                                {session.session_subtype && <p className="text-xs text-zinc-500">{session.session_subtype}</p>}
                                {session.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{session.description}</p>}
                                {session.intensity && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-zinc-500 mr-1">Intensitat:</span>
                                    <span className="text-xs tracking-wider">
                                      <span className="text-zinc-900 dark:text-white">{'●'.repeat(Math.min(session.intensity, 10))}</span>
                                      <span className="text-zinc-300 dark:text-zinc-700">{'○'.repeat(10 - Math.min(session.intensity, 10))}</span>
                                    </span>
                                  </div>
                                )}
                                {/* Exercises */}
                                {session.exercises && session.exercises.length > 0 && (
                                  <div className="space-y-3 mt-3">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Übungen</h4>
                                    {session.exercises
                                      .sort((a: SessionExercise, b: SessionExercise) => a.sort_order - b.sort_order)
                                      .map((se: SessionExercise) => se.exercise && (
                                        <ExerciseCard key={se.id} exercise={se.exercise} sets={se.sets} notes={se.notes} />
                                      ))}
                                  </div>
                                )}
                                {isCompleted && (
                                  <textarea placeholder="Wie war das Training? (optional)" value={feedbackValues[session.id] || ''}
                                    onChange={(e) => saveFeedback(session.id, e.target.value)} rows={2}
                                    className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-green-400 resize-none mt-1" />
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

        <footer className="mt-10 text-center">
          <p className="text-[10px] text-zinc-400">Powered by <span className="text-zinc-500">lauft.</span></p>
        </footer>
      </div>
    </div>
  )
}
