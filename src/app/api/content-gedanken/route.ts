import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('content_gedanken')
    .select('*')
    .order('priority', { ascending: false })
    .order('tag_number', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  if (search) {
    query = query.or(`quote.ilike.%${search}%,philosopher.ilike.%${search}%,context.ilike.%${search}%`)
  }

  const { data, error } = await query

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
    return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_gedanken')
    .update(updates)
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
  const deleteAll = searchParams.get('all')

  if (deleteAll === 'true') {
    const { error } = await supabaseAdmin.from('content_gedanken').delete().neq('id', 0)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: 'all' })
  }

  if (!id) {
    return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('content_gedanken').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: id })
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()

  if (Array.isArray(body)) {
    const { data, error } = await supabaseAdmin
      .from('content_gedanken')
      .upsert(body, { onConflict: 'tag_number' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: data?.length ?? 0 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_gedanken')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
