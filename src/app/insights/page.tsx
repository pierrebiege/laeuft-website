'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import manualStories from '@/data/manual-stories.json'
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ExternalLink,
  X,
  Play,
  Camera,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Lock,
} from 'lucide-react'

// Country code to flag emoji + name
const COUNTRY_FLAGS: Record<string, { flag: string; name: string }> = {
  CH: { flag: '\u{1F1E8}\u{1F1ED}', name: 'Schweiz' },
  DE: { flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutschland' },
  AT: { flag: '\u{1F1E6}\u{1F1F9}', name: '\u00D6sterreich' },
  US: { flag: '\u{1F1FA}\u{1F1F8}', name: 'USA' },
  GB: { flag: '\u{1F1EC}\u{1F1E7}', name: 'Grossbritannien' },
  FR: { flag: '\u{1F1EB}\u{1F1F7}', name: 'Frankreich' },
  IT: { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italien' },
  ES: { flag: '\u{1F1EA}\u{1F1F8}', name: 'Spanien' },
  NL: { flag: '\u{1F1F3}\u{1F1F1}', name: 'Niederlande' },
  BR: { flag: '\u{1F1E7}\u{1F1F7}', name: 'Brasilien' },
  CA: { flag: '\u{1F1E8}\u{1F1E6}', name: 'Kanada' },
  SE: { flag: '\u{1F1F8}\u{1F1EA}', name: 'Schweden' },
  NO: { flag: '\u{1F1F3}\u{1F1F4}', name: 'Norwegen' },
  BE: { flag: '\u{1F1E7}\u{1F1EA}', name: 'Belgien' },
  PT: { flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugal' },
  PL: { flag: '\u{1F1F5}\u{1F1F1}', name: 'Polen' },
  AU: { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australien' },
  MX: { flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexiko' },
  IN: { flag: '\u{1F1EE}\u{1F1F3}', name: 'Indien' },
  JP: { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan' },
  KR: { flag: '\u{1F1F0}\u{1F1F7}', name: 'S\u00FCdkorea' },
  TR: { flag: '\u{1F1F9}\u{1F1F7}', name: 'T\u00FCrkei' },
  DK: { flag: '\u{1F1E9}\u{1F1F0}', name: 'D\u00E4nemark' },
  FI: { flag: '\u{1F1EB}\u{1F1EE}', name: 'Finnland' },
  LI: { flag: '\u{1F1F1}\u{1F1EE}', name: 'Liechtenstein' },
  LU: { flag: '\u{1F1F1}\u{1F1FA}', name: 'Luxemburg' },
  CZ: { flag: '\u{1F1E8}\u{1F1FF}', name: 'Tschechien' },
  RO: { flag: '\u{1F1F7}\u{1F1F4}', name: 'Rum\u00E4nien' },
  HU: { flag: '\u{1F1ED}\u{1F1FA}', name: 'Ungarn' },
  GR: { flag: '\u{1F1EC}\u{1F1F7}', name: 'Griechenland' },
}

function getCountryDisplay(code: string) {
  const entry = COUNTRY_FLAGS[code]
  if (entry) return { flag: entry.flag, name: entry.name }
  const flag = code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
  return { flag, name: code }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' Mio'
  if (n >= 10_000) return Math.round(n).toLocaleString('de-CH')
  if (n >= 1_000) return n.toLocaleString('de-CH')
  return n.toString()
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function mediaTypeLabel(type: string): string {
  switch (type) {
    case 'VIDEO':
    case 'REEL':
      return 'Reel'
    case 'IMAGE':
      return 'Bild'
    case 'CAROUSEL_ALBUM':
      return 'Karussell'
    default:
      return type
  }
}

function mediaTypeIcon(type: string) {
  switch (type) {
    case 'VIDEO':
    case 'REEL':
      return <Play size={12} />
    case 'CAROUSEL_ALBUM':
      return <Camera size={12} />
    default:
      return null
  }
}

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

interface InsightsData {
  profile: {
    name: string
    biography: string
    followers_count: number
    follows_count: number
    media_count: number
    profile_picture_url: string
  }
  media: MediaItem[]
  audience: {
    countries: Array<{ key: string; value: number }>
    cities: Array<{ key: string; value: number }>
    ageGender: Array<{ key: string; value: number }>
  }
  accountInsights: {
    impressions: number
    reach: number
    accountsEngaged: number
    followsAndUnfollows: number
  }
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
  period: number
  fetchedAt: string
}

interface StoryItem {
  id: string
  media_type: string
  media_url: string
  thumbnail_url?: string
  timestamp: string
  permalink?: string
}

type ManualStory = {
  id: string
  image: string
  date: string
  views: number
  order: number
}

const INSIGHTS_PASSWORD = process.env.NEXT_PUBLIC_INSIGHTS_PASSWORD || 'laeuft2026'

const PINK = '#E1306C'

export default function PublicInsightsPage() {
  // Password gate
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  // Data
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<MediaItem | null>(null)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  // Stories (active only, no archiving)
  const [activeStories, setActiveStories] = useState<StoryItem[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)

  // Carousel scroll
  const carouselRef = useRef<HTMLDivElement>(null)

  // Compute total story views
  const totalStoryViews = useMemo(() => {
    return (manualStories as ManualStory[]).reduce((sum, s) => sum + s.views, 0)
  }, [])

  // Compute date range string
  const dateRangeString = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - period)
    const fmt = (d: Date) =>
      d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    return `${fmt(start)} - ${fmt(end)}`
  }, [period])

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('insights_unlocked')
      if (stored === 'true') {
        setUnlocked(true)
      }
    }
  }, [])

  useEffect(() => {
    if (unlocked) {
      fetchData()
      fetchStories()
    }
  }, [unlocked, period])

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === INSIGHTS_PASSWORD) {
      sessionStorage.setItem('insights_unlocked', 'true')
      setUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/insights?days=${period}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function fetchStories() {
    setStoriesLoading(true)
    try {
      const res = await fetch('/api/instagram/stories')
      if (res.ok) {
        const json = await res.json()
        setActiveStories(json.stories || [])
      }
    } catch {
      // silent
    } finally {
      setStoriesLoading(false)
    }
  }

  function scrollCarousel(direction: 'left' | 'right') {
    if (!carouselRef.current) return
    const amount = 300
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  // PASSWORD GATE
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              L&auml;uft.
            </h1>
            <p className="text-zinc-400 text-sm">Instagram Insights</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value)
                    setPasswordError(false)
                  }}
                  placeholder="Passwort"
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700 transition-colors"
                />
              </div>
              {passwordError && (
                <p className="text-red-400 text-xs mt-2">Falsches Passwort</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-white text-zinc-900 font-semibold text-sm py-3 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Zugang
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin text-zinc-400" />
          <p className="text-zinc-500">Instagram Insights laden...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-6 max-w-md w-full">
          <p className="text-red-400">{error || 'Keine Daten'}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-sm text-red-400 underline"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const last20Media = data.media.slice(0, 20)
  const countriesTotal = data.audience.countries.reduce((s, c) => s + c.value, 0)
  const topCountries = data.audience.countries.slice(0, 8)
  const topCities = data.audience.cities.slice(0, 8)
  const maxCityValue = topCities[0]?.value || 1
  const maxCountryValue = topCountries[0]?.value || 1

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ============================================ */}
      {/* 1. HERO SECTION - Full bleed background */}
      {/* ============================================ */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="/insights/hero-trail.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 py-20">
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.85]">
            INSIGHTS
          </h1>
          <h2 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.85] mt-1">
            PIERRE BIEGE
          </h2>

          {/* Tagline */}
          <p className="mt-6 text-sm sm:text-base tracking-[0.25em] uppercase text-zinc-300/80 font-light">
            Ultrarunner &middot; Content Creator &middot; Wallis
          </p>

          {/* Handle + LIVE badge */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <span className="text-sm font-medium text-white/90 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              @pierrebiege
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-800/40 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Small circular images row */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20">
              <img src="/insights/hero-track.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20">
              <img src="/insights/hero-hat.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20">
              <img src="/insights/hero-dryll.jpg" alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. INSTAGRAM OVERVIEW - 4 KPI CARDS */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Instagram Overview
            </h2>
            <span className="text-[11px] text-zinc-600 mt-1 block">{dateRangeString}</span>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  period === p
                    ? 'bg-white text-zinc-900'
                    : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/80 hover:text-zinc-200'
                }`}
              >
                {p} Tage
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-100 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Total Followers
            </p>
            <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              {formatNumber(data.profile.followers_count)}
            </p>
          </div>
          <div className="bg-zinc-100 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Views
            </p>
            <p className="text-[10px] text-zinc-400 mb-2">Last {period} Days</p>
            <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              {formatNumber(data.accountInsights.impressions || data.metrics.totalImpressions)}
            </p>
          </div>
          <div className="bg-zinc-100 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Total Story Views
            </p>
            <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              {formatNumber(totalStoryViews)}
            </p>
          </div>
          <div className="bg-zinc-100 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Interactions
            </p>
            <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
              {formatNumber(data.accountInsights.accountsEngaged || data.metrics.totalInteractions)}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. POST CAROUSEL */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Letzte 20 Beitr&auml;ge
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollCarousel('left')}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {last20Media.map((post) => (
            <button
              key={post.id}
              onClick={() => {
                setSelectedPost(post)
                setCaptionExpanded(false)
              }}
              className="flex-shrink-0 w-[180px] group text-left"
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-800">
                {(post.thumbnail_url || post.media_url) ? (
                  <img
                    src={post.thumbnail_url || post.media_url || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Camera size={32} />
                  </div>
                )}
                {(post.media_type === 'VIDEO' || post.media_type === 'REEL') && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                    <Play size={12} />
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {formatNumber(post.impressions || post.plays || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={11} />
                    {formatNumber(post.like_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={11} />
                    {post.comments_count}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">{formatDate(post.timestamp)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* 4. AUDIENCE SECTION */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-8">
          Zielgruppe
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top-Standorte (Laender) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
              <Globe size={14} />
              Top-Standorte (L&auml;nder)
            </h3>
            <div className="space-y-3">
              {topCountries.map((c) => {
                const display = getCountryDisplay(c.key)
                const pct = countriesTotal > 0 ? (c.value / countriesTotal) * 100 : 0
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-200 flex items-center gap-2">
                        <span>{display.flag}</span>
                        {display.name}
                      </span>
                      <span className="text-xs text-zinc-500">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PINK }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top-Standorte (Staedte) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
              <MapPin size={14} />
              Top-Standorte (St&auml;dte)
            </h3>
            <div className="space-y-3">
              {topCities.map((c) => {
                const pct = maxCityValue > 0 ? (c.value / maxCityValue) * 100 : 0
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-200">{c.key}</span>
                      <span className="text-xs text-zinc-500">{formatNumber(c.value)}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PINK }}
                      />
                    </div>
                  </div>
                )
              })}
              {topCities.length === 0 && (
                <p className="text-xs text-zinc-500">Keine St&auml;dte-Daten</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. STORIES SECTION */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-8">
          Storys (Last 14 Days)
        </h2>
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(manualStories as ManualStory[]).map((story) => (
            <div key={story.id} className="flex-shrink-0 w-[140px] sm:w-[160px]">
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-800">
                <img
                  src={story.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Eye size={12} className="text-white/80" />
                    <p className="text-xs text-white font-semibold">
                      {formatNumber(story.views)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 text-center">{story.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. CTA SECTION */}
      {/* ============================================ */}
      <section className="relative w-full mt-12">
        <div className="relative h-[500px] md:h-[600px] overflow-hidden">
          <img
            src="/insights/hero-trail.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight">
              Lass uns gemeinsam etwas bewegen.
            </h2>
            <a
              href="mailto:pierre@laeuft.ch"
              className="mt-8 inline-block text-sm font-semibold px-8 py-3.5 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: PINK, color: 'white' }}
            >
              Kontakt aufnehmen
            </a>
            <a
              href="mailto:pierre@laeuft.ch"
              className="mt-4 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              pierre@laeuft.ch
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. FOOTER */}
      {/* ============================================ */}
      <footer className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Daten von Instagram
        </div>
        <p className="text-xs text-zinc-600">
          Powered by l&auml;uft.
        </p>
      </footer>

      {/* ============================================ */}
      {/* POST DETAIL MODAL */}
      {/* ============================================ */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="aspect-[4/5] bg-zinc-800 rounded-t-2xl overflow-hidden">
              {(selectedPost.thumbnail_url || selectedPost.media_url) ? (
                <img
                  src={selectedPost.thumbnail_url || selectedPost.media_url || ''}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <Camera size={48} />
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {mediaTypeIcon(selectedPost.media_type)}
                    {mediaTypeLabel(selectedPost.media_type)}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(selectedPost.timestamp)}</span>
                </div>
                <a
                  href={selectedPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  <ExternalLink size={12} />
                  Instagram
                </a>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MetricCell icon={<Eye size={14} />} label="Aufrufe" value={selectedPost.impressions || selectedPost.plays || 0} />
                <MetricCell icon={<Users size={14} />} label="Reichweite" value={selectedPost.reach} />
                <MetricCell icon={<Heart size={14} />} label="Likes" value={selectedPost.like_count} />
                <MetricCell icon={<MessageCircle size={14} />} label="Kommentare" value={selectedPost.comments_count} />
                <MetricCell icon={<Bookmark size={14} />} label="Gespeichert" value={selectedPost.saved} />
                <MetricCell icon={<Share2 size={14} />} label="Geteilt" value={selectedPost.shares} />
              </div>

              {selectedPost.caption && (
                <div>
                  <p
                    className={`text-xs text-zinc-400 whitespace-pre-wrap ${
                      !captionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {selectedPost.caption}
                  </p>
                  {selectedPost.caption.length > 150 && (
                    <button
                      onClick={() => setCaptionExpanded(!captionExpanded)}
                      className="text-xs text-zinc-500 hover:text-white mt-1 transition-colors"
                    >
                      {captionExpanded ? 'Weniger' : 'Mehr anzeigen'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Metric cell for the modal
function MetricCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center text-zinc-400 mb-1">{icon}</div>
      <p className="text-sm font-semibold text-white">{formatNumber(value)}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}
