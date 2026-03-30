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
      fetchAccountInsights(since, until).catch(() => ({ daily: [], totals: [] })),
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

    // Audience data comes pre-parsed from the new fetchAudienceDemographics
    const audience = audienceRaw

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
      // onlineFollowers removed - API returns empty data
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
// Old parse functions removed - demographics now parsed in fetchAudienceDemographics()
