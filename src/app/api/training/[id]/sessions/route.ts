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
  const { week_id, day_of_week, session_type, session_subtype, title, duration_minutes, description, intensity } = body

  if (!week_id || day_of_week === undefined || !session_type || !title) {
    return NextResponse.json(
      { error: 'week_id, day_of_week, session_type und title sind erforderlich' },
      { status: 400 }
    )
  }

  // Verify week belongs to this plan
  const { data: week, error: weekError } = await supabaseAdmin
    .from('training_weeks')
    .select('id')
    .eq('id', week_id)
    .eq('plan_id', plan_id)
    .single()

  if (weekError || !week) {
    return NextResponse.json(
      { error: 'Woche nicht gefunden oder gehört nicht zu diesem Plan' },
      { status: 404 }
    )
  }

  // Get next sort order for this week
  const { data: existingSessions } = await supabaseAdmin
    .from('training_sessions')
    .select('sort_order')
    .eq('week_id', week_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = existingSessions && existingSessions.length > 0
    ? existingSessions[0].sort_order + 1
    : 0

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .insert({
      week_id,
      day_of_week,
      session_type,
      session_subtype: session_subtype || null,
      title,
      duration_minutes: duration_minutes || null,
      description: description || null,
      intensity: intensity || null,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  await params // validate route param exists
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Session ID erforderlich' }, { status: 400 })
  }

  // Allow updating day_of_week for drag & drop, plus all session fields
  const allowedFields = [
    'day_of_week', 'session_type', 'session_subtype', 'title',
    'duration_minutes', 'description', 'intensity', 'sort_order', 'week_id',
  ]
  const filteredUpdates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in updates) {
      filteredUpdates[field] = updates[field]
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Felder zum Aktualisieren' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .update(filteredUpdates)
    .eq('id', id)
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
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Session ID erforderlich' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('training_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
