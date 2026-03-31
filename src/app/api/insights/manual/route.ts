import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

// GET: Return all manual insights (public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('instagram_manual_insights')
    .select('*')
    .order('period', { ascending: true })
    .order('metric_type', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST: Save manual insight (requires admin auth)
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()

  const {
    period,
    metric_type,
    total_value,
    follower_pct,
    non_follower_pct,
    stories_pct,
    reels_pct,
    posts_pct,
    erreichte_konten,
  } = body

  if (!period || !metric_type || !total_value) {
    return NextResponse.json(
      { error: 'Pflichtfelder: period, metric_type, total_value' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('instagram_manual_insights')
    .upsert(
      {
        period,
        metric_type,
        total_value,
        follower_pct: follower_pct ?? null,
        non_follower_pct: non_follower_pct ?? null,
        stories_pct: stories_pct ?? null,
        reels_pct: reels_pct ?? null,
        posts_pct: posts_pct ?? null,
        erreichte_konten: erreichte_konten ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'period,metric_type' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
