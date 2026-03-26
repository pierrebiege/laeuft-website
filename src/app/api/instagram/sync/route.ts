import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  fetchAccountProfile,
  fetchAccountInsights,
  fetchRecentMedia,
  fetchMediaInsights,
  fetchAudienceDemographics,
} from '@/lib/instagram'

export async function POST(request: NextRequest) {
  // Auth: either CRON_SECRET header or admin session
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check for admin session as fallback (manual trigger)
    const sessionCookie = request.cookies.get('admin_session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const supabase = getSupabaseAdmin()
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', sessionCookie)
      .gt('expires_at', new Date().toISOString())
      .single()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const results: string[] = []

  try {
    // 1. Fetch account profile & insights
    const profile = await fetchAccountProfile()
    results.push(`Profile: ${profile.followers_count} followers`)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    let reach = 0
    let impressions = 0
    let profileViews = 0
    let websiteClicks = 0
    let accountsEngaged = 0

    try {
      const insights = await fetchAccountInsights(
        twoDaysAgo.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0]
      )
      for (const metric of insights.data || []) {
        const val = metric.values?.[metric.values.length - 1]?.value || 0
        switch (metric.name) {
          case 'reach': reach = val; break
          case 'impressions': impressions = val; break
          case 'profile_views': profileViews = val; break
          case 'website_clicks': websiteClicks = val; break
          case 'accounts_engaged': accountsEngaged = val; break
        }
      }
    } catch (e) {
      results.push(`Insights fetch failed: ${e}`)
    }

    const engagementRate = profile.followers_count > 0
      ? parseFloat((accountsEngaged / profile.followers_count * 100).toFixed(4))
      : 0

    // Upsert daily metrics
    await supabase
      .from('instagram_metrics')
      .upsert({
        date: today,
        followers_count: profile.followers_count,
        follows_count: profile.follows_count,
        media_count: profile.media_count,
        impressions,
        reach,
        profile_views: profileViews,
        website_clicks: websiteClicks,
        accounts_engaged: accountsEngaged,
        engagement_rate: engagementRate,
      }, { onConflict: 'date' })

    results.push('Metrics saved')

    // 2. Fetch and upsert recent media
    const media = await fetchRecentMedia(50)
    results.push(`Fetched ${media.length} media items`)

    for (const item of media) {
      const insights = await fetchMediaInsights(item.id)
      const totalEngagement = (item.like_count || 0) + (item.comments_count || 0) +
        (insights.saved || 0) + (insights.shares || 0)
      const postReach = insights.reach || 0
      const postEngRate = postReach > 0
        ? parseFloat((totalEngagement / postReach * 100).toFixed(4))
        : 0

      await supabase
        .from('instagram_posts')
        .upsert({
          ig_media_id: item.id,
          media_type: item.media_type,
          media_url: item.media_url,
          thumbnail_url: item.thumbnail_url || null,
          permalink: item.permalink,
          caption: item.caption || null,
          timestamp: item.timestamp,
          like_count: item.like_count || 0,
          comments_count: item.comments_count || 0,
          saves_count: insights.saved || 0,
          shares_count: insights.shares || 0,
          reach: postReach,
          impressions: insights.impressions || 0,
          plays: insights.plays || null,
          engagement_rate: postEngRate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ig_media_id' })
    }
    results.push('Posts upserted')

    // 3. Fetch and upsert audience demographics
    try {
      const audience = await fetchAudienceDemographics()

      for (const metric of audience.demographics) {
        const values = metric.values?.[0]?.value
        if (!values) continue

        let metricType = 'age_gender'
        if (metric.name.includes('country')) metricType = 'country'
        else if (metric.name.includes('city')) metricType = 'city'

        for (const [key, value] of Object.entries(values)) {
          await supabase
            .from('instagram_audience')
            .upsert({
              date: today,
              metric_type: metricType,
              dimension_key: key,
              value: value as number,
            }, { onConflict: 'date,metric_type,dimension_key' })
        }
      }

      // Online followers
      for (const metric of audience.online_followers) {
        for (const dayEntry of metric.values || []) {
          if (!dayEntry.value) continue
          for (const [hour, count] of Object.entries(dayEntry.value)) {
            await supabase
              .from('instagram_audience')
              .upsert({
                date: today,
                metric_type: 'online_followers',
                dimension_key: hour,
                value: count as number,
              }, { onConflict: 'date,metric_type,dimension_key' })
          }
        }
      }
      results.push('Audience data saved')
    } catch (e) {
      results.push(`Audience fetch failed: ${e}`)
    }

    // 4. Update config with latest profile info
    await supabase
      .from('dashboard_config')
      .update({
        profile_image_url: profile.profile_picture_url,
        account_bio: profile.biography,
        updated_at: new Date().toISOString(),
      })
      .not('id', 'is', null) // update all rows (should be 1)

    results.push('Config updated')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      results,
    }, { status: 500 })
  }
}
