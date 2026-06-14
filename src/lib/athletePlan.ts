import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { TrainingPlan, TrainingWeek, TrainingSession, TrainingCompletion } from '@/lib/supabase'

export type FullAthletePlan = TrainingPlan & {
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

export interface SessionMatch {
  session_id: string
  pace_in_range: boolean | null
  distance_delta_m: number | null
  activity: {
    distance_m: number | null
    average_pace_s: number | null
    moving_time_s: number | null
    start_date_local: string | null
    average_heartrate: number | null
    total_elevation_gain: number | null
  } | null
}

export interface AthletePlanResult {
  plan: FullAthletePlan
  completions: TrainingCompletion[]
  matches: SessionMatch[]
  stravaConnected: boolean
  lastSync: string | null
}

/**
 * Lädt den aktiven Plan der/des eingeloggten Athlet:in über die Service-Role
 * (kein anon-Read). Verknüpfung: athletes → clients.athlete_id → training_plans.
 */
export async function getAthletePlan(athleteId: string): Promise<AthletePlanResult | null> {
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('athlete_id', athleteId)

  const clientIds = (clients || []).map((c: { id: string }) => c.id)
  if (clientIds.length === 0) return null

  const { data: plans } = await supabaseAdmin
    .from('training_plans')
    .select(
      '*, weeks:training_weeks(*, sessions:training_sessions(*, exercises:session_exercises(*, exercise:exercises(*))))'
    )
    .in('client_id', clientIds)
    .in('status', ['active', 'sent'])
    .order('start_date', { ascending: false })

  if (!plans || plans.length === 0) return null

  const plan = ((plans as TrainingPlan[]).find((p) => p.status === 'active') || plans[0]) as FullAthletePlan
  plan.weeks = (plan.weeks || []).sort((a, b) => a.sort_order - b.sort_order)
  plan.weeks.forEach((w) => w.sessions?.sort((a, b) => a.sort_order - b.sort_order))

  const { data: comps } = await supabaseAdmin
    .from('training_completions')
    .select('*')
    .eq('plan_token', plan.unique_token)

  const { data: matchRows } = await supabaseAdmin
    .from('session_activity_matches')
    .select(
      'session_id, pace_in_range, distance_delta_m, activity:strava_activities(distance_m, average_pace_s, moving_time_s, start_date_local, average_heartrate, total_elevation_gain)'
    )
    .eq('athlete_id', athleteId)

  const { data: conn } = await supabaseAdmin
    .from('strava_connections')
    .select('last_sync_at')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  return {
    plan,
    completions: (comps || []) as TrainingCompletion[],
    matches: (matchRows || []) as unknown as SessionMatch[],
    stravaConnected: !!conn,
    lastSync: conn?.last_sync_at ?? null,
  }
}
