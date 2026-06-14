'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  TrainingCompletion,
  SessionExercise,
  SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
} from '@/lib/supabase'
import { targetLine, fmtPace, fmtDistance } from '@/lib/trainingFormat'
import { Check, ChevronDown, CalendarCheck } from 'lucide-react'

type FullPlan = TrainingPlan & {
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}
type CompletionMap = Record<string, TrainingCompletion>

type MatchInfo = {
  session_id: string
  source: string | null
  pace_in_range: boolean | null
  distance_delta_m: number | null
  total_distance_m: number | null
  total_moving_time_s: number | null
  total_pace_s: number | null
  activity_count: number | null
  activity_ids: string[] | null
}
type ActivityLite = {
  id: string
  local_date: string | null
  sport_type: string | null
  name: string | null
  distance_m: number | null
  average_pace_s: number | null
  moving_time_s: number | null
}

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const TYPE_ORDER: Record<string, number> = { lauf: 0, kraft: 1, mobility: 2, ruhe: 3 }
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vim = url.match(/vimeo\.com\/(\d+)/)
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`
  return null
}

function mondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtMoving(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

function paceSentence(session: TrainingSession, match: MatchInfo): string {
  const p = match.total_pace_s
  if (session.target_pace_min_s && session.target_pace_max_s && p != null) {
    if (p < session.target_pace_min_s - 15) return 'Etwas schneller als geplant.'
    if (p > session.target_pace_max_s + 15) return 'Etwas ruhiger als geplant — alles gut.'
    return 'Pace im Zielbereich.'
  }
  if (match.pace_in_range === true) return 'Pace im Zielbereich.'
  return ''
}

function GelaufenBlock({ session, match }: { session: TrainingSession; match: MatchInfo }) {
  const parts = [
    match.total_distance_m != null ? fmtDistance(match.total_distance_m) : null,
    match.total_pace_s != null ? `${fmtPace(match.total_pace_s)} min/km` : null,
    match.total_moving_time_s != null ? fmtMoving(match.total_moving_time_s) : null,
  ].filter(Boolean)
  const sentence = paceSentence(session, match)
  const combined = (match.activity_count || 1) > 1
  return (
    <div className="mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
        Gelaufen{combined ? ` · ${match.activity_count} Läufe zusammengezählt` : ''}
      </p>
      <p className="text-sm text-zinc-700 dark:text-zinc-200">{parts.join(' · ')}</p>
      {sentence && <p className="text-xs text-zinc-500 mt-0.5">{sentence}</p>}
      <p className="text-[11px] text-zinc-400 mt-1">
        {match.source === 'athlete' ? 'Manuell zugeordnet' : 'Automatisch abgeglichen'} · Strava
      </p>
    </div>
  )
}

function RunPicker({ candidates, selected, onToggle, onSave, onCancel, onUnassign, saving, canUnassign }: {
  candidates: ActivityLite[]
  selected: Set<string>
  onToggle: (id: string) => void
  onSave: () => void
  onCancel: () => void
  onUnassign: () => void
  saving: boolean
  canUnassign: boolean
}) {
  return (
    <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Lauf zuordnen{candidates.length > 1 ? ' — mehrere wählen = zusammenzählen' : ''}
      </p>
      {candidates.length === 0 ? (
        <p className="text-xs text-zinc-500">Keine Strava-Läufe an diesem Tag gefunden.</p>
      ) : (
        candidates.map((a) => {
          const checked = selected.has(a.id)
          return (
            <button key={a.id} onClick={() => onToggle(a.id)} className="w-full flex items-center gap-2 text-left py-0.5">
              <span className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                {checked && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="text-sm text-zinc-700 dark:text-zinc-200 flex-1 min-w-0 truncate">
                {a.distance_m != null ? fmtDistance(a.distance_m) : '—'}
                {a.average_pace_s != null ? ` · ${fmtPace(a.average_pace_s)}/km` : ''}
                {a.moving_time_s != null ? ` · ${fmtMoving(a.moving_time_s)}` : ''}
                {a.name ? <span className="text-zinc-400"> · {a.name}</span> : null}
              </span>
            </button>
          )
        })
      )}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={onSave} disabled={saving || selected.size === 0} className="text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg px-3 py-1.5 disabled:opacity-50">
          {saving ? '…' : selected.size > 1 ? `${selected.size} zuordnen` : 'Zuordnen'}
        </button>
        {canUnassign && (
          <button onClick={onUnassign} disabled={saving} className="text-xs text-zinc-500 hover:underline">Zuordnung aufheben</button>
        )}
        <button onClick={onCancel} className="text-xs text-zinc-400 hover:underline ml-auto">Abbrechen</button>
      </div>
    </div>
  )
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
        {sets && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">{sets}</span>}
        {exercise.muscle_group && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{exercise.muscle_group}</span>}
      </div>
      {embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )}
      {!embedUrl && exercise.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt={exercise.name} className="w-full max-h-48 object-cover rounded-lg" />
      )}
      {exercise.instructions && <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{exercise.instructions}</p>}
      {notes && <p className="text-xs text-zinc-500 italic">{notes}</p>}
    </div>
  )
}

export default function AthleteApp({
  athleteName,
  plan,
  initialCompletions,
  matches,
  activities,
  stravaConnected,
  lastSync,
  stravaStatus,
}: {
  athleteName: string | null
  plan: FullPlan | null
  initialCompletions: TrainingCompletion[]
  matches: MatchInfo[]
  activities: ActivityLite[]
  stravaConnected: boolean
  lastSync: string | null
  stravaStatus: string | null
}) {
  const router = useRouter()

  const [completions, setCompletions] = useState<CompletionMap>(() => {
    const m: CompletionMap = {}
    for (const c of initialCompletions) m[c.session_id] = c
    return m
  })
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const c of initialCompletions) if (c.feedback) m[c.session_id] = c.feedback
    return m
  })
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [realWeekIndex, setRealWeekIndex] = useState(0)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [togglingSession, setTogglingSession] = useState<string | null>(null)
  const [pickerSession, setPickerSession] = useState<string | null>(null)
  const [pickerSel, setPickerSel] = useState<Set<string>>(new Set())
  const [savingMatch, setSavingMatch] = useState(false)
  const feedbackTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const realPillRef = useRef<HTMLButtonElement | null>(null)
  const todayRef = useRef<HTMLDivElement | null>(null)

  const matchMap = useMemo(() => {
    const m: Record<string, MatchInfo> = {}
    for (const x of matches) m[x.session_id] = x
    return m
  }, [matches])
  const usedActivityIds = useMemo(() => {
    const s = new Set<string>()
    for (const x of matches) for (const id of x.activity_ids || []) s.add(id)
    return s
  }, [matches])
  const activitiesByDate = useMemo(() => {
    const m: Record<string, ActivityLite[]> = {}
    for (const a of activities) {
      if (!a.local_date) continue
      ;(m[a.local_date] = m[a.local_date] || []).push(a)
    }
    return m
  }, [activities])

  const candidatesFor = useCallback((iso: string, current?: MatchInfo): ActivityLite[] => {
    const runs = (activitiesByDate[iso] || []).filter((a) => RUN_TYPES.has(a.sport_type || ''))
    const currentIds = current?.activity_ids || []
    return runs.filter((a) => !usedActivityIds.has(a.id) || currentIds.includes(a.id))
  }, [activitiesByDate, usedActivityIds])

  const weeks = plan?.weeks ?? []

  useEffect(() => {
    if (!plan || weeks.length === 0) return
    const startMonday = mondayOf(new Date(plan.start_date + 'T00:00:00'))
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - startMonday.getTime()) / 86400000)
    const idx = Math.max(0, Math.min(Math.floor(diffDays / 7), weeks.length - 1))
    setCurrentWeekIndex(idx)
    setRealWeekIndex(idx)
  }, [plan, weeks.length])

  useEffect(() => {
    realPillRef.current?.scrollIntoView({ inline: 'start', block: 'nearest' })
  }, [realWeekIndex])

  const isDone = useCallback((id: string) => !!completions[id]?.completed_at, [completions])

  const toggleSession = useCallback(async (sessionId: string) => {
    setTogglingSession(sessionId)
    const wasDone = !!completions[sessionId]?.completed_at
    try {
      const res = await fetch('/api/athlete/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, completed: !wasDone }),
      })
      if (res.ok) {
        const data = await res.json()
        setCompletions((prev) => {
          const next = { ...prev }
          if (wasDone) {
            if (data && data.id) next[sessionId] = data
            else delete next[sessionId]
          } else if (data && data.id) {
            next[sessionId] = data
          }
          return next
        })
      }
    } catch { /* offline-tolerant */ }
    setTogglingSession(null)
  }, [completions])

  const saveFeedback = useCallback((sessionId: string, feedback: string) => {
    if (feedbackTimeouts.current[sessionId]) clearTimeout(feedbackTimeouts.current[sessionId])
    setFeedbackValues((prev) => ({ ...prev, [sessionId]: feedback }))
    feedbackTimeouts.current[sessionId] = setTimeout(async () => {
      try {
        const res = await fetch('/api/athlete/complete', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, feedback }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) setCompletions((prev) => ({ ...prev, [sessionId]: data }))
          else if (data && data.deleted) setCompletions((prev) => { const n = { ...prev }; delete n[sessionId]; return n })
        }
      } catch { /* ignore */ }
    }, 800)
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedSessions((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  function openPicker(sessionId: string, current?: MatchInfo) {
    setPickerSel(new Set(current?.activity_ids || []))
    setPickerSession(sessionId)
  }
  function togglePickerSel(id: string) {
    setPickerSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  async function saveMatch(sessionId: string, ids: string[]) {
    setSavingMatch(true)
    try {
      await fetch('/api/athlete/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, activity_ids: ids }),
      })
      setPickerSession(null)
      router.refresh()
    } catch { /* ignore */ }
    setSavingMatch(false)
  }

  async function logout() {
    try { await fetch('/api/athlete/auth', { method: 'DELETE' }) } catch { /* ignore */ }
    router.push('/athlet/login')
  }
  async function disconnectStrava() {
    try { await fetch('/api/strava/disconnect', { method: 'POST' }) } catch { /* ignore */ }
    router.refresh()
  }

  const stravaUi = <StravaSection connected={stravaConnected} lastSync={lastSync} onDisconnect={disconnectStrava} />

  // ---------- Empty State ----------
  if (!plan) {
    return (
      <Shell athleteName={athleteName} onLogout={logout} connected={stravaConnected}>
        <StravaBanner status={stravaStatus} />
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Hier ist noch kein aktiver Plan hinterlegt.</p>
          <p className="text-sm text-zinc-500 mt-1">Sobald Pierre deinen Plan freigibt, erscheint er hier.</p>
        </div>
        <div className="mt-8">{stravaUi}</div>
      </Shell>
    )
  }

  const startMonday = mondayOf(new Date(plan.start_date + 'T00:00:00'))
  function dateOf(weekNumber: number, dayOfWeek: number): Date {
    const d = new Date(startMonday)
    d.setDate(startMonday.getDate() + (weekNumber - 1) * 7 + dayOfWeek)
    return d
  }
  function isTodayDate(d: Date): boolean {
    return d.toDateString() === new Date().toDateString()
  }
  function weekStats(week: TrainingWeek) {
    const sessions = (week.sessions || []).filter((s) => s.session_type !== 'ruhe')
    return { done: sessions.filter((s) => isDone(s.id)).length, total: sessions.length }
  }

  const currentWeek = weeks[currentWeekIndex]

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - startMonday.getTime()) / 86400000)
  const beforeStart = diffDays < 0
  const realWeek = weeks[realWeekIndex]
  const todayDow = ((diffDays % 7) + 7) % 7
  const afterEnd = Math.floor(diffDays / 7) > weeks.length - 1
  const todaySessions = (!beforeStart && !afterEnd && realWeek)
    ? (realWeek.sessions || []).filter((s) => s.day_of_week === todayDow).sort((a, b) => (TYPE_ORDER[a.session_type] ?? 9) - (TYPE_ORDER[b.session_type] ?? 9))
    : []

  function jumpToToday() {
    setCurrentWeekIndex(realWeekIndex)
    setTimeout(() => {
      realPillRef.current?.scrollIntoView({ inline: 'start', block: 'nearest' })
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  return (
    <Shell athleteName={athleteName} planTitle={plan.title} onLogout={logout} connected={stravaConnected}>
      <StravaBanner status={stravaStatus} />

      {plan.intro_text && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line italic mb-5 border-l-2 border-zinc-300 dark:border-zinc-700 pl-3">
          {plan.intro_text}
        </p>
      )}

      {/* ===== HEUTE ===== */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Heute</h2>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500 mb-3">
            {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {beforeStart ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Dein Plan startet am {startMonday.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })}.
            </p>
          ) : afterEnd ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Plan abgeschlossen — stark durchgezogen.</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Heute Ruhetag — Erholung ist Teil des Plans.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => {
                const done = isDone(s.id)
                const colors = SESSION_TYPE_COLORS[s.session_type as SessionType]
                const line = targetLine(s)
                const match = matchMap[s.id]
                return (
                  <div key={s.id} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSession(s.id)}
                      disabled={togglingSession === s.id || s.session_type === 'ruhe'}
                      aria-label={done ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
                      className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                        done ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-green-400 active:scale-95'
                      } ${togglingSession === s.id ? 'opacity-50' : ''}`}
                    >
                      {done && <Check size={20} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{SESSION_TYPE_LABELS[s.session_type as SessionType]}</span>
                        <span className={`text-base font-semibold ${done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>{s.title}</span>
                      </div>
                      {line && <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">{line}</p>}
                      {match ? <GelaufenBlock session={s} match={match} /> : <p className="text-xs text-zinc-400 mt-0.5">{done ? 'Erledigt' : 'Heute offen'}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== WOCHEN-AUSWAHL ===== */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {currentWeek?.label || `Woche ${currentWeek?.week_number}`}
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
                {i === realWeekIndex && <span className={`mt-1 w-1.5 h-1.5 rounded-full ${active ? 'bg-white dark:bg-zinc-900' : 'bg-green-500'}`} />}
              </button>
            )
          })}
          <div className="shrink-0 w-[85%]" aria-hidden="true" />
        </div>
      </div>

      {/* ===== TAGE ===== */}
      {currentWeek && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const daySessions = (currentWeek.sessions || [])
              .filter((s) => s.day_of_week === dayIndex)
              .sort((a, b) => (TYPE_ORDER[a.session_type] ?? 9) - (TYPE_ORDER[b.session_type] ?? 9))
            const dObj = dateOf(currentWeek.week_number, dayIndex)
            const dayIso = isoLocal(dObj)
            const dayIsToday = isTodayDate(dObj)
            const heading = `${DAY_NAMES[dayIndex]}, ${dObj.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })}`

            if (daySessions.length === 0 && !dayIsToday) {
              return (
                <div key={dayIndex} className="px-4 py-1.5">
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">{heading} · Ruhetag</span>
                </div>
              )
            }

            return (
              <div
                key={dayIndex}
                ref={dayIsToday ? todayRef : undefined}
                className={`rounded-xl border transition-colors ${dayIsToday ? 'border-green-400 dark:border-green-600 bg-white dark:bg-zinc-900 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'}`}
              >
                <div className={`px-4 py-2.5 border-b ${dayIsToday ? 'border-green-100 dark:border-green-900/40' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${dayIsToday ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{heading}</span>
                    {dayIsToday && <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">Heute</span>}
                  </div>
                </div>
                <div className="px-3 py-1.5">
                  {daySessions.length === 0 ? (
                    <p className="text-sm text-zinc-400 py-2 px-1 italic">Ruhetag — geniess die Erholung.</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                      {daySessions.map((session) => {
                        const done = isDone(session.id)
                        const isExpanded = expandedSessions.has(session.id)
                        const isToggling = togglingSession === session.id
                        const colors = SESSION_TYPE_COLORS[session.session_type as SessionType]
                        const line = targetLine(session)
                        const match = matchMap[session.id]
                        const hasDetails = !!(session.description || (session.exercises && session.exercises.length > 0) || session.intensity)
                        const isRun = session.session_type === 'lauf'
                        const cands = isRun ? candidatesFor(dayIso, match) : []
                        const pickerOpen = pickerSession === session.id
                        return (
                          <div key={session.id} className="py-1.5">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleSession(session.id) }}
                                disabled={isToggling || session.session_type === 'ruhe'}
                                aria-label={done ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
                                className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                  done ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-green-400 active:scale-95'
                                } ${isToggling ? 'opacity-50' : ''} ${session.session_type === 'ruhe' ? 'opacity-0 pointer-events-none' : ''}`}
                              >
                                {done && <Check size={18} strokeWidth={3} />}
                              </button>
                              <button onClick={() => toggleExpand(session.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left py-1">
                                <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{SESSION_TYPE_LABELS[session.session_type as SessionType]}</span>
                                <span className={`text-sm font-medium truncate ${done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>{session.title}</span>
                                {hasDetails && <ChevronDown size={15} className={`flex-shrink-0 ml-auto text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                              </button>
                            </div>
                            {line && <p className="ml-11 text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">{line}</p>}
                            {match && <div className="ml-11 mt-1"><GelaufenBlock session={session} match={match} /></div>}

                            {/* Strava-Zuordnung (nur Lauf) */}
                            {isRun && (match || cands.length > 0) && (
                              <div className="ml-11 mt-1">
                                {match ? (
                                  <button onClick={() => (pickerOpen ? setPickerSession(null) : openPicker(session.id, match))} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline">
                                    {(match.activity_count || 1) > 1 ? 'Läufe ändern' : 'Anderer Lauf?'}
                                  </button>
                                ) : (
                                  <button onClick={() => (pickerOpen ? setPickerSession(null) : openPicker(session.id))} className="text-xs font-medium text-[#FC4C02] hover:underline">
                                    {cands.length === 1 ? '1 Strava-Lauf an diesem Tag · zuordnen' : `${cands.length} Strava-Läufe an diesem Tag · zuordnen`}
                                  </button>
                                )}
                                {pickerOpen && (
                                  <RunPicker
                                    candidates={cands}
                                    selected={pickerSel}
                                    onToggle={togglePickerSel}
                                    onSave={() => saveMatch(session.id, Array.from(pickerSel))}
                                    onUnassign={() => saveMatch(session.id, [])}
                                    onCancel={() => setPickerSession(null)}
                                    saving={savingMatch}
                                    canUnassign={!!match}
                                  />
                                )}
                              </div>
                            )}

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
                                      .slice()
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
      )}

      <div className="mt-8">{stravaUi}</div>
    </Shell>
  )
}

function StravaBanner({ status }: { status: string | null }) {
  if (!status) return null
  const map: Record<string, { text: string; tone: 'ok' | 'err' }> = {
    connected: { text: 'Strava verbunden — deine Läufe werden ab jetzt automatisch abgeglichen.', tone: 'ok' },
    denied: { text: 'Strava-Verbindung abgebrochen.', tone: 'err' },
    error: { text: 'Bei der Strava-Verbindung ging etwas schief. Bitte nochmal versuchen.', tone: 'err' },
    invalid: { text: 'Strava-Verbindung ungültig (abgelaufen). Bitte nochmal starten.', tone: 'err' },
    notconfigured: { text: 'Strava ist noch nicht eingerichtet.', tone: 'err' },
  }
  const m = map[status]
  if (!m) return null
  return (
    <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${m.tone === 'ok' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'}`}>
      {m.text}
    </div>
  )
}

function StravaSection({ connected, lastSync, onDisconnect }: { connected: boolean; lastSync: string | null; onDisconnect: () => void }) {
  if (connected) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Strava verbunden</p>
          <p className="text-xs text-zinc-500">
            {lastSync ? `Zuletzt abgeglichen: ${new Date(lastSync).toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })}` : 'Erster Abgleich folgt heute Abend.'}
          </p>
        </div>
        <button onClick={onDisconnect} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Trennen</button>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-4">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Strava verbinden</p>
      <p className="text-xs text-zinc-500 mt-1 mb-3">
        Verbinde dein Strava-Konto — dann hakt sich jeder Lauf von selbst ab und du siehst geplant gegen gelaufen. Du kannst die Verbindung jederzeit trennen.
      </p>
      <a
        href="/api/strava/connect"
        className="inline-flex items-center gap-2 rounded-lg bg-[#FC4C02] text-white text-sm font-semibold px-4 py-2 hover:bg-[#e34402] transition-colors"
      >
        Mit Strava verbinden
      </a>
    </div>
  )
}

function Shell({ athleteName, planTitle, onLogout, connected, children }: {
  athleteName: string | null
  planTitle?: string
  onLogout: () => void
  connected: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-xl font-bold">läuft<span className="text-zinc-400">.</span></div>
            <p className="text-sm text-zinc-500 mt-1">
              {athleteName ? athleteName : 'Training'}{planTitle ? ` · ${planTitle}` : ''}
            </p>
          </div>
          <button onClick={onLogout} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-1">Abmelden</button>
        </header>
        {children}
        <footer className="mt-10 text-center space-y-1">
          {connected && <p className="text-[10px] text-zinc-400">Aktivitätsdaten powered by Strava</p>}
          <p className="text-[10px] text-zinc-400">Powered by <span className="text-zinc-500">läuft.</span></p>
        </footer>
      </div>
    </div>
  )
}
