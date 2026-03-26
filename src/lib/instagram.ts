import 'server-only'

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

function getToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN not set')
  return token
}

function getAccountId(): string {
  const id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!id) throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID not set')
  return id
}

async function graphFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`)
  url.searchParams.set('access_token', getToken())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Instagram API error ${res.status}: ${body}`)
  }
  return res.json()
}

// Fetch account profile info
export async function fetchAccountProfile() {
  const id = getAccountId()
  return graphFetch<{
    id: string
    name: string
    biography: string
    followers_count: number
    follows_count: number
    media_count: number
    profile_picture_url: string
  }>(`/${id}`, {
    fields: 'id,name,biography,followers_count,follows_count,media_count,profile_picture_url',
  })
}

// Fetch account-level insights for a specific day
export async function fetchAccountInsights(since: string, until: string) {
  const id = getAccountId()
  return graphFetch<{
    data: Array<{
      name: string
      period: string
      values: Array<{ value: number; end_time: string }>
    }>
  }>(`/${id}/insights`, {
    metric: 'impressions,reach,profile_views,website_clicks,accounts_engaged',
    period: 'day',
    since,
    until,
  })
}

// Fetch recent media
export async function fetchRecentMedia(limit: number = 50) {
  const id = getAccountId()
  const result = await graphFetch<{
    data: Array<{
      id: string
      media_type: string
      media_url: string
      thumbnail_url?: string
      permalink: string
      caption?: string
      timestamp: string
      like_count: number
      comments_count: number
    }>
  }>(`/${id}/media`, {
    fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count',
    limit: limit.toString(),
  })
  return result.data || []
}

// Fetch per-media insights
export async function fetchMediaInsights(mediaId: string) {
  try {
    const result = await graphFetch<{
      data: Array<{
        name: string
        values: Array<{ value: number }>
      }>
    }>(`/${mediaId}/insights`, {
      metric: 'reach,impressions,saved,shares,plays',
    })

    const metrics: Record<string, number> = {}
    for (const item of result.data || []) {
      metrics[item.name] = item.values?.[0]?.value || 0
    }
    return metrics
  } catch {
    // Some media types don't support all metrics
    return {}
  }
}

// Fetch audience demographics
export async function fetchAudienceDemographics() {
  const id = getAccountId()

  const [demographicsRes, onlineRes] = await Promise.all([
    graphFetch<{
      data: Array<{
        name: string
        values: Array<{ value: Record<string, number> }>
      }>
    }>(`/${id}/insights`, {
      metric: 'follower_demographics',
      period: 'lifetime',
      metric_type: 'total_value',
      breakdown: 'age,gender,country,city',
    }).catch(() => ({ data: [] })),
    graphFetch<{
      data: Array<{
        name: string
        values: Array<{ value: Record<string, number>; end_time: string }>
      }>
    }>(`/${id}/insights`, {
      metric: 'online_followers',
      period: 'lifetime',
    }).catch(() => ({ data: [] })),
  ])

  return {
    demographics: demographicsRes.data || [],
    online_followers: onlineRes.data || [],
  }
}

// Refresh long-lived token (must be called before expiration, every ~55 days)
export async function refreshLongLivedToken(): Promise<string> {
  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${getToken()}`
  )
  if (!res.ok) throw new Error('Failed to refresh token')
  const data = await res.json()
  return data.access_token
}
