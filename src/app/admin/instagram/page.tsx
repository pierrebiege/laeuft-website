'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BarChart3,
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
  UserCircle,
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
  // Generate flag from code
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

interface ArchivedStory {
  id: string
  story_id: string
  media_type: string
  media_url: string
  thumbnail_url: string | null
  timestamp: string
  permalink: string | null
  reach: number
  impressions: number
  replies: number
  exits: number
}

export default function InstagramInsightsPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<MediaItem | null>(null)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  // Stories
  const [activeStories, setActiveStories] = useState<StoryItem[]>([])
  const [archivedStories, setArchivedStories] = useState<ArchivedStory[]>([])
  const [archiving, setArchiving] = useState(false)
  const [archiveResult, setArchiveResult] = useState<string | null>(null)
  const [storiesLoading, setStoriesLoading] = useState(false)

  // Carousel scroll
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
    fetchStories()
  }, [period])

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

  async function archiveStories() {
    setArchiving(true)
    setArchiveResult(null)
    try {
      const res = await fetch('/api/instagram/stories', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setArchiveResult(json.message || 'Archiviert')
        setArchivedStories(json.archivedStories || [])
        fetchStories()
      } else {
        setArchiveResult(json.error || 'Fehler')
      }
    } catch (e) {
      setArchiveResult(String(e))
    } finally {
      setArchiving(false)
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

  // Audience data parsing
  function parseAgeGender(entries: Array<{ key: string; value: number }>) {
    const ageGroups: Record<string, { male: number; female: number; unknown: number }> = {}
    let totalMale = 0
    let totalFemale = 0
    let totalUnknown = 0

    for (const entry of entries) {
      // Format: "M.25-34" or "F.18-24" or "U.35-44"
      const parts = entry.key.split('.')
      if (parts.length !== 2) continue
      const gender = parts[0] // M, F, or U
      const age = parts[1]

      if (!ageGroups[age]) ageGroups[age] = { male: 0, female: 0, unknown: 0 }

      if (gender === 'M') {
        ageGroups[age].male += entry.value
        totalMale += entry.value
      } else if (gender === 'F') {
        ageGroups[age].female += entry.value
        totalFemale += entry.value
      } else {
        ageGroups[age].unknown += entry.value
        totalUnknown += entry.value
      }
    }

    const total = totalMale + totalFemale + totalUnknown
    const sortedAges = Object.entries(ageGroups).sort((a, b) => {
      const aNum = parseInt(a[0].split('-')[0]) || 0
      const bNum = parseInt(b[0].split('-')[0]) || 0
      return aNum - bNum
    })

    return {
      ageGroups: sortedAges.map(([age, counts]) => ({
        age,
        total: counts.male + counts.female + counts.unknown,
        male: counts.male,
        female: counts.female,
      })),
      genderSplit: {
        male: total > 0 ? Math.round((totalMale / total) * 100) : 0,
        female: total > 0 ? Math.round((totalFemale / total) * 100) : 0,
      },
      total,
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 py-20 justify-center">
          <RefreshCw size={20} className="animate-spin text-zinc-400" />
          <p className="text-zinc-500">Instagram Insights laden...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 mt-8">
          <p className="text-red-700 dark:text-red-400">{error || 'Keine Daten'}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-sm text-red-600 dark:text-red-400 underline"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const last20Media = data.media.slice(0, 20)
  const audienceData = parseAgeGender(data.audience.ageGender || [])
  const countriesTotal = data.audience.countries.reduce((s, c) => s + c.value, 0)
  const topCountries = data.audience.countries.slice(0, 10)
  const topCities = data.audience.cities.slice(0, 10)
  const maxCityValue = topCities[0]?.value || 1

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Instagram Insights</h1>
          <div className="flex gap-1">
            {[7, 14, 30].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  period === p ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}>
                {p} Tage
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={archiveStories}
            disabled={archiving}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {archiving ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            Stories archivieren
          </button>
          {data.fetchedAt && (
            <span className="text-xs text-zinc-400">
              Aktualisiert: {new Date(data.fetchedAt).toLocaleString('de-CH')}
            </span>
          )}
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Aufrufe"
          value={data.accountInsights.impressions || data.metrics.totalImpressions}
          icon={<Eye size={18} />}
        />
        <KPICard
          label="Erreichte Konten"
          value={data.accountInsights.reach || data.metrics.totalReach}
          icon={<Users size={18} />}
        />
        <KPICard
          label="Interagierte Konten"
          value={data.accountInsights.accountsEngaged || data.metrics.totalInteractions}
          icon={<Heart size={18} />}
        />
        <KPICard
          label="Follower"
          value={data.profile.followers_count}
          icon={<UserCircle size={18} />}
        />
      </div>

      {/* POST CAROUSEL */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Letzte 20 Beitr\u00E4ge
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollCarousel('left')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={18} />
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
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
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
                <p className="text-[11px] text-zinc-400">{formatDate(post.timestamp)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* AUDIENCE SECTION */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Users size={18} />
          Zielgruppe
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Countries */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe size={14} />
              L\u00E4nder
            </h3>
            <div className="space-y-2.5">
              {topCountries.map((c) => {
                const display = getCountryDisplay(c.key)
                const pct = countriesTotal > 0 ? (c.value / countriesTotal) * 100 : 0
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{display.flag}</span>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 w-24 truncate">{display.name}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-10 text-right">{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cities */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={14} />
              St\u00E4dte
            </h3>
            <div className="space-y-2.5">
              {topCities.map((c) => {
                const pct = maxCityValue > 0 ? (c.value / maxCityValue) * 100 : 0
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 w-28 truncate">{c.key}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-12 text-right">{formatNumber(c.value)}</span>
                  </div>
                )
              })}
              {topCities.length === 0 && (
                <p className="text-xs text-zinc-400">Keine St\u00E4dte-Daten</p>
              )}
            </div>
          </div>

          {/* Age & Gender */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              Alter &amp; Geschlecht
            </h3>

            {/* Gender split bar */}
            {audienceData.total > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span>M\u00E4nnlich {audienceData.genderSplit.male}%</span>
                  <span>Weiblich {audienceData.genderSplit.female}%</span>
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500 rounded-l-full"
                    style={{ width: `${audienceData.genderSplit.male}%` }}
                  />
                  <div
                    className="h-full bg-pink-500 rounded-r-full"
                    style={{ width: `${audienceData.genderSplit.female}%` }}
                  />
                </div>
              </div>
            )}

            {/* Age groups */}
            <div className="space-y-2">
              {audienceData.ageGroups.map((ag) => {
                const maxAge = Math.max(...audienceData.ageGroups.map((a) => a.total), 1)
                const pct = (ag.total / maxAge) * 100
                return (
                  <div key={ag.age} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 w-14">{ag.age}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${ag.total > 0 ? (ag.male / maxAge) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="h-full bg-pink-500"
                        style={{
                          width: `${ag.total > 0 ? (ag.female / maxAge) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-10 text-right">{formatNumber(ag.total)}</span>
                  </div>
                )
              })}
              {audienceData.ageGroups.length === 0 && (
                <p className="text-xs text-zinc-400">Keine Alters-Daten</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STORIES SECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Camera size={18} />
            Aktuelle Stories
          </h2>
          <button
            onClick={archiveStories}
            disabled={archiving}
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {archiving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            Stories jetzt archivieren
          </button>
        </div>

        {archiveResult && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg px-4 py-2 mb-4">
            {archiveResult}
          </div>
        )}

        {storiesLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <RefreshCw size={16} className="animate-spin text-zinc-400" />
            <span className="text-sm text-zinc-500">Stories laden...</span>
          </div>
        ) : activeStories.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {activeStories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-[120px]"
              >
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-2 ring-pink-500">
                  {(story.thumbnail_url || story.media_url) ? (
                    <img
                      src={story.thumbnail_url || story.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Camera size={24} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 text-center">
                  {formatDate(story.timestamp)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
            <Camera size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-500">Keine aktiven Stories gerade</p>
          </div>
        )}

        {/* Archived Stories */}
        {archivedStories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              Archivierte Stories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {archivedStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="aspect-[9/16] bg-zinc-100 dark:bg-zinc-800">
                    {(story.thumbnail_url || story.media_url) ? (
                      <img
                        src={story.thumbnail_url || story.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <Camera size={20} />
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="flex items-center gap-0.5">
                        <Eye size={9} />
                        {formatNumber(story.impressions)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users size={9} />
                        {formatNumber(story.reach)}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">{formatDate(story.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Image */}
            <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 rounded-t-2xl overflow-hidden">
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

            {/* Metrics */}
            <div className="p-5 space-y-4">
              {/* Type & Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    {mediaTypeIcon(selectedPost.media_type)}
                    {mediaTypeLabel(selectedPost.media_type)}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(selectedPost.timestamp)}</span>
                </div>
                <a
                  href={selectedPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <ExternalLink size={12} />
                  Instagram
                </a>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCell icon={<Eye size={14} />} label="Aufrufe" value={selectedPost.impressions || selectedPost.plays || 0} />
                <MetricCell icon={<Users size={14} />} label="Reichweite" value={selectedPost.reach} />
                <MetricCell icon={<Heart size={14} />} label="Likes" value={selectedPost.like_count} />
                <MetricCell icon={<MessageCircle size={14} />} label="Kommentare" value={selectedPost.comments_count} />
                <MetricCell icon={<Bookmark size={14} />} label="Gespeichert" value={selectedPost.saved} />
                <MetricCell icon={<Share2 size={14} />} label="Geteilt" value={selectedPost.shares} />
              </div>

              {/* Caption */}
              {selectedPost.caption && (
                <div>
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap ${
                      !captionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {selectedPost.caption}
                  </p>
                  {selectedPost.caption.length > 150 && (
                    <button
                      onClick={() => setCaptionExpanded(!captionExpanded)}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white mt-1 transition-colors"
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

// KPI Card component
function KPICard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">
        {formatNumber(value)}
      </p>
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
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center text-zinc-400 mb-1">{icon}</div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{formatNumber(value)}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}
