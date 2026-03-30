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

// Fetch account-level insights
// v21+: views/accounts_engaged/follows_and_unfollows need metric_type=total_value
export async function fetchAccountInsights(since: string, until: string) {
  const id = getAccountId()

  // Fetch daily metrics (reach works with period=day)
  const [dailyRes, totalRes] = await Promise.all([
    graphFetch<{
      data: Array<{
        name: string
        period: string
        values: Array<{ value: number; end_time: string }>
      }>
    }>(`/${id}/insights`, {
      metric: 'reach',
      period: 'day',
      since,
      until,
    }).catch(() => ({ data: [] })),

    // Fetch total_value metrics (views, accounts_engaged, follows_and_unfollows)
    graphFetch<{
      data: Array<{
        name: string
        period: string
        total_value?: { value: number }
        values: Array<{ value: number; end_time: string }>
      }>
    }>(`/${id}/insights`, {
      metric: 'views,accounts_engaged,follows_and_unfollows',
      metric_type: 'total_value',
      period: 'day',
      since,
      until,
    }).catch(() => ({ data: [] })),
  ])

  return { daily: dailyRes.data || [], totals: totalRes.data || [] }
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

// Fetch per-media insights (metrics differ by media type)
export async function fetchMediaInsights(mediaId: string, mediaType?: string) {
  // Reels/Videos use different metrics than images/carousels
  const isReel = mediaType === 'VIDEO' || mediaType === 'REEL'

  const metricSets = isReel
    ? ['reach,saved,shares,views']  // Reels: views works, impressions/plays deprecated
    : ['reach,saved,views', 'reach,saved']  // images/carousels: impressions deprecated, try views

  for (const metrics of metricSets) {
    try {
      const result = await graphFetch<{
        data: Array<{
          name: string
          values: Array<{ value: number }>
        }>
      }>(`/${mediaId}/insights`, { metric: metrics })

      const parsed: Record<string, number> = {}
      for (const item of result.data || []) {
        parsed[item.name] = item.values?.[0]?.value || 0
      }
      // Normalize: use views as impressions fallback
      if (!parsed.impressions && parsed.views) parsed.impressions = parsed.views
      if (!parsed.impressions && parsed.plays) parsed.impressions = parsed.plays
      return parsed
    } catch {
      continue // try next metric set
    }
  }
  return {}
}

// Fetch audience demographics (separate calls per breakdown type)
export async function fetchAudienceDemographics() {
  const id = getAccountId()

  const fetchBreakdown = (breakdown: string) =>
    graphFetch<{
      data: Array<{
        name: string
        total_value?: { breakdowns: Array<{ dimension_keys: string[]; results: Array<{ dimension_values: string[]; value: number }> }> }
      }>
    }>(`/${id}/insights`, {
      metric: 'follower_demographics',
      period: 'lifetime',
      metric_type: 'total_value',
      breakdown,
    }).catch(() => ({ data: [] }))

  const [countryRes, cityRes, ageGenderRes] = await Promise.all([
    fetchBreakdown('country'),
    fetchBreakdown('city'),
    fetchBreakdown('age,gender'),
  ])

  function parseBreakdown(res: { data: Array<{ total_value?: { breakdowns: Array<{ results: Array<{ dimension_values: string[]; value: number }> }> } }> }) {
    const results = res.data?.[0]?.total_value?.breakdowns?.[0]?.results || []
    return results.map(r => ({ key: r.dimension_values.join(','), value: r.value }))
      .sort((a, b) => b.value - a.value)
  }

  return {
    countries: parseBreakdown(countryRes),
    cities: parseBreakdown(cityRes),
    ageGender: parseBreakdown(ageGenderRes),
  }
}

// Fetch currently active stories (only available for 24h!)
export async function fetchActiveStories() {
  const id = getAccountId()
  try {
    const result = await graphFetch<{
      data: Array<{
        id: string
        media_type: string
        media_url: string
        thumbnail_url?: string
        timestamp: string
        permalink?: string
      }>
    }>(`/${id}/stories`, {
      fields: 'id,media_type,media_url,thumbnail_url,timestamp,permalink',
    })
    return result.data || []
  } catch {
    return []
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
