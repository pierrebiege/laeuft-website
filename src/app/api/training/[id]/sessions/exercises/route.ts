import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id ist erforderlich' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('session_exercises')
    .select('*, exercise:exercises(*)')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { session_id, exercise_id, sort_order, sets, notes } = body

  if (!session_id || !exercise_id || sort_order === undefined) {
    return NextResponse.json(
      { error: 'session_id, exercise_id und sort_order sind erforderlich' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('session_exercises')
    .insert({
      session_id,
      exercise_id,
      sort_order,
      sets: sets || null,
      notes: notes || null,
    })
    .select('*, exercise:exercises(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json(
      { error: 'ID ist erforderlich' },
      { status: 400 }
    )
  }

  const allowedFields = ['sort_order', 'sets', 'notes']
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
    .from('session_exercises')
    .update(filteredUpdates)
    .eq('id', id)
    .select('*, exercise:exercises(*)')
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
    return NextResponse.json(
      { error: 'ID ist erforderlich' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('session_exercises')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
