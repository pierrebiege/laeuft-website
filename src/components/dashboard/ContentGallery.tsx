'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Bookmark, Share2, Eye, Play } from 'lucide-react'
import type { InstagramPost, ContentFilter } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'

interface ContentGalleryProps {
  posts: InstagramPost[]
}

const filters: { key: ContentFilter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'REEL', label: 'Reels' },
  { key: 'IMAGE', label: 'Bilder' },
  { key: 'CAROUSEL_ALBUM', label: 'Carousels' },
]

const typeBadge: Record<string, string> = {
  REEL: 'bg-purple-500/20 text-purple-300',
  IMAGE: 'bg-blue-500/20 text-blue-300',
  CAROUSEL_ALBUM: 'bg-amber-500/20 text-amber-300',
  VIDEO: 'bg-red-500/20 text-red-300',
}

function typeLabel(type: string) {
  switch (type) {
    case 'CAROUSEL_ALBUM': return 'Carousel'
    case 'REEL': return 'Reel'
    default: return type
  }
}

export default function ContentGallery({ posts }: ContentGalleryProps) {
  const [filter, setFilter] = useState<ContentFilter>('all')
  const [expanded, setExpanded] = useState(false)

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.media_type === filter)
  const visible = expanded ? filtered : filtered.slice(0, 12)

  // Content mix stats
  const reels = posts.filter(p => p.media_type === 'REEL').length
  const images = posts.filter(p => p.media_type === 'IMAGE').length
  const carousels = posts.filter(p => p.media_type === 'CAROUSEL_ALBUM').length
  const total = posts.length

  return (
    <section>
      <SectionHeading title="Content" subtitle={`${total} Posts · ${reels} Reels · ${images} Bilder · ${carousels} Carousels`} />

      {/* Content Mix Bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4">
        {reels > 0 && <div className="bg-purple-500" style={{ width: `${(reels / total) * 100}%` }} title={`Reels: ${reels}`} />}
        {images > 0 && <div className="bg-blue-500" style={{ width: `${(images / total) * 100}%` }} title={`Bilder: ${images}`} />}
        {carousels > 0 && <div className="bg-amber-500" style={{ width: `${(carousels / total) * 100}%` }} title={`Carousels: ${carousels}`} />}
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === f.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((post) => (
          <a
            key={post.id}
            href={post.permalink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-all"
          >
            <div className="aspect-square bg-zinc-800 relative overflow-hidden">
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <Eye size={28} />
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs">
                <span className="flex items-center gap-1"><Heart size={12} /> {post.like_count.toLocaleString('de-CH')}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments_count}</span>
              </div>
              {/* Type badge */}
              <span className={`absolute top-1.5 right-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBadge[post.media_type] || 'bg-zinc-700 text-zinc-300'}`}>
                {typeLabel(post.media_type)}
              </span>
              {/* Play icon for video */}
              {(post.media_type === 'REEL' || post.media_type === 'VIDEO') && (
                <div className="absolute bottom-1.5 left-1.5 text-white/70">
                  <Play size={14} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                {post.caption?.slice(0, 80) || 'Kein Text'}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                <span className="flex items-center gap-0.5"><Eye size={9} /> {post.reach.toLocaleString('de-CH')}</span>
                <span className="flex items-center gap-0.5"><Bookmark size={9} /> {post.saves_count}</span>
                <span className="flex items-center gap-0.5"><Share2 size={9} /> {post.shares_count}</span>
              </div>
              <p className="text-[9px] text-zinc-700 mt-1">
                {new Date(post.timestamp).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Show more */}
      {filtered.length > 12 && !expanded && (
        <div className="text-center mt-4">
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Alle {filtered.length} Posts anzeigen
          </button>
        </div>
      )}
    </section>
  )
}
