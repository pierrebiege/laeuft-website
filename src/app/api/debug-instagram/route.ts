import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { NextRequest } from 'next/server'

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

async function tryFetch(path: string, params: Record<string, string> = {}) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!
  const url = new URL(`${GRAPH_API_BASE}${path}`)
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString())
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!
  const now = new Date()
  const since = new Date(now)
  since.setDate(since.getDate() - 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Record<string, any> = {}

  // Test 1: Profile
  results.profile = await tryFetch(`/${id}`, {
    fields: 'id,name,biography,followers_count,follows_count,media_count',
  })

  // Test 2: Account insights with different metric combinations
  const metricTests = [
    'views',
    'reach',
    'accounts_engaged',
    'follows_and_unfollows',
    'impressions',
    'views,reach',
    'views,reach,accounts_engaged',
  ]

  results.account_insights = {}
  for (const metric of metricTests) {
    results.account_insights[metric] = await tryFetch(`/${id}/insights`, {
      metric,
      period: 'day',
      since: since.toISOString().split('T')[0],
      until: now.toISOString().split('T')[0],
    })
  }

  // Test 3: Online followers
  results.online_followers = await tryFetch(`/${id}/insights`, {
    metric: 'online_followers',
    period: 'lifetime',
  })

  // Test 4: Follower demographics
  results.demographics = await tryFetch(`/${id}/insights`, {
    metric: 'follower_demographics',
    period: 'lifetime',
    metric_type: 'total_value',
    breakdown: 'country',
  })

  // Test 5: One media item insights
  const mediaRes = await tryFetch(`/${id}/media`, {
    fields: 'id,media_type',
    limit: '1',
  })
  results.sample_media = mediaRes

  if (mediaRes.ok && mediaRes.data?.data?.[0]) {
    const mediaId = mediaRes.data.data[0].id
    const mediaType = mediaRes.data.data[0].media_type

    // Try different metric combos for this media
    const mediaMetricTests = [
      'views',
      'reach,saved,shares,views',
      'reach,impressions,saved,shares',
      'ig_reels_aggregated_all_plays_count',
    ]

    results.media_insights = {}
    for (const metric of mediaMetricTests) {
      results.media_insights[metric] = await tryFetch(`/${mediaId}/insights`, { metric })
    }
    results.media_type = mediaType
  }

  return NextResponse.json(results, { status: 200 })
}
