'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  ArrowRight,
  Heart,
  MessageCircle,
  Play,
  Eye,
  Bookmark,
  Share2,
  Instagram,
} from 'lucide-react'

// --- Types ---

interface MediaItem {
  id: string
  media_type: string
  media_url: string | null
  thumbnail_url: string | null
  permalink: string
  caption: string | null
  timestamp: string
  like_count: number
  comments_count: number
  reach: number
  impressions: number
  saved: number
  shares: number
  plays: number
}

interface AudienceData {
  countries: Array<{ key: string; value: number }>
  cities: Array<{ key: string; value: number }>
  ageGender: Array<{ key: string; value: number }>
}

interface InsightsResponse {
  profile: {
    name: string
    biography: string
    followers_count: number
    follows_count: number
    media_count: number
    profile_picture_url: string
  }
  media: MediaItem[]
  topPosts: MediaItem[]
  audience: AudienceData
  metrics: {
    totalReach: number
    totalImpressions: number
    totalLikes: number
    totalComments: number
    totalSaved: number
    totalShares: number
    totalPlays: number
    totalInteractions: number
    engagementRate: number
  }
  contentMix: {
    reels: number
    images: number
    carousels: number
    total: number
  }
  fetchedAt: string
}

// --- Helpers ---

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString('de-CH')
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isVideo(type: string): boolean {
  return type === 'VIDEO' || type === 'REEL'
}

function getThumb(item: MediaItem): string | null {
  if (isVideo(item.media_type)) {
    return item.thumbnail_url || item.media_url
  }
  return item.media_url
}

// --- Country helpers ---

const COUNTRY_FLAGS: Record<string, string> = {
  CH: '\u{1F1E8}\u{1F1ED}', DE: '\u{1F1E9}\u{1F1EA}', AT: '\u{1F1E6}\u{1F1F9}',
  LU: '\u{1F1F1}\u{1F1FA}', FR: '\u{1F1EB}\u{1F1F7}', IT: '\u{1F1EE}\u{1F1F9}',
  US: '\u{1F1FA}\u{1F1F8}', GB: '\u{1F1EC}\u{1F1E7}', NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}', ES: '\u{1F1EA}\u{1F1F8}', PT: '\u{1F1F5}\u{1F1F9}',
}

const COUNTRY_NAMES: Record<string, string> = {
  CH: 'Schweiz', DE: 'Deutschland', AT: '\u00D6sterreich', LU: 'Luxemburg',
  FR: 'Frankreich', IT: 'Italien', US: 'USA', GB: 'Grossbritannien',
  NL: 'Niederlande', BE: 'Belgien', ES: 'Spanien', PT: 'Portugal',
}

function countryLabel(code: string): string {
  const flag = COUNTRY_FLAGS[code] || ''
  const name = COUNTRY_NAMES[code] || code
  return `${flag} ${name}`
}

// --- Audience parsing ---

