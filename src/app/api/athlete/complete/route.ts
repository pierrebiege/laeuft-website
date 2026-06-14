import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAthlete } from '@/lib/athleteAuth'

// Authentifizierte Abhak-/Notiz-Route. Besitz wird über die eingeloggte
// Athleten-Identität geprüft (nicht über den teilbaren plan_token). Der
// plan_token wird serverseitig aus der Session abgeleitet (Schema bleibt vorerst
// session_id + plan_token; Migration auf athlete_id folgt in einem späteren Schritt).

async function ownedPlanToken(sessionId: string, athleteId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('training_sessions')
    .select('id, week:training_weeks(plan:training_plans(unique_token, client:clients(athlete_id)))')
    .eq('id', sessionId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (data as any)?.week?.plan
  if (!plan || plan.client?.athlete_id !== athleteId) return null
  return plan.unique_token as string
}

export async function POST(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response

  const { session_id, completed } = await request.json()
  if (!session_id) {
    return NextResponse.json({ error: 'session_id erforderlich' }, { status: 400 })
  }

  const planToken = await ownedPlanToken(session_id, auth.athlete.id)
  if (!planToken) {
    return NextResponse.json({ error: 'Kein Zugriff auf diese Einheit' }, { status: 403 })
  }

  if (completed === false) {
    // Abhaken rückgängig: Notiz erhalten (completed_at = null), sonst Zeile löschen.
    const { data: existing } = await supabaseAdmin
      .from('training_completions')
      .select('id, feedback')
      .eq('session_id', session_id)
      .eq('plan_token', planToken)
      .maybeSingle()

    if (existing && existing.feedback) {
      const { data, error } = await supabaseAdmin
        .from('training_completions')
        .update({ completed_at: null })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    await supabaseAdmin
      .from('training_completions')
      .delete()
      .eq('session_id', session_id)
      .eq('plan_token', planToken)

    return NextResponse.json({ completed: false })
  }

  const { data, error } = await supabaseAdmin
    .from('training_completions')
    .upsert(
      { session_id, plan_token: planToken, completed_at: new Date().toISOString() },
      { onConflict: 'session_id,plan_token' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAthlete(request)
  if ('response' in auth) return auth.response

  const { session_id, feedback } = await request.json()
  if (!session_id) {
    return NextResponse.json({ error: 'session_id erforderlich' }, { status: 400 })
  }

  const planToken = await ownedPlanToken(session_id, auth.athlete.id)
  if (!planToken) {
    return NextResponse.json({ error: 'Kein Zugriff auf diese Einheit' }, { status: 403 })
  }

  const { data: existing } = await supabaseAdmin
    .from('training_completions')
    .select('id, completed_at')
    .eq('session_id', session_id)
    .eq('plan_token', planToken)
    .maybeSingle()

  const hasFeedback = !!(feedback && feedback.trim())

  if (existing) {
    if (!hasFeedback && existing.completed_at === null) {
      await supabaseAdmin.from('training_completions').delete().eq('id', existing.id)
      return NextResponse.json({ deleted: true })
    }
    const { data, error } = await supabaseAdmin
      .from('training_completions')
      .update({ feedback: hasFeedback ? feedback : null })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!hasFeedback) return NextResponse.json({ noop: true })

  const { data, error } = await supabaseAdmin
    .from('training_completions')
    .insert({ session_id, plan_token: planToken, completed_at: null, feedback })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
