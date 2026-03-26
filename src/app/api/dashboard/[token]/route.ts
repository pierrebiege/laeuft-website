import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { DashboardData, InstagramAudience } from '@/lib/instagram-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = supabaseAdmin

  // Validate token
  const { data: tokenRow, error: tokenError } = await supabase
    .from('dashboard_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or inactive token' }, { status: 404 })
  }

  // Check expiration
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 404 })
  }

  // Increment view count
  await supabase
    .from('dashboard_tokens')
    .update({
      views_count: (tokenRow.views_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', tokenRow.id)

  // Fetch all data in parallel
  const [metricsRes, postsRes, audienceRes, configRes] = await Promise.all([
    supabase
      .from('instagram_metrics')
      .select('*')
      .order('date', { ascending: true })
      .limit(90),
    supabase
      .from('instagram_posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50),
    supabase
      .from('instagram_audience')
      .select('*')
      .order('date', { ascending: false })
      .limit(500),
    supabase
      .from('dashboard_config')
      .select('*')
      .limit(1)
      .single(),
  ])

  const metrics = metricsRes.data || []
  const posts = postsRes.data || []
  const allAudience: InstagramAudience[] = audienceRes.data || []
  const config = configRes.data

  if (!config) {
    return NextResponse.json({ error: 'Dashboard not configured' }, { status: 500 })
  }

  // Parse partner_logos if stored as string
  if (typeof config.partner_logos === 'string') {
    config.partner_logos = JSON.parse(config.partner_logos)
  }

  // Group audience data by type
  const audience = {
    age_gender: allAudience.filter((a) => a.metric_type === 'age_gender'),
    country: allAudience.filter((a) => a.metric_type === 'country'),
    city: allAudience.filter((a) => a.metric_type === 'city'),
    online_followers: allAudience.filter((a) => a.metric_type === 'online_followers'),
  }

  // Compute summary from latest 30 days
  const last30 = metrics.slice(-30)
  const latest = metrics[metrics.length - 1]
  const oldest30 = last30[0]

  const summary = latest && oldest30
    ? {
        current_followers: latest.followers_count,
        follower_growth: latest.followers_count - oldest30.followers_count,
        follower_growth_pct: parseFloat(
          ((latest.followers_count - oldest30.followers_count) / oldest30.followers_count * 100).toFixed(2)
        ),
        avg_engagement_rate: parseFloat(
          (last30.reduce((s, m) => s + (m.engagement_rate || 0), 0) / last30.length).toFixed(2)
        ),
        avg_reach: Math.round(
          last30.reduce((s, m) => s + (m.reach || 0), 0) / last30.length
        ),
        total_posts_period: posts.length,
        posts_per_week: parseFloat((posts.length / (90 / 7)).toFixed(1)),
      }
    : {
        current_followers: 0,
        follower_growth: 0,
        follower_growth_pct: 0,
        avg_engagement_rate: 0,
        avg_reach: 0,
        total_posts_period: 0,
        posts_per_week: 0,
      }

  const dashboardData: DashboardData = {
    config,
    metrics,
    posts,
    audience,
    summary,
  }

  return NextResponse.json(dashboardData, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
