import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const supabase = supabaseAdmin
  const { data, error } = await supabase
    .from('dashboard_tokens')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const supabase = supabaseAdmin

  const token = crypto.randomBytes(24).toString('hex')

  const { data, error } = await supabase
    .from('dashboard_tokens')
    .insert({
      token,
      label: body.label || 'Neuer Token',
      is_active: true,
      expires_at: body.expires_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
