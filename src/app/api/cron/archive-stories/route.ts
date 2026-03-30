import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fetchActiveStories, fetchMediaInsights } from '@/lib/instagram'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stories = await fetchActiveStories()

    if (stories.length === 0) {
      return NextResponse.json({ message: 'Keine aktiven Stories', archived: 0 })
    }

    let archived = 0

    for (const story of stories) {
      // Check if already archived
      const { data: existing } = await supabaseAdmin
        .from('instagram_story_archive')
        .select('id')
        .eq('story_id', story.id)
        .single()

      if (existing) continue // already saved

      // Fetch story insights
      const insights = await fetchMediaInsights(story.id, 'VIDEO')

      // Archive the story
      const { error } = await supabaseAdmin
        .from('instagram_story_archive')
        .insert({
          story_id: story.id,
          media_type: story.media_type,
          media_url: story.media_url,
          thumbnail_url: story.thumbnail_url || null,
          timestamp: story.timestamp,
          permalink: story.permalink || null,
          reach: insights.reach || 0,
          impressions: insights.impressions || insights.views || 0,
          replies: insights.replies || 0,
          exits: insights.exits || 0,
        })

      if (!error) archived++
    }

    return NextResponse.json({
      message: `${archived} Stories archiviert`,
      archived,
      total_active: stories.length,
    })
  } catch (error) {
    console.error('Story archive error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Archivieren' },
      { status: 500 }
    )
  }
}
