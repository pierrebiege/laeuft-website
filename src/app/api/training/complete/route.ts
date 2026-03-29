import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// PUBLIC route - no auth required. Validates via plan_token instead.

async function validateSessionToken(session_id: string, plan_token: string) {
  const { data: session } = await supabaseAdmin
    .from('training_sessions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('id, week:training_weeks(plan_id, plan:training_plans(unique_token))')
    .eq('id', session_id)
    .single()

  if (!session) {
    return { valid: false, error: 'Session nicht gefunden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (session as any).week?.plan
  if (!plan || plan.unique_token !== plan_token) {
    return { valid: false, error: 'Ungültiger Token' }
  }

  return { valid: true, error: null }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { session_id, plan_token, completed } = body

  if (!session_id || !plan_token) {
    return NextResponse.json(
      { error: 'session_id und plan_token sind erforderlich' },
      { status: 400 }
    )
  }

  // Validate session belongs to plan with this token
  const validation = await validateSessionToken(session_id, plan_token)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 403 })
  }

  if (completed === false) {
    // Remove completion
    await supabaseAdmin
      .from('training_completions')
      .delete()
      .eq('session_id', session_id)
      .eq('plan_token', plan_token)

    return NextResponse.json({ completed: false })
  }

  // Upsert completion
  const { data, error } = await supabaseAdmin
    .from('training_completions')
    .upsert(
      {
        session_id,
        plan_token,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,plan_token' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { session_id, plan_token, feedback } = body

  if (!session_id || !plan_token) {
    return NextResponse.json(
      { error: 'session_id und plan_token sind erforderlich' },
      { status: 400 }
    )
  }

  // Validate session belongs to plan with this token
  const validation = await validateSessionToken(session_id, plan_token)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 403 })
  }

  // Update feedback on existing completion, or create with feedback
  const { data: existing } = await supabaseAdmin
    .from('training_completions')
    .select('id')
    .eq('session_id', session_id)
    .eq('plan_token', plan_token)
    .single()

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('training_completions')
      .update({ feedback })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  // No existing completion - create one with feedback
  const { data, error } = await supabaseAdmin
    .from('training_completions')
    .insert({
      session_id,
      plan_token,
      completed_at: new Date().toISOString(),
      feedback,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
