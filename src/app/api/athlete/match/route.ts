import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAthlete } from '@/lib/athleteAuth'
import { evaluate } from '@/lib/stravaMatch'

// Manuelle Zuordnung: eine geplante Einheit mit einem ODER mehreren Strava-
// Läufen verknüpfen (mehrere werden zusammengezählt). Leeres activity_ids =
// Zuordnung aufheben. Besitz wird über die eingeloggte Identität geprüft.
export async function POST(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response
  const athleteId = auth.athlete.id

  const body = await request.json().catch(() => ({}))
  const sessionId: string | undefined = body.session_id
  const activityIds: string[] = Array.isArray(body.activity_ids) ? body.activity_ids : []
  if (!sessionId) return NextResponse.json({ error: 'session_id erforderlich' }, { status: 400 })

  // Einheit + Zielwerte + Besitz prüfen.
  const { data: sess } = await supabaseAdmin
    .from('training_sessions')
    .select(
      'id, target_distance_m, target_pace_min_s, target_pace_max_s, week:training_weeks(plan:training_plans(unique_token, client:clients(athlete_id)))'
    )
    .eq('id', sessionId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (sess as any)?.week?.plan
  if (!sess || !plan || plan.client?.athlete_id !== athleteId) {
    return NextResponse.json({ error: 'Kein Zugriff auf diese Einheit' }, { status: 403 })
  }
  const planToken: string = plan.unique_token

  // Zuordnung aufheben.
  if (activityIds.length === 0) {
    await supabaseAdmin.from('session_activity_matches').delete().eq('session_id', sessionId).eq('athlete_id', athleteId)
    const { data: existingC } = await supabaseAdmin
      .from('training_completions')
      .select('id, feedback')
      .eq('session_id', sessionId)
      .eq('plan_token', planToken)
      .maybeSingle()
    if (existingC?.feedback) {
      await supabaseAdmin.from('training_completions').update({ completed_at: null }).eq('id', existingC.id)
    } else if (existingC) {
      await supabaseAdmin.from('training_completions').delete().eq('id', existingC.id)
    }
    return NextResponse.json({ ok: true, unassigned: true })
  }

  // Gewählte Läufe laden + Besitz prüfen.
  const { data: chosen } = await supabaseAdmin
    .from('strava_activities')
    .select('id, distance_m, moving_time_s')
    .eq('athlete_id', athleteId)
    .in('id', activityIds)
  if (!chosen || chosen.length !== activityIds.length) {
    return NextResponse.json({ error: 'Ungültige Läufe' }, { status: 400 })
  }

  const totalDistance = chosen.reduce((sum, a) => sum + (a.distance_m || 0), 0)
  const totalTime = chosen.reduce((sum, a) => sum + (a.moving_time_s || 0), 0)
  const totalPace = totalDistance > 0 && totalTime ? Math.round(totalTime / (totalDistance / 1000)) : null
  const { paceInRange, distanceDeltaM } = evaluate(sess, totalDistance, totalPace)

  const { error } = await supabaseAdmin.from('session_activity_matches').upsert(
    {
      session_id: sessionId,
      activity_id: chosen[0].id,
      activity_ids: chosen.map((a) => a.id),
      athlete_id: athleteId,
      source: 'athlete',
      confidence: chosen.length > 1 ? 'mittel' : 'hoch',
      total_distance_m: totalDistance,
      total_moving_time_s: totalTime,
      total_pace_s: totalPace,
      activity_count: chosen.length,
      distance_delta_m: distanceDeltaM,
      pace_in_range: paceInRange,
    },
    { onConflict: 'session_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('training_completions').upsert(
    { session_id: sessionId, plan_token: planToken, completed_at: new Date().toISOString() },
    { onConflict: 'session_id,plan_token' }
  )

  return NextResponse.json({ ok: true, count: chosen.length })
}
