import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('*')
    .limit(1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('dashboard_config')
    .update({
      account_name: body.account_name,
      account_bio: body.account_bio,
      hero_headline: body.hero_headline,
      hero_subtext: body.hero_subtext,
      contact_cta_text: body.contact_cta_text,
      contact_email: body.contact_email,
      partner_logos: body.partner_logos,
      updated_at: new Date().toISOString(),
    })
    .not('id', 'is', null) // update the singleton row
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
