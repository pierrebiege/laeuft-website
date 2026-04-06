import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('presentations')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { customer_name, title, slug: rawSlug } = body

  if (!customer_name) {
    return NextResponse.json({ error: 'customer_name required' }, { status: 400 })
  }

  const slug = (rawSlug || customer_name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

  const share_token = crypto.randomBytes(12).toString('hex')

  const defaultBlocks = [
    { type: 'cover', title: title || `Events 2026`, subtitle: 'Pierre Biege – Schweizer Ultraläufer' },
    { type: 'bio', heading: 'Wer bin ich?', text: 'Ultraläufer aus der Schweiz. Hybrid Athlete. Content Creator.', stats: [] },
    { type: 'race', name: 'Wittikon Backyard Ultra', date: '14. Mai 2026', location: 'Wittikon', description: '' },
    { type: 'race', name: '99 Lap Race', date: '25.–26. Juli 2026', location: 'Schweiz', description: '' },
    { type: 'race', name: 'Last Soul Ultra', date: '14. August 2026', location: 'International', description: '' },
    { type: 'goal', heading: 'Unser Ziel', text: '' },
    { type: 'offer', heading: `Was wir ${customer_name} bieten`, bullets: [] },
    { type: 'contact', name: 'Anes', email: 'anes@laeuft.ch' },
  ]

  const { data, error } = await supabaseAdmin
    .from('presentations')
    .insert({
      slug,
      customer_name,
      title: title || `Events 2026 – Pierre Biege`,
      share_token,
      blocks: defaultBlocks,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
