import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fetchActiveStories, fetchMediaInsights } from '@/lib/instagram'

// GET: Fetch current active stories from Instagram API
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const stories = await fetchActiveStories()
    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Fetch stories error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Stories' },
      { status: 500 }
    )
  }
}

// POST: Archive active stories to Supabase
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

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

      if (existing) continue

      // Fetch story insights
      const insights = await fetchMediaInsights(story.id, 'VIDEO')

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

    // Also fetch archived stories from DB
    const { data: archivedStories } = await supabaseAdmin
      .from('instagram_story_archive')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    return NextResponse.json({
      message: `${archived} Stories archiviert`,
      archived,
      total_active: stories.length,
      archivedStories: archivedStories || [],
    })
  } catch (error) {
    console.error('Story archive error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Archivieren' },
      { status: 500 }
    )
  }
}