function parseAgeGroups(items: Array<{ key: string; value: number }>) {
  const ageMap: Record<string, number> = {}
  let total = 0
  for (const item of items) {
    const parts = item.key.split('.')
    const ageRange = parts.length > 1 ? parts[1] : parts[0]
    ageMap[ageRange] = (ageMap[ageRange] || 0) + item.value
    total += item.value
  }
  if (total === 0) return []
  return Object.entries(ageMap)
    .map(([key, val]) => ({ key, pct: (val / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)
}

function parseGenderSplit(items: Array<{ key: string; value: number }>) {
  let male = 0
  let female = 0
  for (const item of items) {
    if (item.key.startsWith('M')) male += item.value
    else if (item.key.startsWith('F')) female += item.value
  }
  const total = male + female || 1
  return { male: (male / total) * 100, female: (female / total) * 100 }
}

// --- Skeleton Components ---

function SkeletonKPI() {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-16 bg-zinc-800 rounded mb-3" />
      <div className="h-8 w-24 bg-zinc-800 rounded" />
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square bg-zinc-900/60 border border-zinc-800/50 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

// --- Main Component ---

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/insights')
        if (!res.ok) throw new Error('Daten konnten nicht geladen werden')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-10">
          {/* Header skeleton */}
          <div className="animate-pulse space-y-3">
            <div className="h-10 w-56 bg-zinc-800 rounded" />
            <div className="h-4 w-72 bg-zinc-800/60 rounded" />
            <div className="h-3 w-48 bg-zinc-800/40 rounded" />
          </div>
          {/* KPI skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)}
          </div>
          {/* Grid skeleton */}
          <SkeletonGrid />
        </main>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-black text-zinc-500 mb-2">Fehler</p>
          <p className="text-zinc-600 text-sm">{error || 'Keine Daten verfuegbar'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const { profile, media, topPosts, audience, metrics, contentMix } = data

  const totalCountry = audience.countries.reduce((s, c) => s + c.value, 0) || 1
  const countries = audience.countries.slice(0, 6).map((c) => ({
    ...c,
    pct: (c.value / totalCountry) * 100,
  }))
  const ageGroups = parseAgeGroups(audience.ageGender)
  const genderSplit = parseGenderSplit(audience.ageGender)

  const reelsPct = contentMix.total > 0 ? (contentMix.reels / contentMix.total) * 100 : 0
  const imagePct = contentMix.total > 0 ? (contentMix.images / contentMix.total) * 100 : 0
  const carouselPct = contentMix.total > 0 ? (contentMix.carousels / contentMix.total) * 100 : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12">

        {/* ===== HEADER ===== */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Pierre Biege
              </h1>
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <p className="text-zinc-400 text-sm">
              Ultrarunner &middot; Content Creator &middot; Wallis
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <a
                href="https://instagram.com/pierrebiege"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <Instagram size={14} />
                @pierrebiege
              </a>
              <span className="text-xs text-zinc-500">{fmt(profile.followers_count)} Followers</span>
              <span className="text-xs text-zinc-500">{fmt(profile.media_count)} Beitr&auml;ge</span>
            </div>
          </div>
        </header>

        {/* ===== KPI ROW ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Follower" value={fmt(profile.followers_count)} />
          <KPICard label="Reichweite" value={fmt(metrics.totalReach)} sub={`${media.length} Beitr\u00e4ge`} />
          <KPICard label="Aufrufe" value={fmt(metrics.totalImpressions)} sub={metrics.totalPlays > 0 ? `${fmt(metrics.totalPlays)} Plays` : undefined} />
          <KPICard label="Engagement" value={`${metrics.engagementRate}%`} sub={`${fmt(metrics.totalInteractions)} Interaktionen`} />
        </div>

        {/* ===== CONTENT GALLERY ===== */}
        <section>
          <SectionTitle>Letzte Beitr&auml;ge</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {media.map((item) => (
              <PostTile key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* ===== TOP PERFORMING ===== */}
        {topPosts.length > 0 && (
          <section>
            <SectionTitle>Top Beitr&auml;ge nach Aufrufe</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topPosts.map((post) => (
                <TopPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* ===== AUDIENCE ===== */}
        {(countries.length > 0 || ageGroups.length > 0) && (
          <section>
            <SectionTitle>Zielgruppe</SectionTitle>
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Countries */}
              {countries.length > 0 && (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">L&auml;nder</p>
                  <div className="space-y-2.5">
                    {countries.map((c) => (
                      <div key={c.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-zinc-300">{countryLabel(c.key)}</span>
                          <span className="text-xs font-medium text-zinc-400">{c.pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                            style={{ width: `${Math.max(c.pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Groups */}
              {ageGroups.length > 0 && (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Alter</p>
                  <div className="space-y-2.5">
                    {ageGroups.slice(0, 6).map((a) => (
                      <div key={a.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-zinc-300">{a.key}</span>
                          <span className="text-xs font-medium text-zinc-400">{a.pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${Math.max(a.pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender */}
              {(genderSplit.male > 0 || genderSplit.female > 0) && (
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Geschlecht</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-zinc-300">M&auml;nnlich</span>
                        <span className="text-xs font-semibold text-zinc-300">{genderSplit.male.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${genderSplit.male}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-zinc-300">Weiblich</span>
                        <span className="text-xs font-semibold text-zinc-300">{genderSplit.female.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${genderSplit.female}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== CONTENT MIX ===== */}
        <section>
          <SectionTitle>Content-Verteilung</SectionTitle>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 sm:p-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <ContentMixBar label="Reels / Videos" count={contentMix.reels} pct={reelsPct} color="from-fuchsia-500 to-purple-600" />
              <ContentMixBar label="Bilder" count={contentMix.images} pct={imagePct} color="from-blue-500 to-cyan-500" />
              <ContentMixBar label="Karussells" count={contentMix.carousels} pct={carouselPct} color="from-amber-500 to-orange-500" />
            </div>

            {/* Interaction breakdown */}
            <div className="mt-6 pt-5 border-t border-zinc-800/60">
              <p className="text-xs text-zinc-500 mb-3">Interaktionen gesamt ({fmt(metrics.totalInteractions)})</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InteractionStat icon={<Heart size={14} />} label="Likes" value={metrics.totalLikes} />
                <InteractionStat icon={<MessageCircle size={14} />} label="Kommentare" value={metrics.totalComments} />
                <InteractionStat icon={<Bookmark size={14} />} label="Gespeichert" value={metrics.totalSaved} />
                <InteractionStat icon={<Share2 size={14} />} label="Geteilt" value={metrics.totalShares} />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="text-center py-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Interesse an einer Zusammenarbeit?
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Lass uns gemeinsam etwas bewegen.
          </p>
          <a
            href="mailto:pierre@laeuft.ch"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            <Mail size={16} />
            Kontakt aufnehmen
            <ArrowRight size={14} />
          </a>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="text-center pb-8 pt-4 border-t border-zinc-800/40">
          <p className="text-[11px] text-zinc-600">
            Daten werden live von Instagram geladen &middot; Letzte Aktualisierung: {fmtTime(data.fetchedAt)}
          </p>
          <p className="text-[10px] text-zinc-700 mt-1">
            Powered by <span className="text-zinc-500">l&auml;uft.</span>
          </p>
        </footer>
      </main>
    </div>
  )
}

// --- Sub-components ---

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-white mb-4 tracking-wide">
      {children}
    </h2>
  )
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-2xl font-black text-white mt-1.5">{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function PostTile({ item }: { item: MediaItem }) {
  const thumb = getThumb(item)
  const video = isVideo(item.media_type)

  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/40"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={item.caption?.slice(0, 80) || 'Instagram Post'}
          className="w-full h-full object-cover"
          loading="lazy"
          crossOrigin="anonymous"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
          {video ? (
            <Play size={32} className="text-zinc-600" />
          ) : (
            <Instagram size={24} className="text-zinc-700" />
          )}
        </div>
      )}

      {/* Video play indicator */}
      {video && thumb && (
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <Play size={10} className="text-white fill-white" />
          {item.plays > 0 && (
            <span className="text-[10px] text-white font-medium">{fmt(item.plays)}</span>
          )}
        </div>
      )}

      {/* Carousel indicator */}
      {item.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-2 right-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white drop-shadow-lg">
            <rect x="1" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="5" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-4 text-white">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Heart size={16} className="fill-white" />
            {fmt(item.like_count)}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <MessageCircle size={16} className="fill-white" />
            {fmt(item.comments_count)}
          </span>
          {item.plays > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Eye size={16} />
              {fmt(item.plays)}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function TopPostCard({ post }: { post: MediaItem }) {
  const thumb = getThumb(post)
  const video = isVideo(post.media_type)
  const viewCount = post.impressions || post.plays || 0

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-3 hover:border-zinc-700 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {video ? <Play size={24} className="text-zinc-600" /> : <Instagram size={20} className="text-zinc-700" />}
          </div>
        )}
        {video && (
          <div className="absolute bottom-1 left-1 bg-black/60 rounded p-0.5">
            <Play size={10} className="text-white fill-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {post.caption ? post.caption.slice(0, 100) + (post.caption.length > 100 ? '...' : '') : 'Beitrag'}
        </p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <Eye size={13} className="text-zinc-500" />
          <span className="text-lg font-black text-white">{fmt(viewCount)}</span>
          <span className="text-[10px] text-zinc-600">Aufrufe</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Heart size={11} /> {fmt(post.like_count)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark size={11} /> {fmt(post.saved)}
          </span>
          <span>{fmtDate(post.timestamp)}</span>
        </div>
      </div>
    </a>
  )
}

function ContentMixBar({
  label,
  count,
  pct,
  color,
}: {
  label: string
  count: number
  pct: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm font-semibold text-white">{count}</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">{pct.toFixed(1)}%</p>
    </div>
  )
}

function InteractionStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white">{fmt(value)}</p>
        <p className="text-[10px] text-zinc-500">{label}</p>
      </div>
    </div>
  )
}
