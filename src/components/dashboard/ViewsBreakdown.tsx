'use client'

import type { DashboardData } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'

interface ViewsBreakdownProps {
  summary: DashboardData['summary']
  posts: DashboardData['posts']
}

export default function ViewsBreakdown({ summary, posts }: ViewsBreakdownProps) {
  // Content type breakdown from posts
  const reels = posts.filter(p => p.media_type === 'REEL')
  const images = posts.filter(p => p.media_type === 'IMAGE')
  const carousels = posts.filter(p => p.media_type === 'CAROUSEL_ALBUM')
  const total = posts.length || 1

  const reelsPct = ((reels.length / total) * 100).toFixed(1)
  const imagesPct = ((images.length / total) * 100).toFixed(1)
  const carouselsPct = ((carousels.length / total) * 100).toFixed(1)

  return (
    <section>
      <SectionHeading title="Aufrufe" subtitle="Wer schaut den Content" />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Views Total + Follower Split */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5">
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {summary.total_views.toLocaleString('de-CH')}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 mb-5">Aufrufe</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Follower</span>
              <span className="text-sm font-semibold text-white">{summary.views_follower_pct}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500" style={{ width: `${summary.views_follower_pct}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Nicht-Follower</span>
              <span className="text-sm font-semibold text-white">{summary.views_non_follower_pct}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${summary.views_non_follower_pct}%` }} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">Erreichte Konten</p>
            <p className="text-xl font-bold text-white">{summary.reached_accounts.toLocaleString('de-CH')}</p>
          </div>
        </div>

        {/* Content Type Breakdown */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Nach Content-Art</p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-300">Reels</span>
                <span className="text-sm font-semibold text-white">{reelsPct}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${reelsPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-300">Bilder</span>
                <span className="text-sm font-semibold text-white">{imagesPct}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${imagesPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-300">Carousels</span>
                <span className="text-sm font-semibold text-white">{carouselsPct}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${carouselsPct}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-fuchsia-500" /> Follower</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600" /> Nicht-Follower</span>
          </div>
        </div>
      </div>
    </section>
  )
}
