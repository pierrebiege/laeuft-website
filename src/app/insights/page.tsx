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

function formatNumberBig(n: number): string {
  return n.toLocaleString('de-CH')
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
  impressionsBreakdown: {
    stories: number
    reels: number
    posts: number
    total: number
  }
  interactionsBreakdown: {
    stories: number
    reels: number
    posts: number
    total: number
  }
  onlineFollowers: Record<number, number>
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

interface ArchivedStoryItem {
  story_id: string
  media_type: string
  media_url: string
  thumbnail_url?: string
  timestamp: string
  permalink?: string
  impressions: number
  reach: number
  replies: number
  exits: number
}

type ManualStory = {
  id: string
  image: string
  date: string
  views: number
  order: number
}

type MergedStory = {
  id: string
  image: string
  date: string
  views: number
  source: 'manual' | 'api'
}

const INSIGHTS_PASSWORD = process.env.NEXT_PUBLIC_INSIGHTS_PASSWORD || 'laeuft2026'

const PINK = '#E1306C'
const PURPLE = '#5851DB'
const AMBER = '#F59E0B'

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

  // Manual insights from OCR/Telegram
  interface ManualInsightRow {
    period: number
    metric_type: string
    total_value: number
    follower_pct: number | null
    non_follower_pct: number | null
    stories_pct: number | null
    reels_pct: number | null
    posts_pct: number | null
    erreichte_konten: number | null
    updated_at: string
  }
  const [manualInsights, setManualInsights] = useState<ManualInsightRow[]>([])

  // Stories (active + archived from API)
  const [activeStories, setActiveStories] = useState<StoryItem[]>([])
  const [archivedStories, setArchivedStories] = useState<ArchivedStoryItem[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)

  // Carousel scroll refs
  const viewsCarouselRef = useRef<HTMLDivElement>(null)
  const interactionsCarouselRef = useRef<HTMLDivElement>(null)

  // Merge stories from API archived + manual JSON, dedup by date proximity
  const allStories: MergedStory[] = useMemo(() => {
    const fromApi: MergedStory[] = archivedStories.map(s => ({
      id: s.story_id,
      image: s.media_url,
      date: s.timestamp.split('T')[0],
      views: s.impressions || 0,
      source: 'api' as const,
    }))

    const fromManual: MergedStory[] = (manualStories as ManualStory[]).map(s => ({
      id: s.id,
      image: s.image,
      date: s.date,
      views: s.views,
      source: 'manual' as const,
    }))

    // Combine all
    const combined = [...fromApi, ...fromManual]

    // Deduplicate: if an API story has a date within 1 day of a manual story, keep the manual one (more reliable views data)
    const deduplicated: MergedStory[] = []
    const usedApiIds = new Set<string>()

    // First add all manual stories
    for (const ms of fromManual) {
      deduplicated.push(ms)
    }

    // Then add API stories that don't overlap with manual stories by date+proximity
    for (const apiStory of fromApi) {
      const apiDate = new Date(apiStory.date).getTime()
      const hasManualOverlap = fromManual.some(ms => {
        const manualDate = new Date(ms.date).getTime()
        return Math.abs(apiDate - manualDate) < 86400000 // within 1 day
      })
      if (!hasManualOverlap && !usedApiIds.has(apiStory.id)) {
        deduplicated.push(apiStory)
        usedApiIds.add(apiStory.id)
      }
    }

    // Sort by date descending
    deduplicated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return deduplicated
  }, [archivedStories])

  // Compute total story views
  const totalStoryViews = useMemo(() => {
    return allStories.reduce((sum, s) => sum + s.views, 0)
  }, [allStories])

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
      fetchManualInsights()
    }
  }, [unlocked, period])

  async function fetchManualInsights() {
    try {
      const res = await fetch('/api/insights/manual')
      if (res.ok) {
        const json = await res.json()
        setManualInsights(json)
      }
    } catch {
      // silent
    }
  }

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
        setArchivedStories(json.archivedStories || [])
      }
    } catch {
      // silent
    } finally {
      setStoriesLoading(false)
    }
  }

  function scrollCarousel(ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') {
    if (!ref.current) return
    const amount = 300
    ref.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  // PASSWORD GATE
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4">
        <img src="/insights/hero-selfie.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950/90" />

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-zinc-500 mb-3">Live Instagram Daten von</p>
            <h1 className="text-5xl font-black tracking-tight text-white mb-2">
              Pierre Biege
            </h1>
            <p className="text-sm text-zinc-400">Ultrarunner &middot; Content Creator &middot; Wallis</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">LIVE INSIGHTS</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            <div className="w-20 h-28 rounded-lg overflow-hidden"><img src="/insights/hero-selfie.jpg" alt="" className="w-full h-full object-cover grayscale" /></div>
            <div className="w-20 h-28 rounded-lg overflow-hidden"><img src="/insights/hero-hat.jpg" alt="" className="w-full h-full object-cover" /></div>
            <div className="w-20 h-28 rounded-lg overflow-hidden"><img src="/insights/hero-dryll.jpg" alt="" className="w-full h-full object-cover" /></div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
                placeholder="Passwort"
                autoFocus
                className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
              />
            </div>
            {passwordError && <p className="text-red-400 text-xs">Falsches Passwort</p>}
            <button type="submit" className="w-full bg-white text-zinc-900 font-semibold text-sm py-3 rounded-xl hover:bg-zinc-200 transition-colors">
              Zugang
            </button>
          </form>

          <p className="mt-8 text-[10px] text-zinc-600">
            Powered by <a href="https://laeuft.ch" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">laeuft.ch</a>
          </p>
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

  // --- Compute derived data ---
  const manualAufrufe = manualInsights.find(m => m.period === period && m.metric_type === 'aufrufe')
  const manualInter = manualInsights.find(m => m.period === period && m.metric_type === 'interaktionen')

  const aufrufeTotal = manualAufrufe?.total_value || data.accountInsights.impressions || data.metrics.totalImpressions
  const aufrufeBreakdown = manualAufrufe
    ? {
        stories: Math.round(manualAufrufe.total_value * (manualAufrufe.stories_pct || 0) / 100),
        reels: Math.round(manualAufrufe.total_value * (manualAufrufe.reels_pct || 0) / 100),
        posts: Math.round(manualAufrufe.total_value * (manualAufrufe.posts_pct || 0) / 100),
        total: manualAufrufe.total_value,
      }
    : data.impressionsBreakdown

  const erreichteKonten = manualAufrufe?.erreichte_konten || data.accountInsights.reach || data.metrics.totalReach

  const interTotal = manualInter?.total_value || data.metrics.totalInteractions
  const interBreakdown = manualInter
    ? {
        stories: Math.round(manualInter.total_value * (manualInter.stories_pct || 0) / 100),
        reels: Math.round(manualInter.total_value * (manualInter.reels_pct || 0) / 100),
        posts: Math.round(manualInter.total_value * (manualInter.posts_pct || 0) / 100),
        total: manualInter.total_value,
      }
    : data.interactionsBreakdown

  const interEngagedAccounts = data.accountInsights.accountsEngaged || 0

  // Top content sorted by views
  const topByViews = [...data.media].sort((a, b) => (b.impressions || b.plays || 0) - (a.impressions || a.plays || 0)).slice(0, 6)

  // Top content sorted by interactions
  const topByInteractions = [...data.media].sort((a, b) => {
    const ia = (a.like_count || 0) + (a.comments_count || 0) + (a.saved || 0) + (a.shares || 0)
    const ib = (b.like_count || 0) + (b.comments_count || 0) + (b.saved || 0) + (b.shares || 0)
    return ib - ia
  }).slice(0, 6)

  const countriesTotal = data.audience.countries.reduce((s, c) => s + c.value, 0)
  const topCountries = data.audience.countries.slice(0, 8)
  const topCities = data.audience.cities.slice(0, 8)
  const maxCityValue = topCities[0]?.value || 1

  // Helper for horizontal bar rendering
  function HorizontalBar({ label, value, maxValue, color, total }: { label: string; value: number; maxValue: number; color: string; total: number }) {
    const pct = total > 0 ? (value / total) * 100 : 0
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">{label}</span>
          <span className="text-sm font-semibold text-zinc-900">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-xs text-zinc-400">{formatNumber(value)}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* ============================================ */}
      {/* FLOATING PERIOD SELECTOR - bottom center, pulsing */}
      {/* ============================================ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[pulse_3s_ease-in-out_infinite]">
        <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/60 rounded-full px-2 py-2 shadow-2xl shadow-black/40">
          {[7, 14, 30].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-semibold px-5 py-2 rounded-full transition-all ${
                period === p
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p} Tage
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* HERO SECTION - Landing Page Feel */}
      {/* ============================================ */}
      <section className="w-full px-6 pt-12 pb-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none">
            INSIGHTS
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white/90 px-4 py-1.5 rounded-full border border-white/20 bg-white/5">
              @pierrebiege
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
        <p className="text-sm tracking-[0.2em] uppercase text-zinc-500 font-light mb-8">
          Pierre Biege &middot; Ultrarunner &middot; Content Creator &middot; Wallis
        </p>

        {/* 3 Hero images as large tiles */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden">
            <img src="/insights/hero-selfie.jpg" alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 hover:scale-105" />
          </div>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden">
            <img src="/insights/hero-hat.jpg" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden">
            <img src="/insights/hero-dryll.jpg" alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 1: AUFRUFE (combined 2-column card) */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Aufrufe</p>
              <p className="text-5xl font-black text-zinc-900 tracking-tight leading-none mb-1">
                {formatNumberBig(aufrufeTotal)}
              </p>
              <p className="text-xs text-zinc-400 mb-5">Aufrufe</p>

              {/* Follower / Non-Follower split */}
              {manualAufrufe && manualAufrufe.follower_pct != null && manualAufrufe.non_follower_pct != null && (
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PINK }} />
                    <span className="text-sm text-zinc-700">Follower: <span className="font-semibold">{manualAufrufe.follower_pct}%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
                    <span className="text-sm text-zinc-700">Nicht-Follower: <span className="font-semibold">{manualAufrufe.non_follower_pct}%</span></span>
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-sm text-zinc-600">
                  Erreichte Konten: <span className="font-semibold text-zinc-900">{formatNumberBig(erreichteKonten)}</span>
                </p>
              </div>
            </div>

            {/* Right column - Content-Art breakdown */}
            <div className="p-6 md:p-8 bg-zinc-50/50 border-t md:border-t-0 md:border-l border-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">Nach Content-Art</p>
              {aufrufeBreakdown && aufrufeBreakdown.total > 0 && (
                <div className="space-y-5">
                  <HorizontalBar
                    label="Stories"
                    value={aufrufeBreakdown.stories}
                    maxValue={Math.max(aufrufeBreakdown.stories, aufrufeBreakdown.reels, aufrufeBreakdown.posts, 1)}
                    color={PINK}
                    total={aufrufeBreakdown.total}
                  />
                  <HorizontalBar
                    label="Reels"
                    value={aufrufeBreakdown.reels}
                    maxValue={Math.max(aufrufeBreakdown.stories, aufrufeBreakdown.reels, aufrufeBreakdown.posts, 1)}
                    color={PURPLE}
                    total={aufrufeBreakdown.total}
                  />
                  <HorizontalBar
                    label="Beiträge"
                    value={aufrufeBreakdown.posts}
                    maxValue={Math.max(aufrufeBreakdown.stories, aufrufeBreakdown.reels, aufrufeBreakdown.posts, 1)}
                    color={AMBER}
                    total={aufrufeBreakdown.total}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: TOP CONTENT NACH AUFRUFEN */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Top Content nach Aufrufen</h2>
          <a
            href="https://instagram.com/pierrebiege"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Alle ansehen
            <ChevronRight size={14} />
          </a>
        </div>
        <div
          ref={viewsCarouselRef}
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {topByViews.map((post) => (
            <button
              key={post.id}
              onClick={() => { setSelectedPost(post); setCaptionExpanded(false) }}
              className="flex-shrink-0 w-[140px] group text-left"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                {(post.thumbnail_url || post.media_url) ? (
                  <img
                    src={post.thumbnail_url || post.media_url || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Camera size={24} />
                  </div>
                )}
                {/* View count badge at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Eye size={11} className="text-white/80" />
                    <span className="text-xs font-semibold text-white">{formatNumber(post.impressions || post.plays || 0)}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 text-center">{formatDate(post.timestamp)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: INTERAKTIONEN (combined 2-column card) */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Interaktionen</p>
              <p className="text-5xl font-black text-zinc-900 tracking-tight leading-none mb-1">
                {formatNumberBig(interTotal)}
              </p>
              <p className="text-xs text-zinc-400 mb-5">Interaktionen</p>

              {/* Follower / Non-Follower split */}
              {manualInter && manualInter.follower_pct != null && manualInter.non_follower_pct != null && (
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PINK }} />
                    <span className="text-sm text-zinc-700">Follower: <span className="font-semibold">{manualInter.follower_pct}%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
                    <span className="text-sm text-zinc-700">Nicht-Follower: <span className="font-semibold">{manualInter.non_follower_pct}%</span></span>
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-sm text-zinc-600">
                  Konten die interagiert haben: <span className="font-semibold text-zinc-900">{formatNumberBig(interEngagedAccounts)}</span>
                </p>
              </div>
            </div>

            {/* Right column - Content-Interaktionen breakdown */}
            <div className="p-6 md:p-8 bg-zinc-50/50 border-t md:border-t-0 md:border-l border-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">Nach Content-Interaktionen</p>
              {interBreakdown && interBreakdown.total > 0 && (
                <div className="space-y-5">
                  <HorizontalBar
                    label="Reels"
                    value={interBreakdown.reels}
                    maxValue={Math.max(interBreakdown.stories, interBreakdown.reels, interBreakdown.posts, 1)}
                    color={PURPLE}
                    total={interBreakdown.total}
                  />
                  <HorizontalBar
                    label="Beiträge"
                    value={interBreakdown.posts}
                    maxValue={Math.max(interBreakdown.stories, interBreakdown.reels, interBreakdown.posts, 1)}
                    color={AMBER}
                    total={interBreakdown.total}
                  />
                  <HorizontalBar
                    label="Stories"
                    value={interBreakdown.stories}
                    maxValue={Math.max(interBreakdown.stories, interBreakdown.reels, interBreakdown.posts, 1)}
                    color={PINK}
                    total={interBreakdown.total}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: TOP CONTENT NACH INTERAKTIONEN */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Top Content nach Interaktionen</h2>
          <a
            href="https://instagram.com/pierrebiege"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Alle ansehen
            <ChevronRight size={14} />
          </a>
        </div>
        <div
          ref={interactionsCarouselRef}
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {topByInteractions.map((post) => {
            const totalInt = (post.like_count || 0) + (post.comments_count || 0) + (post.saved || 0) + (post.shares || 0)
            return (
              <button
                key={post.id}
                onClick={() => { setSelectedPost(post); setCaptionExpanded(false) }}
                className="flex-shrink-0 w-[140px] group text-left"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                  {(post.thumbnail_url || post.media_url) ? (
                    <img
                      src={post.thumbnail_url || post.media_url || ''}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Camera size={24} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Heart size={11} className="text-white/80" />
                      <span className="text-xs font-semibold text-white">{formatNumber(totalInt)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 text-center">{formatDate(post.timestamp)}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: ZIELGRUPPE */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <h2 className="text-lg font-bold text-white mb-4">Zielgruppe</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top-Standorte (Laender) */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
              <Globe size={14} className="text-zinc-400" />
              Top-Standorte (L{'\u00e4'}nder)
            </h3>
            <div className="space-y-3">
              {topCountries.map((c) => {
                const display = getCountryDisplay(c.key)
                const pct = countriesTotal > 0 ? (c.value / countriesTotal) * 100 : 0
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-700 flex items-center gap-2">
                        <span>{display.flag}</span>
                        {display.name}
                      </span>
                      <span className="text-xs text-zinc-400">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
              <MapPin size={14} className="text-zinc-400" />
              Top-Standorte (St{'\u00e4'}dte)
            </h3>
            <div className="space-y-3">
              {topCities.map((c) => {
                const pct = maxCityValue > 0 ? (c.value / maxCityValue) * 100 : 0
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-700">{c.key}</span>
                      <span className="text-xs text-zinc-400">{formatNumber(c.value)}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PINK }}
                      />
                    </div>
                  </div>
                )
              })}
              {topCities.length === 0 && (
                <p className="text-xs text-zinc-400">Keine St{'\u00e4'}dte-Daten</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 6: STORIES (merged API + manual) */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Story Archiv</h2>
          <div className="flex gap-2">
            <button onClick={() => { const el = document.getElementById('stories-scroll'); if (el) el.scrollBy({ left: -400, behavior: 'smooth' }) }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <button onClick={() => { const el = document.getElementById('stories-scroll'); if (el) el.scrollBy({ left: 400, behavior: 'smooth' }) }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        </div>
        <div id="stories-scroll"
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allStories.map((story) => (
            <div key={story.id} className="flex-shrink-0 w-[120px] sm:w-[140px]">
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-800">
                <img src={story.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Eye size={11} className="text-white/80" />
                    <p className="text-xs text-white font-semibold">{formatNumber(story.views)}</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 text-center">{story.date}</p>
            </div>
          ))}
          {allStories.length === 0 && !storiesLoading && (
            <p className="text-sm text-zinc-500 py-8">Keine Stories verfuegbar</p>
          )}
          {storiesLoading && (
            <div className="flex items-center gap-2 py-8">
              <RefreshCw size={14} className="animate-spin text-zinc-500" />
              <p className="text-sm text-zinc-500">Stories laden...</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          {allStories.length} Stories &middot; {formatNumber(totalStoryViews)} Views gesamt
        </p>
      </section>

      {/* ============================================ */}
      {/* SECTION 7: CTA */}
      {/* ============================================ */}
      <section className="relative w-full mt-8">
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
      {/* SECTION 8: FOOTER */}
      {/* ============================================ */}
      <footer className="max-w-3xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Daten von Instagram
        </div>
        <p className="text-xs text-zinc-600">
          Powered by <a href="https://laeuft.ch" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">laeuft.ch</a>
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
            className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="aspect-[4/5] bg-zinc-100 rounded-t-2xl overflow-hidden">
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
                  <span className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {mediaTypeIcon(selectedPost.media_type)}
                    {mediaTypeLabel(selectedPost.media_type)}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDate(selectedPost.timestamp)}</span>
                </div>
                <a
                  href={selectedPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
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
                    className={`text-xs text-zinc-500 whitespace-pre-wrap ${
                      !captionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {selectedPost.caption}
                  </p>
                  {selectedPost.caption.length > 150 && (
                    <button
                      onClick={() => setCaptionExpanded(!captionExpanded)}
                      className="text-xs text-zinc-400 hover:text-zinc-900 mt-1 transition-colors"
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
    <div className="bg-zinc-50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center text-zinc-400 mb-1">{icon}</div>
      <p className="text-sm font-semibold text-zinc-900">{formatNumber(value)}</p>
      <p className="text-[10px] text-zinc-400">{label}</p>
    </div>
  )
}
