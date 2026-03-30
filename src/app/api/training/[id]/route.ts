import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('training_plans')
    .select('*, client:clients(*), weeks:training_weeks(*, sessions:training_sessions(*, completion:training_completions(*), exercises:session_exercises(*, exercise:exercises(*))))')
    .eq('id', id)
    .order('sort_order', { referencedTable: 'training_weeks', ascending: true })
    .order('sort_order', { referencedTable: 'training_weeks.training_sessions', ascending: true })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Plan nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  // Only allow specific fields to be updated
  const allowedFields = ['title', 'status', 'start_date', 'sent_at', 'intro_text', 'access_pin']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Felder zum Aktualisieren' },
      { status: 400 }
    )
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('training_plans')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('training_plans')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
