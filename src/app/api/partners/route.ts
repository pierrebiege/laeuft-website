import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

// GET /api/partners - List partners with filters
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('partners')
    .select('*, partner_attachments(id)')
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('partner_type', type)
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_first_name.ilike.%${search}%,contact_last_name.ilike.%${search}%,contact_email.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map attachment count
  const partners = (data || []).map((p) => ({
    ...p,
    attachment_count: p.partner_attachments?.length || 0,
    partner_attachments: undefined,
  }))

  return NextResponse.json(partners)
}

// POST /api/partners - Create partner
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { _author, ...partnerData } = body

  const { data, error } = await supabaseAdmin
    .from('partners')
    .insert(partnerData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add creation history entry
  if (_author && data) {
    await supabaseAdmin.from('partner_history').insert({
      partner_id: data.id,
      author: _author,
      note: 'Partner erstellt.',
    })
  }

  return NextResponse.json(data, { status: 201 })
}
