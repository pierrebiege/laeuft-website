import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { HAUS_BIEGE_PEOPLE } from '@/lib/hausBiege'

// GET /api/haus-biege/houses — Liste aller Häuser inkl. Bewertungen
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('haus_biege_houses')
    .select('*, votes:haus_biege_votes(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/haus-biege/houses — neues Haus anlegen
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, title, image_url, description, price, rooms, size_m2, location, notes, added_by } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url ist erforderlich' }, { status: 400 })
  }
  if (!added_by || !HAUS_BIEGE_PEOPLE.some((p) => p.key === added_by)) {
    return NextResponse.json({ error: 'added_by ist ungültig' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('haus_biege_houses')
    .insert({
      url,
      title: title || url,
      image_url: image_url || null,
      description: description || null,
      price: price ?? null,
      rooms: rooms ?? null,
      size_m2: size_m2 ?? null,
      location: location || null,
      notes: notes || null,
      added_by,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
