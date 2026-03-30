import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { InstagramAudience } from '@/lib/instagram-types'

export async function GET(request: NextRequest) {
  const supabase = supabaseAdmin

  const { searchParams } = new URL(request.url)
  const periodDays = parseInt(searchParams.get('period') || '30', 10)
  const validPeriods = [7, 14, 30]
  const days = validPeriods.includes(periodDays) ? periodDays : 30

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

  const allMetrics = metricsRes.data || []
  const allPosts = postsRes.data || []
  const allAudience: InstagramAudience[] = audienceRes.data || []
  const config = configRes.data

  if (!config) {
    return NextResponse.json({ error: 'Dashboard not configured' }, { status: 500 })
  }

  if (typeof config.partner_logos === 'string') {
    config.partner_logos = JSON.parse(config.partner_logos)
  }

  const audience = {
    age_gender: allAudience.filter((a) => a.metric_type === 'age_gender'),
    country: allAudience.filter((a) => a.metric_type === 'country'),
    city: allAudience.filter((a) => a.metric_type === 'city'),
    online_followers: allAudience.filter((a) => a.metric_type === 'online_followers'),
  }

  // Filter metrics to the requested period
  const metrics = allMetrics.slice(-days)
  const latest = metrics[metrics.length - 1]
  const oldest = metrics[0]

  // Filter posts to the requested period
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const posts = allPosts.filter((p) => new Date(p.timestamp) >= cutoff)

  // Build summary from real data only -- no hardcoded fallbacks
  const summary =
    latest && oldest
      ? {
          current_followers: latest.followers_count,
          follower_growth: latest.followers_count - oldest.followers_count,
          follower_growth_pct: parseFloat(
            (
              ((latest.followers_count - oldest.followers_count) /
                oldest.followers_count) *
              100
            ).toFixed(2)
          ),
          avg_engagement_rate: parseFloat(
            (
              metrics.reduce((s, m) => s + (m.engagement_rate || 0), 0) /
              metrics.length
            ).toFixed(2)
          ),
          avg_reach: Math.round(
            metrics.reduce((s, m) => s + (m.reach || 0), 0) / metrics.length
          ),
          total_views: metrics.reduce((s, m) => s + (m.impressions || 0), 0),
          total_interactions: metrics.reduce(
            (s, m) => s + (m.accounts_engaged || 0),
            0
          ),
          total_posts_period: posts.length,
          posts_per_week: parseFloat((posts.length / (days / 7)).toFixed(1)),
          reached_accounts: metrics.reduce((s, m) => s + (m.reach || 0), 0),
          media_count: latest.media_count || 0,
          last_updated: latest.date,
        }
      : null

  return NextResponse.json(
    {
      config,
      metrics,
      posts,
      audience,
      summary,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
