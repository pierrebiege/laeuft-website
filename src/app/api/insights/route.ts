import { NextResponse } from 'next/server'
import {
  fetchAccountProfile,
  fetchAccountInsights,
  fetchRecentMedia,
  fetchMediaInsights,
  fetchAudienceDemographics,
} from '@/lib/instagram'

// Simple in-memory cache keyed by period
const cache: Record<string, { data: unknown; timestamp: number }> = {}
const CACHE_TTL = 3600 * 1000 // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30', 10)
  const period = [7, 14, 30].includes(days) ? days : 30
  const cacheKey = `insights_${period}`

  // Return cached data if fresh
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(cache[cacheKey].data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }

  try {
    // Date range for account insights
    const now = new Date()
    const sinceDate = new Date(now)
    sinceDate.setDate(sinceDate.getDate() - period)
    const since = sinceDate.toISOString().split('T')[0]
    const until = now.toISOString().split('T')[0]

    // Fetch profile + media + audience + account insights in parallel
    const [profile, media, audienceRaw, accountInsightsRaw] = await Promise.all([
      fetchAccountProfile(),
      fetchRecentMedia(50),
      fetchAudienceDemographics(),
      fetchAccountInsights(since, until).catch(() => ({ data: [] })),
    ])

    // Fetch per-media insights in parallel
    const mediaWithInsights = await Promise.all(
      media.map(async (item) => {
        const insights = await fetchMediaInsights(item.id, item.media_type)
        return {
          id: item.id,
          media_type: item.media_type,
          media_url: item.media_url || null,
          thumbnail_url: item.thumbnail_url || null,
          permalink: item.permalink,
          caption: item.caption || null,
          timestamp: item.timestamp,
          like_count: item.like_count || 0,
          comments_count: item.comments_count || 0,
          reach: insights.reach || 0,
          impressions: insights.impressions || 0,
          saved: insights.saved || 0,
          shares: insights.shares || 0,
          plays: insights.plays || insights.views || 0,
        }
      })
    )

    // Filter media to the selected period
    const cutoff = sinceDate.getTime()
    const periodMedia = mediaWithInsights.filter(
      (m) => new Date(m.timestamp).getTime() >= cutoff
    )

    // Parse account-level insights (daily + total_value metrics)
    const accountInsights: Record<string, number> = {}
    // Daily metrics (reach): sum all daily values
    for (const metric of accountInsightsRaw.daily || []) {
      const total = (metric.values || []).reduce(
        (sum: number, v: { value: number }) => sum + (v.value || 0), 0
      )
      accountInsights[metric.name] = total
    }
    // Total value metrics (views, accounts_engaged, follows_and_unfollows)
    for (const metric of accountInsightsRaw.totals || []) {
      if (metric.total_value?.value !== undefined) {
        accountInsights[metric.name] = metric.total_value.value
      } else {
        const total = (metric.values || []).reduce(
          (sum: number, v: { value: number }) => sum + (v.value || 0), 0
        )
        accountInsights[metric.name] = total
      }
    }

    // Parse audience demographics
    const audience = parseAudienceDemographics(audienceRaw.demographics)

    // Parse online followers
    const onlineFollowers = parseOnlineFollowers(audienceRaw.online_followers)

    // Aggregate metrics from period media
    const totalReach = accountInsights.reach || periodMedia.reduce((s, p) => s + p.reach, 0)
    const totalViews = accountInsights.views || periodMedia.reduce((s, p) => s + p.impressions, 0)
    const totalImpressions = totalViews // views replaces impressions in v21+
    const totalLikes = periodMedia.reduce((s, p) => s + p.like_count, 0)
    const totalComments = periodMedia.reduce((s, p) => s + p.comments_count, 0)
    const totalSaved = periodMedia.reduce((s, p) => s + p.saved, 0)
    const totalShares = periodMedia.reduce((s, p) => s + p.shares, 0)
    const totalPlays = periodMedia.reduce((s, p) => s + p.plays, 0)
    const totalInteractions = totalLikes + totalComments + totalSaved + totalShares
    const followsAndUnfollows = accountInsights.follows_and_unfollows || 0
    const accountsEngaged = accountInsights.accounts_engaged || periodMedia.reduce((s, p) => s + p.like_count + p.comments_count, 0)

    const engagementRate =
      profile.followers_count > 0 && periodMedia.length > 0
        ? ((totalInteractions / periodMedia.length) / profile.followers_count) * 100
        : 0

    // Impressions breakdown by content type
    const reelsMedia = periodMedia.filter((p) => p.media_type === 'VIDEO' || p.media_type === 'REEL')
    const imagesMedia = periodMedia.filter((p) => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM')
    // For "Stories" we don't get them from media endpoint, so we compute as remainder
    const reelsImpressions = reelsMedia.reduce((s, p) => s + p.impressions, 0)
    const postsImpressions = imagesMedia.reduce((s, p) => s + p.impressions, 0)
    const storiesImpressions = Math.max(0, totalImpressions - reelsImpressions - postsImpressions)

    const impressionsBreakdown = {
      stories: storiesImpressions,
      reels: reelsImpressions,
      posts: postsImpressions,
      total: totalImpressions,
    }

    // Interactions breakdown by content type
    const reelsInteractions = reelsMedia.reduce(
      (s, p) => s + p.like_count + p.comments_count + p.saved + p.shares, 0
    )
    const postsInteractions = imagesMedia.reduce(
      (s, p) => s + p.like_count + p.comments_count + p.saved + p.shares, 0
    )
    const storiesInteractions = Math.max(0, totalInteractions - reelsInteractions - postsInteractions)

    const interactionsBreakdown = {
      stories: storiesInteractions,
      reels: reelsInteractions,
      posts: postsInteractions,
      total: totalInteractions,
    }

    // Top posts by impressions
    const topByImpressions = [...periodMedia]
      .sort((a, b) => (b.impressions || b.plays || 0) - (a.impressions || a.plays || 0))
      .slice(0, 6)

    // Top posts by interactions
    const topByInteractions = [...periodMedia]
      .sort((a, b) => {
        const ia = b.like_count + b.comments_count + b.saved + b.shares
        const ib = a.like_count + a.comments_count + a.saved + a.shares
        return ia - ib
      })
      .slice(0, 6)

    // Content type counts
    const reelCount = periodMedia.filter(
      (p) => p.media_type === 'VIDEO' || p.media_type === 'REEL'
    ).length
    const imageCount = periodMedia.filter((p) => p.media_type === 'IMAGE').length
    const carouselCount = periodMedia.filter(
      (p) => p.media_type === 'CAROUSEL_ALBUM'
    ).length

    // Estimate follower/non-follower split (use accounts_engaged vs reach)
    const followerPctImpressions = profile.followers_count > 0
      ? Math.min(95, Math.max(30, (profile.followers_count / (totalReach || 1)) * 60))
      : 70
    const nonFollowerPctImpressions = 100 - followerPctImpressions

    const followerPctInteractions = 82 // typical for interactions
    const nonFollowerPctInteractions = 100 - followerPctInteractions

    const responseData = {
      profile: {
        name: profile.name,
        biography: profile.biography,
        followers_count: profile.followers_count,
        follows_count: profile.follows_count,
        media_count: profile.media_count,
        profile_picture_url: profile.profile_picture_url,
      },
      media: mediaWithInsights,
      periodMedia,
      topByImpressions,
      topByInteractions,
      audience,
      onlineFollowers,
      accountInsights: {
        impressions: totalImpressions,
        reach: totalReach,
        accountsEngaged,
        followsAndUnfollows,
      },
      impressionsBreakdown,
      interactionsBreakdown,
      followerSplit: {
        impressions: { follower: followerPctImpressions, nonFollower: nonFollowerPctImpressions },
        interactions: { follower: followerPctInteractions, nonFollower: nonFollowerPctInteractions },
      },
      metrics: {
        totalReach,
        totalImpressions,
        totalLikes,
        totalComments,
        totalSaved,
        totalShares,
        totalPlays,
        totalInteractions,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
      },
      contentMix: {
        reels: reelCount,
        images: imageCount,
        carousels: carouselCount,
        total: periodMedia.length,
      },
      period,
      fetchedAt: new Date().toISOString(),
    }

    // Update cache
    cache[cacheKey] = { data: responseData, timestamp: Date.now() }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Instagram API fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Instagram-Daten' },
      { status: 500 }
    )
  }
}

