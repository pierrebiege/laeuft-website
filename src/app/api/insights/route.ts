import { NextResponse } from 'next/server'
import {
  fetchAccountProfile,
  fetchRecentMedia,
  fetchMediaInsights,
  fetchAudienceDemographics,
} from '@/lib/instagram'

// Simple in-memory cache
let cachedData: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 3600 * 1000 // 1 hour in ms

export async function GET() {
  // Return cached data if fresh
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }

  try {
    // Fetch profile + media + audience in parallel
    const [profile, media, audienceRaw] = await Promise.all([
      fetchAccountProfile(),
      fetchRecentMedia(50),
      fetchAudienceDemographics(),
    ])

    // Fetch per-media insights in parallel (batched to avoid rate limits)
    const mediaWithInsights = await Promise.all(
      media.map(async (item) => {
        const insights = await fetchMediaInsights(item.id)
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
          plays: insights.plays || 0,
        }
      })
    )

    // Parse audience demographics
    const audience = parseAudienceDemographics(audienceRaw.demographics)

    // Compute aggregate metrics
    const totalReach = mediaWithInsights.reduce((s, p) => s + p.reach, 0)
    const totalImpressions = mediaWithInsights.reduce((s, p) => s + p.impressions, 0)
    const totalLikes = mediaWithInsights.reduce((s, p) => s + p.like_count, 0)
    const totalComments = mediaWithInsights.reduce((s, p) => s + p.comments_count, 0)
    const totalSaved = mediaWithInsights.reduce((s, p) => s + p.saved, 0)
    const totalShares = mediaWithInsights.reduce((s, p) => s + p.shares, 0)
    const totalPlays = mediaWithInsights.reduce((s, p) => s + p.plays, 0)
    const totalInteractions = totalLikes + totalComments + totalSaved + totalShares

    const engagementRate =
      profile.followers_count > 0
        ? ((totalInteractions / mediaWithInsights.length) / profile.followers_count) * 100
        : 0

    // Top posts by impressions
    const topPosts = [...mediaWithInsights]
      .sort((a, b) => (b.impressions || b.plays || 0) - (a.impressions || a.plays || 0))
      .slice(0, 4)

    // Content type counts
    const reelCount = mediaWithInsights.filter(
      (p) => p.media_type === 'VIDEO' || p.media_type === 'REEL'
    ).length
    const imageCount = mediaWithInsights.filter((p) => p.media_type === 'IMAGE').length
    const carouselCount = mediaWithInsights.filter(
      (p) => p.media_type === 'CAROUSEL_ALBUM'
    ).length

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
      topPosts,
      audience,
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
        total: mediaWithInsights.length,
      },
      fetchedAt: new Date().toISOString(),
    }

    // Update cache
    cachedData = { data: responseData, timestamp: Date.now() }

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
      // The breakdown determines which field this is
      // We need to check the keys to determine the type
      for (const entry of entries) {
        if (entry.key.match(/^[A-Z]{2}$/)) {
          result.countries.push(entry)
        } else if (entry.key.includes(',') || entry.key.includes(' ')) {
          result.cities.push(entry)
        } else {
          // age_gender keys like "M.25-34", "F.18-24"
          result.ageGender.push(entry)
        }
      }
    }
  }

  // Sort all by value descending
  result.countries.sort((a, b) => b.value - a.value)
  result.cities.sort((a, b) => b.value - a.value)
  result.ageGender.sort((a, b) => b.value - a.value)

  return result
}
