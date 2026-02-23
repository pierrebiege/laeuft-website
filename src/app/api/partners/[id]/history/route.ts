import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/partners/[id]/history
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('partner_history')
    .select('*')
    .eq('partner_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST /api/partners/[id]/history
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { author, note } = await request.json()

  const { data, error } = await supabase
    .from('partner_history')
    .insert({ partner_id: id, author, note })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update last_contact on partner
  await supabase
    .from('partners')
    .update({ last_contact: new Date().toISOString().split('T')[0] })
    .eq('id', id)

  return NextResponse.json(data, { status: 201 })
}
