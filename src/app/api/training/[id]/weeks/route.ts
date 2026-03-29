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

  // Duplicate week
  if (body.action === 'duplicate' && body.week_id) {
    return await duplicateWeek(plan_id, body.week_id)
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

async function duplicateWeek(plan_id: string, source_week_id: string) {
  // Fetch the source week with sessions
  const { data: sourceWeek, error: fetchError } = await supabaseAdmin
    .from('training_weeks')
    .select('*, sessions:training_sessions(*)')
    .eq('id', source_week_id)
    .eq('plan_id', plan_id)
    .single()

  if (fetchError || !sourceWeek) {
    return NextResponse.json(
      { error: 'Quell-Woche nicht gefunden' },
      { status: 404 }
    )
  }

  // Get the next week number and sort order
  const { data: allWeeks } = await supabaseAdmin
    .from('training_weeks')
    .select('week_number, sort_order')
    .eq('plan_id', plan_id)
    .order('week_number', { ascending: false })
    .limit(1)

  const nextNum = allWeeks && allWeeks.length > 0 ? allWeeks[0].week_number + 1 : 1
  const nextSort = allWeeks && allWeeks.length > 0 ? allWeeks[0].sort_order + 1 : 0

  // Create the new week
  const { data: newWeek, error: weekError } = await supabaseAdmin
    .from('training_weeks')
    .insert({
      plan_id,
      week_number: nextNum,
      label: `Woche ${nextNum}`,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 })
  }

  // Copy sessions if any exist
  if (sourceWeek.sessions && sourceWeek.sessions.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionCopies = sourceWeek.sessions.map((s: any) => ({
      week_id: newWeek.id,
      day_of_week: s.day_of_week,
      session_type: s.session_type,
      session_subtype: s.session_subtype,
      title: s.title,
      duration_minutes: s.duration_minutes,
      description: s.description,
      intensity: s.intensity,
      sort_order: s.sort_order,
    }))

    const { error: sessionsError } = await supabaseAdmin
      .from('training_sessions')
      .insert(sessionCopies)

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }
  }

  // Return the new week with copied sessions
  const { data: fullWeek, error: fullError } = await supabaseAdmin
    .from('training_weeks')
    .select('*, sessions:training_sessions(*)')
    .eq('id', newWeek.id)
    .single()

  if (fullError) {
    return NextResponse.json({ error: fullError.message }, { status: 500 })
  }

  return NextResponse.json(fullWeek)
}
