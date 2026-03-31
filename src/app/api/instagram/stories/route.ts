import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fetchActiveStories, fetchMediaInsights } from '@/lib/instagram'

// GET: Fetch active stories + auto-archive + return all archived
// PUBLIC - no auth needed (for /insights page)
export async function GET() {
  try {
    // 1. Fetch active stories from Instagram
    const activeStories = await fetchActiveStories()

    // 2. Auto-archive active stories + re-upload expired images
    let newlyArchived = 0
    let reUploaded = 0

    async function uploadToStorage(url: string, storyId: string, mediaType: string): Promise<string | null> {
      try {
        const imgRes = await fetch(url)
        if (!imgRes.ok) return null
        const blob = await imgRes.blob()
        const ext = mediaType === 'VIDEO' ? 'mp4' : 'jpg'
        const path = `stories/${storyId}.${ext}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('instagram')
          .upload(path, blob, { upsert: true, contentType: blob.type })
        if (uploadError) {
          console.error('Storage upload error:', uploadError.message)
          return null
        }
        if (uploadData?.path) {
          const { data: urlData } = supabaseAdmin.storage.from('instagram').getPublicUrl(path)
          return urlData.publicUrl
        }
        return null
      } catch (e) {
        console.error('Upload failed:', e)
        return null
      }
    }

    for (const story of activeStories) {
      const { data: existing } = await supabaseAdmin
        .from('instagram_story_archive')
        .select('id, media_url')
        .eq('story_id', story.id)
        .single()

      if (existing) {
        // Already archived -- but check if image needs re-upload (CDN URL expired)
        const url = existing.media_url || ''
        const isExpired = url.includes('scontent') || url.includes('video.cdninstagram') || !url.includes('supabase')
        if (isExpired && story.media_url) {
          const permanentUrl = await uploadToStorage(story.media_url, story.id, story.media_type)
          if (permanentUrl) {
            await supabaseAdmin
              .from('instagram_story_archive')
              .update({ media_url: permanentUrl })
              .eq('id', existing.id)
            reUploaded++
          }
        }
        continue
      }

      // New story -- archive it
      const insights = await fetchMediaInsights(story.id, 'VIDEO')
      const permanentUrl = await uploadToStorage(story.media_url, story.id, story.media_type) || story.media_url

      const { error } = await supabaseAdmin
        .from('instagram_story_archive')
        .insert({
          story_id: story.id,
          media_type: story.media_type,
          media_url: permanentUrl,
          thumbnail_url: story.thumbnail_url || null,
          timestamp: story.timestamp,
          permalink: story.permalink || null,
          reach: insights.reach || 0,
          impressions: insights.impressions || insights.views || 0,
          replies: insights.replies || 0,
          exits: insights.exits || 0,
        })

      if (!error) newlyArchived++
    }

    // 3. Fetch all archived stories from DB
    const { data: archivedStories } = await supabaseAdmin
      .from('instagram_story_archive')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    return NextResponse.json({
      stories: activeStories,
      archivedStories: archivedStories || [],
      newlyArchived,
      reUploaded,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (error) {
    console.error('Fetch stories error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Stories', stories: [], archivedStories: [] },
      { status: 500 }
    )
  }
}

// POST: Manual archive trigger (admin only)
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const stories = await fetchActiveStories()
    let archived = 0

    for (const story of stories) {
      const { data: existing } = await supabaseAdmin
        .from('instagram_story_archive')
        .select('id')
        .eq('story_id', story.id)
        .single()

      if (existing) continue

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

    const { data: archivedStories } = await supabaseAdmin
      .from('instagram_story_archive')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    return NextResponse.json({
      message: `${archived} Stories archiviert`,
      archived,
      archivedStories: archivedStories || [],
    })
  } catch (error) {
    console.error('Story archive error:', error)
    return NextResponse.json({ error: 'Fehler beim Archivieren' }, { status: 500 })
  }
}
