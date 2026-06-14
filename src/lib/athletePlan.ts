import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { TrainingPlan, TrainingWeek, TrainingSession, TrainingCompletion } from '@/lib/supabase'

export type FullAthletePlan = TrainingPlan & {
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[]
}

export interface AthletePlanResult {
  plan: FullAthletePlan
  completions: TrainingCompletion[]
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

  return { plan, completions: (comps || []) as TrainingCompletion[] }
}
