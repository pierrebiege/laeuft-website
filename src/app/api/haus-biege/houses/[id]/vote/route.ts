import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { HAUS_BIEGE_PEOPLE } from '@/lib/hausBiege'

// POST /api/haus-biege/houses/[id]/vote — Bewertung anlegen/aktualisieren
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { person_key, rating, comment } = body

  if (!HAUS_BIEGE_PEOPLE.some((p) => p.key === person_key)) {
    return NextResponse.json({ error: 'person_key ist ungültig' }, { status: 400 })
  }
  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'rating muss 1–5 sein' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('haus_biege_votes')
    .upsert(
      {
        house_id: id,
        person_key,
        rating: ratingNum,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'house_id,person_key' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
