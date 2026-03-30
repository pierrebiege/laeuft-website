import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { name, description, category, muscle_group, video_url, image_url, instructions } = body

  if (!name || !category) {
    return NextResponse.json(
      { error: 'Name und Kategorie sind erforderlich' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('exercises')
    .insert({
      name,
      description: description || null,
      category,
      muscle_group: muscle_group || null,
      video_url: video_url || null,
      image_url: image_url || null,
      instructions: instructions || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
