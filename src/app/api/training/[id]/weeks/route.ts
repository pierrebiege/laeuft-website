import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id: plan_id } = await params
  const body = await request.json()

  // Duplicate week (same plan)
  if (body.action === 'duplicate' && body.week_id) {
    return await duplicateWeek(plan_id, body.week_id)
  }

  // Import week from another plan
  if (body.action === 'import_week' && body.source_plan_id && body.source_week_id) {
    return await duplicateWeek(plan_id, body.source_week_id, body.source_plan_id)
  }

  // Update label
  if (body.action === 'update_label' && body.week_id) {
    const { data, error } = await supabaseAdmin
      .from('training_weeks').update({ label: body.label }).eq('id', body.week_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Update summary
  if (body.action === 'update_summary' && body.week_id) {
    const { data, error } = await supabaseAdmin
      .from('training_weeks').update({ summary: body.summary }).eq('id', body.week_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Add new week
  const { data: existing } = await supabaseAdmin
    .from('training_weeks')
    .select('week_number, sort_order')
    .eq('plan_id', plan_id)
    .order('week_number', { ascending: false })
    .limit(1)

  const nextNum = existing && existing.length > 0 ? existing[0].week_number + 1 : 1
  const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      plan_id,
      week_number: nextNum,
      label: body.label || `Woche ${nextNum}`,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const weekId = searchParams.get('week_id')

  if (!weekId) {
    return NextResponse.json({ error: 'week_id erforderlich' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('training_weeks')
    .delete()
    .eq('id', weekId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}

async function duplicateWeek(target_plan_id: string, source_week_id: string, source_plan_id?: string) {
  // Fetch the source week with sessions (can be from another plan)
  const query = supabaseAdmin
    .from('training_weeks')
    .select('*, sessions:training_sessions(*, exercises:session_exercises(*))')
    .eq('id', source_week_id)

  if (source_plan_id) {
    query.eq('plan_id', source_plan_id)
  } else {
    query.eq('plan_id', target_plan_id)
  }

  const { data: sourceWeek, error: fetchError } = await query.single()

  if (fetchError || !sourceWeek) {
    return NextResponse.json({ error: 'Quell-Woche nicht gefunden' }, { status: 404 })
  }

  // Get the next week number and sort order in target plan
  const { data: allWeeks } = await supabaseAdmin
    .from('training_weeks')
    .select('week_number, sort_order')
    .eq('plan_id', target_plan_id)
    .order('week_number', { ascending: false })
    .limit(1)

  const nextNum = allWeeks && allWeeks.length > 0 ? allWeeks[0].week_number + 1 : 1
  const nextSort = allWeeks && allWeeks.length > 0 ? allWeeks[0].sort_order + 1 : 0

  // Create the new week
  const { data: newWeek, error: weekError } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      plan_id: target_plan_id,
      week_number: nextNum,
      label: sourceWeek.label || `Woche ${nextNum}`,
      summary: sourceWeek.summary,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 })
  }

  // Copy sessions + their exercises
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (sourceWeek.sessions || []) as any[]) {
    const { data: newSession } = await supabaseAdmin
      .from('training_sessions')
      .insert({
        week_id: newWeek.id,
        day_of_week: s.day_of_week,
        session_type: s.session_type,
        session_subtype: s.session_subtype,
        title: s.title,
        duration_minutes: s.duration_minutes,
        description: s.description,
        intensity: s.intensity,
        sort_order: s.sort_order,
      })
      .select()
      .single()

    // Copy exercise links
    if (newSession && s.exercises && s.exercises.length > 0) {
      const exerciseCopies = s.exercises.map((ex: { exercise_id: string; sort_order: number; sets: string | null; notes: string | null }) => ({
        session_id: newSession.id,
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order,
        sets: ex.sets,
        notes: ex.notes,
      }))

      await supabaseAdmin.from('session_exercises').insert(exerciseCopies)
    }
  }

  // Return the new week with sessions + exercises
  const { data: fullWeek, error: fullError } = await supabaseAdmin
    .from('training_weeks')
    .select('*, sessions:training_sessions(*, exercises:session_exercises(*, exercise:exercises(*)))')
    .eq('id', newWeek.id)
    .single()

  if (fullError) {
    return NextResponse.json({ error: fullError.message }, { status: 500 })
  }

  return NextResponse.json(fullWeek)
}
