import { NextRequest, NextResponse } from 'next/server'
import { requireAthlete } from '@/lib/athleteAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

interface WeekInput {
  week_start: string
  week_end: string
  run_count: number
  total_distance_m: number
  total_moving_time_s: number
  total_elevation_m: number
  avg_pace_s: number | null
  longest_run_m: number
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0)

// GET → aktuelle Wochen-Auswertung des Athleten (für die Anzeige).
export async function GET(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response
  const { data } = await supabaseAdmin
    .from('athlete_insights')
    .select('week_start, week_end, run_count, total_distance_m, total_moving_time_s, total_elevation_m, avg_pace_s, longest_run_m')
    .eq('athlete_id', auth.athlete.id)
    .order('week_start', { ascending: false })
  return NextResponse.json({ weeks: data || [] })
}

// POST { weeks: [...] } → ersetzt die Auswertung des Athleten durch die
// hochgeladenen (eigenen) Daten. Die Rohdaten bleiben im Browser; hier kommen
// nur die fertigen Wochen-Aggregate an.
export async function POST(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response
  const athleteId = auth.athlete.id

  let weeks: WeekInput[] = []
  try {
    const body = await request.json()
    weeks = Array.isArray(body?.weeks) ? body.weeks : []
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }
  if (weeks.length === 0) return NextResponse.json({ error: 'Keine Wochen übermittelt' }, { status: 400 })
  if (weeks.length > 2000) return NextResponse.json({ error: 'Zu viele Wochen' }, { status: 400 })

  const rows = []
  for (const w of weeks) {
    if (!DATE_RE.test(w.week_start) || !DATE_RE.test(w.week_end)) continue
    rows.push({
      athlete_id: athleteId,
      week_start: w.week_start,
      week_end: w.week_end,
      run_count: num(w.run_count),
      total_distance_m: num(w.total_distance_m),
      total_moving_time_s: num(w.total_moving_time_s),
      total_elevation_m: num(w.total_elevation_m),
      avg_pace_s: w.avg_pace_s == null ? null : num(w.avg_pace_s),
      longest_run_m: num(w.longest_run_m),
    })
  }
  if (rows.length === 0) return NextResponse.json({ error: 'Keine gültigen Wochen' }, { status: 400 })

  // Ersetzen: alte Auswertung des Athleten weg, neue rein.
  const { error: delErr } = await supabaseAdmin.from('athlete_insights').delete().eq('athlete_id', athleteId)
  if (delErr) return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })
  const { error: insErr } = await supabaseAdmin.from('athlete_insights').insert(rows)
  if (insErr) return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })

  return NextResponse.json({ ok: true, weeks: rows.length })
}
