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
    .from('content_reels')
    .select('*')
    .order('priority', { ascending: false })
    .order('reel_number', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,hook_text.ilike.%${search}%,caption.ilike.%${search}%`)
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
    .from('content_reels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()

  // Bulk import
  if (Array.isArray(body)) {
    const { data, error } = await supabaseAdmin
      .from('content_reels')
      .upsert(body, { onConflict: 'reel_number' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: data?.length ?? 0 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_reels')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