// Parse the demographics data from the Instagram Graph API response
function parseAudienceDemographics(demographics: Array<{
  name: string
  values: Array<{ value: Record<string, number> }>
}>) {
  const result: {
    countries: Array<{ key: string; value: number }>
    cities: Array<{ key: string; value: number }>
    ageGender: Array<{ key: string; value: number }>
  } = {
    countries: [],
    cities: [],
    ageGender: [],
  }

  for (const metric of demographics) {
    const valueMap = metric.values?.[0]?.value || {}
    const entries = Object.entries(valueMap)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)

    if (metric.name === 'follower_demographics') {
      for (const entry of entries) {
        if (entry.key.match(/^[A-Z]{2}$/)) {
          result.countries.push(entry)
        } else if (entry.key.includes(',') || entry.key.includes(' ')) {
          result.cities.push(entry)
        } else {
          result.ageGender.push(entry)
        }
      }
    }
  }

  result.countries.sort((a, b) => b.value - a.value)
  result.cities.sort((a, b) => b.value - a.value)
  result.ageGender.sort((a, b) => b.value - a.value)

  return result
}

// Parse online followers data into per-day, per-hour structure
function parseOnlineFollowers(
  onlineData: Array<{
    name: string
    values: Array<{ value: Record<string, number>; end_time: string }>
  }>
) {
  // online_followers returns hourly data per day for the last ~7 days
  // We aggregate into day-of-week -> hour -> average count
  const dayHourMap: Record<number, Record<number, number[]>> = {}

  for (const metric of onlineData) {
    if (metric.name !== 'online_followers') continue
    for (const entry of metric.values || []) {
      const hourlyValues = entry.value || {}
      const endTime = new Date(entry.end_time)
      const dayOfWeek = endTime.getDay() // 0=Sun, 1=Mon...

      if (!dayHourMap[dayOfWeek]) dayHourMap[dayOfWeek] = {}

      for (const [hour, count] of Object.entries(hourlyValues)) {
        const h = parseInt(hour, 10)
        if (!dayHourMap[dayOfWeek][h]) dayHourMap[dayOfWeek][h] = []
        dayHourMap[dayOfWeek][h].push(count)
      }
    }
  }

  // Average values per day/hour
  const result: Record<number, Record<number, number>> = {}
  for (const [day, hours] of Object.entries(dayHourMap)) {
    result[parseInt(day)] = {}
    for (const [hour, values] of Object.entries(hours)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      result[parseInt(day)][parseInt(hour)] = Math.round(avg)
    }
  }

  return result
}
