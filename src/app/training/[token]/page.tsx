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
  SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
} from '@/lib/supabase'
import { Check, ChevronDown, CalendarCheck } from 'lucide-react'

type FullPlan = TrainingPlan & {
  client: { id: string; name: string; company: string | null }
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

type CompletionMap = Record<string, TrainingCompletion>

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{exercise.name}</span>
        {sets && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{sets}</span>
        )}
        {exercise.muscle_group && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{exercise.muscle_group}</span>
        )}
      </div>

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

      {!embedUrl && exercise.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt={exercise.name} className="w-full max-h-48 object-cover rounded-lg" />
      )}

      {exercise.instructions && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{exercise.instructions}</p>
      )}

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
  const [realWeekIndex, setRealWeekIndex] = useState(0)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [togglingSession, setTogglingSession] = useState<string | null>(null)
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({})
  const feedbackTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const todayRef = useRef<HTMLDivElement | null>(null)
  const realPillRef = useRef<HTMLButtonElement | null>(null)

  // PIN protection state
  const [pinRequired, setPinRequired] = useState(false)
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => { loadPlan() }, [token])

  // Put the current week first in the pill strip on load (still scrollable both ways)
  useEffect(() => {
    if (!loading && plan) {
      realPillRef.current?.scrollIntoView({ inline: 'start', block: 'nearest' })
    }
  }, [loading, plan, realWeekIndex])

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

      if (fullPlan.access_pin) {
        const storedPin = sessionStorage.getItem(`training_pin_${token}`)
        if (storedPin === fullPlan.access_pin) {
          setPinUnlocked(true)
          setPinRequired(false)
        } else {
          setPinRequired(true)
          setPinUnlocked(false)
          setLoading(false)
          return
        }
      } else {
        setPinUnlocked(true)
        setPinRequired(false)
      }

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

      const startDate = new Date(fullPlan.start_date)
      const today = new Date()
      const diffMs = today.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const weekIdx = Math.max(0, Math.min(Math.floor(diffDays / 7), fullPlan.weeks.length - 1))
      setCurrentWeekIndex(weekIdx)
      setRealWeekIndex(weekIdx)
    } catch { setError('Verbindungsfehler') }
    setLoading(false)
  }

  // Done only when there is a completion timestamp; note-only rows (feedback
  // without checking off) have completed_at = null.
  const isDone = useCallback((sessionId: string) => !!completions[sessionId]?.completed_at, [completions])

  const toggleSession = useCallback(async (sessionId: string) => {
    setTogglingSession(sessionId)
    const wasDone = !!completions[sessionId]?.completed_at
    try {
      const res = await fetch('/api/training/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, plan_token: token, completed: !wasDone }),
      })
      if (res.ok) {
        const data = await res.json()
        setCompletions((prev) => {
          const next = { ...prev }
          if (wasDone) {
            if (data && data.id) next[sessionId] = data
            else delete next[sessionId]
          } else {
            if (data && data.id) next[sessionId] = data
          }
          return next
        })
      }
    } catch { console.error('Toggle error') }
    setTogglingSession(null)
  }, [completions, token])

  const saveFeedback = useCallback((sessionId: string, feedback: string) => {
    if (feedbackTimeouts.current[sessionId]) clearTimeout(feedbackTimeouts.current[sessionId])
    setFeedbackValues((prev) => ({ ...prev, [sessionId]: feedback }))
    feedbackTimeouts.current[sessionId] = setTimeout(async () => {
      try {
        const res = await fetch('/api/training/complete', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, plan_token: token, feedback }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) {
            setCompletions((prev) => ({ ...prev, [sessionId]: data }))
          } else if (data && data.deleted) {
            setCompletions((prev) => { const next = { ...prev }; delete next[sessionId]; return next })
          }
        }
      } catch { console.error('Feedback error') }
    }, 800)
  }, [token])

  const toggleExpand = useCallback((sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }, [])

  function jumpToToday() {
    setCurrentWeekIndex(realWeekIndex)
    setTimeout(() => {
      realPillRef.current?.scrollIntoView({ inline: 'start', block: 'nearest' })
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!plan) return
    if (pinInput === plan.access_pin) {
      sessionStorage.setItem(`training_pin_${token}`, pinInput)
      setPinUnlocked(true)
      setPinRequired(false)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (pinRequired && !pinUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
            läuft<span className="text-zinc-400">.</span>
          </div>
          <p className="text-sm text-zinc-500 mb-8">Trainingsplan</p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">Bitte gib deinen PIN ein</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false) }}
                placeholder="PIN"
                autoFocus
                className="w-full text-center text-2xl tracking-[0.3em] px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
              {pinError && (
                <p className="text-sm text-red-500">Falscher PIN. Bitte versuche es erneut.</p>
              )}
              <button
                type="submit"
                disabled={!pinInput}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Entsperren
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Plan nicht gefunden</h1>
          <p className="text-zinc-500 text-sm">Dieser Trainingsplan existiert nicht oder ist nicht mehr verfügbar.</p>
        </div>
      </div>
    )
  }

  const weeks = plan.weeks
  const currentWeek = weeks[currentWeekIndex]
  if (!currentWeek) return null

  function weekStats(week: TrainingWeek) {
    const sessions = (week.sessions || []).filter(s => s.session_type !== 'ruhe')
    const done = sessions.filter(s => isDone(s.id)).length
    return { done, total: sessions.length }
  }

  const { done: weekCompleted, total: weekTotal } = weekStats(currentWeek)
  const progressPercent = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0

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

  function dayDateObj(dayOfWeek: number): Date {
    const monday = getMonday(new Date(plan!.start_date + 'T00:00:00'))
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + (currentWeek.week_number - 1) * 7 + dayOfWeek)
    return dayDate
  }

  function isToday(dayOfWeek: number): boolean {
    return dayDateObj(dayOfWeek).toDateString() === new Date().toDateString()
  }

  const weekRange = `${dayDateObj(0).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })} – ${dayDateObj(6).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}`

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">

        {/* ===== SLIM HEADER ===== */}
        <header className="mb-5">
          <div className="text-xl font-bold">läuft<span className="text-zinc-400">.</span></div>
          <p className="text-sm text-zinc-500 mt-1">{plan.client?.name} · {plan.title}</p>
          {plan.intro_text && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line italic mt-3 border-l-2 border-zinc-300 dark:border-zinc-700 pl-3">
              {plan.intro_text}
            </p>
          )}
        </header>

        {/* ===== WEEK SELECTOR (pills) ===== */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {currentWeek.label || `Woche ${currentWeek.week_number}`}
              <span className="text-zinc-400 font-normal"> · {weekRange}</span>
            </span>
            {currentWeekIndex !== realWeekIndex && (
              <button onClick={jumpToToday} className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline">
                <CalendarCheck size={13} /> Zu heute
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {weeks.map((w, i) => {
              const { done, total } = weekStats(w)
              const complete = total > 0 && done === total
              const active = i === currentWeekIndex
              return (
                <button
                  key={w.id}
                  ref={i === realWeekIndex ? realPillRef : undefined}
                  onClick={() => setCurrentWeekIndex(i)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] px-2.5 py-2 rounded-xl border-2 transition-colors ${
                    active
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide opacity-70 leading-none mb-0.5">Wo</span>
                  <span className="text-base font-bold leading-none">{w.week_number}</span>
                  <span className={`mt-1 text-[10px] leading-none ${active ? '' : complete ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {total > 0 ? `${done}/${total}` : '–'}
                  </span>
                  {i === realWeekIndex && (
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${active ? 'bg-white dark:bg-zinc-900' : 'bg-green-500'}`} />
                  )}
                </button>
              )
            })}
            {/* trailing spacer so even the last weeks can scroll to the front */}
            <div className="shrink-0 w-[85%]" aria-hidden="true" />
          </div>
        </div>

        {/* ===== SLIM WEEK PROGRESS ===== */}
        {weekTotal > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">{weekCompleted}/{weekTotal} erledigt</span>
              {weekCompleted === weekTotal && (
                <span className="text-xs text-green-600 font-medium">Alles geschafft!</span>
              )}
            </div>
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {/* ===== DAY CARDS ===== */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const daySessions = sessionsByDay[dayIndex] || []
            const today = isToday(dayIndex)
            const dObj = dayDateObj(dayIndex)
            const dayHeading = `${DAY_NAMES[dayIndex]}, ${dObj.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })}`

            if (daySessions.length === 0 && !today) {
              return (
                <div key={dayIndex} className="px-4 py-1.5">
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">{dayHeading} · Ruhetag</span>
                </div>
              )
            }

            return (
              <div
                key={dayIndex}
                ref={today ? todayRef : undefined}
                className={`rounded-xl border transition-colors ${
                  today ? 'border-green-400 dark:border-green-600 bg-white dark:bg-zinc-900 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
                }`}
              >
                <div className={`px-4 py-2.5 border-b ${today ? 'border-green-100 dark:border-green-900/40' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${today ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {dayHeading}
                    </span>
                    {today && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">Heute</span>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1.5">
                  {daySessions.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-2 px-1 italic">Ruhetag — geniess die Erholung.</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                      {daySessions.map((session) => {
                        const completed = isDone(session.id)
                        const isExpanded = expandedSessions.has(session.id)
                        const isToggling = togglingSession === session.id
                        const colors = SESSION_TYPE_COLORS[session.session_type as SessionType]
                        const typeLabel = SESSION_TYPE_LABELS[session.session_type as SessionType]
                        const hasDetails = !!(session.description || (session.exercises && session.exercises.length > 0) || session.intensity)

                        return (
                          <div key={session.id} className="py-1.5">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleSession(session.id) }}
                                disabled={isToggling || session.session_type === 'ruhe'}
                                aria-label={completed ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
                                className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                  completed ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-green-400 active:scale-95'
                                } ${isToggling ? 'opacity-50' : ''} ${session.session_type === 'ruhe' ? 'opacity-0 pointer-events-none' : ''}`}
                              >
                                {completed && <Check size={18} strokeWidth={3} />}
                              </button>

                              <button onClick={() => toggleExpand(session.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left py-1">
                                <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{typeLabel}</span>
                                <span className={`text-sm font-medium truncate ${completed ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>{session.title}</span>
                                {session.duration_minutes ? (
                                  <span className="flex-shrink-0 text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{session.duration_minutes} min</span>
                                ) : null}
                                {hasDetails && (
                                  <ChevronDown size={15} className={`flex-shrink-0 ml-auto text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                              <div className="ml-11 pr-1 space-y-3 pb-2">
                                {session.description && <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">{session.description}</p>}

                                {session.intensity ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">Intensität</span>
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: 10 }, (_, i) => (
                                        <span key={i} className={`w-2 h-2 rounded-full ${i < session.intensity! ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {session.exercises && session.exercises.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Übungen</h4>
                                    {session.exercises
                                      .sort((a: SessionExercise, b: SessionExercise) => a.sort_order - b.sort_order)
                                      .map((se: SessionExercise) => se.exercise && (
                                        <ExerciseCard key={se.id} exercise={se.exercise} sets={se.sets} notes={se.notes} />
                                      ))}
                                  </div>
                                )}

                                {session.session_type !== 'ruhe' && (
                                  <div>
                                    <label className="block text-[11px] text-zinc-500 mb-1">Notiz an Pierre <span className="text-zinc-400">(optional)</span></label>
                                    <textarea
                                      placeholder="Wie war's? Wie hast du dich gefühlt?"
                                      value={feedbackValues[session.id] || ''}
                                      onChange={(e) => saveFeedback(session.id, e.target.value)}
                                      rows={2}
                                      className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
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

        <footer className="mt-10 text-center">
          <p className="text-[10px] text-zinc-400">Powered by <span className="text-zinc-500">läuft.</span></p>
        </footer>
      </div>
    </div>
  )
}
