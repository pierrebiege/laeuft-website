'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, ArrowRight, Play, Instagram, ChevronRight } from 'lucide-react'

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
  periodMedia: MediaItem[]
  topByImpressions: MediaItem[]
  topByInteractions: MediaItem[]
  audience: AudienceData
  onlineFollowers: Record<number, Record<number, number>>
  accountInsights: {
    impressions: number
    reach: number
    profileViews: number
    websiteClicks: number
    accountsEngaged: number
    profileActivity: number
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
  followerSplit: {
    impressions: { follower: number; nonFollower: number }
    interactions: { follower: number; nonFollower: number }
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
  contentMix: {
    reels: number
    images: number
    carousels: number
    total: number
  }
  period: number
  fetchedAt: string
}

// --- Helpers ---

function fmt(n: number): string {
  return n.toLocaleString('de-CH')
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString('de-CH')
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
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

// --- Colors ---
const PINK = '#E1306C'
const PURPLE = '#5851DB'
const GRADIENT_PINK = '#C13584'

// --- Main Component ---

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(30)
  const [contentFilter, setContentFilter] = useState<'all' | 'stories' | 'reels' | 'posts'>('all')
  const [contentSort, setContentSort] = useState<'impressions' | 'interactions'>('impressions')
  const [contentOrder, setContentOrder] = useState<'desc' | 'asc'>('desc')
  const [activeDay, setActiveDay] = useState(1) // Monday
  const [aufrufeTab, setAufrufeTab] = useState<'all' | 'follower' | 'nonFollower'>('all')

  const load = useCallback(async (days: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/insights?days=${days}`)
      if (!res.ok) throw new Error('Daten konnten nicht geladen werden')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(period)
  }, [period, load])

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 bg-gray-200 rounded-lg" />
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-gray-200 rounded-full" />
                <div className="h-9 w-20 bg-gray-200 rounded-full" />
                <div className="h-9 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 rounded-2xl" />
              <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 rounded-2xl" />
              <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400 mb-2">Fehler</p>
          <p className="text-gray-500 text-sm">{error || 'Keine Daten verfuegbar'}</p>
          <button
            onClick={() => load(period)}
            className="mt-4 px-5 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const { profile, periodMedia, topByImpressions, topByInteractions, audience, onlineFollowers, accountInsights, impressionsBreakdown, interactionsBreakdown, followerSplit, metrics } = data

  const totalCountry = audience.countries.reduce((s, c) => s + c.value, 0) || 1
  const countries = audience.countries.slice(0, 6).map((c) => ({
    ...c,
    pct: (c.value / totalCountry) * 100,
  }))
  const ageGroups = parseAgeGroups(audience.ageGender)
  const genderSplit = parseGenderSplit(audience.ageGender)

  // Online followers for active day
  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const dayHours = onlineFollowers[activeDay] || {}
  const hourSlots = [0, 3, 6, 9, 12, 15, 18, 21]
  const maxOnline = Math.max(...hourSlots.map((h) => dayHours[h] || 0), 1)

  // Content grid filtering
  const filteredMedia = periodMedia.filter((m) => {
    if (contentFilter === 'all') return true
    if (contentFilter === 'reels') return m.media_type === 'VIDEO' || m.media_type === 'REEL'
    if (contentFilter === 'posts') return m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM'
    // stories not in media endpoint
    return true
  }).sort((a, b) => {
    const valA = contentSort === 'impressions' ? (a.impressions || a.plays || 0) : (a.like_count + a.comments_count + a.saved + a.shares)
    const valB = contentSort === 'impressions' ? (b.impressions || b.plays || 0) : (b.like_count + b.comments_count + b.saved + b.shares)
    return contentOrder === 'desc' ? valB - valA : valA - valB
  })

  // Impressions bars data with follower tab
  function getBreakdownBars(breakdown: { stories: number; reels: number; posts: number; total: number }) {
    const total = breakdown.total || 1
    const multiplier = aufrufeTab === 'follower'
      ? followerSplit.impressions.follower / 100
      : aufrufeTab === 'nonFollower'
      ? followerSplit.impressions.nonFollower / 100
      : 1
    return [
      { label: 'Stories', value: Math.round(breakdown.stories * multiplier), pct: (breakdown.stories / total) * 100, color: PINK },
      { label: 'Reels', value: Math.round(breakdown.reels * multiplier), pct: (breakdown.reels / total) * 100, color: PURPLE },
      { label: 'Beitr\u00e4ge', value: Math.round(breakdown.posts * multiplier), pct: (breakdown.posts / total) * 100, color: '#FCAF45' },
    ].sort((a, b) => b.pct - a.pct)
  }

  const aufrufeBars = getBreakdownBars(impressionsBreakdown)
  const maxBarPct = Math.max(...aufrufeBars.map((b) => b.pct), 1)

  // Interactions bars
  const interactionBars = [
    { label: 'Reels', value: interactionsBreakdown.reels, pct: interactionsBreakdown.total ? (interactionsBreakdown.reels / interactionsBreakdown.total) * 100 : 0, color: PURPLE },
    { label: 'Beitr\u00e4ge', value: interactionsBreakdown.posts, pct: interactionsBreakdown.total ? (interactionsBreakdown.posts / interactionsBreakdown.total) * 100 : 0, color: '#FCAF45' },
    { label: 'Stories', value: interactionsBreakdown.stories, pct: interactionsBreakdown.total ? (interactionsBreakdown.stories / interactionsBreakdown.total) * 100 : 0, color: PINK },
  ].sort((a, b) => b.pct - a.pct)
  const maxInteractionPct = Math.max(...interactionBars.map((b) => b.pct), 1)

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ===== HEADER ===== */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Konto-Insights
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-gray-500">Live Daten von Instagram</span>
            </div>
          </div>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-full">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  period === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d} Tage
              </button>
            ))}
          </div>
        </header>

        {/* ===== SECTION 1: AUFRUFE ===== */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Left: Big number */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-4xl font-bold tracking-tight">{fmt(metrics.totalImpressions)}</p>
                <p className="text-sm text-gray-500 mt-1">Aufrufe</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>Follower: <strong>{followerSplit.impressions.follower.toFixed(1)}%</strong></span>
                <span>Nicht-Follower: <strong>{followerSplit.impressions.nonFollower.toFixed(1)}%</strong></span>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Erreichte Konten</span>
                  <span className="text-sm font-semibold">{fmt(metrics.totalReach)}</span>
                </div>
              </div>
            </div>

            {/* Right: Content breakdown bars */}
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-900 mb-3">Nach Content-Art</p>
              <div className="flex gap-1.5 mb-5">
                {(['all', 'follower', 'nonFollower'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAufrufeTab(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      aufrufeTab === tab
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'all' ? 'Alle' : tab === 'follower' ? 'Follower' : 'Nicht-Follower'}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {aufrufeBars.map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">{bar.label}</span>
                      <span className="text-sm font-medium text-gray-500">{bar.pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((bar.pct / maxBarPct) * 100, 3)}%`,
                          backgroundColor: bar.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: TOP CONTENT NACH AUFRUFEN ===== */}
        {topByImpressions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Top-Content nach Aufrufen</h2>
              <button className="flex items-center gap-1 text-sm font-medium" style={{ color: PINK }}>
                Alle ansehen <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {topByImpressions.map((item) => (
                <TopContentCard key={item.id} item={item} metric={item.impressions || item.plays || 0} metricLabel="Aufrufe" />
              ))}
            </div>
          </section>
        )}

        {/* ===== SECTION 3: PROFIL ===== */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Left: Profile activity */}
            <div className="p-6">
              <p className="text-2xl font-bold">{fmt(accountInsights.profileActivity)}</p>
              <p className="text-sm text-gray-500 mt-1 mb-5">Profilaktivit&auml;ten</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profilaufrufe</span>
                  <span className="text-sm font-semibold">{fmt(accountInsights.profileViews)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auf externen Link getippt</span>
                  <span className="text-sm font-semibold">{fmt(accountInsights.websiteClicks)}</span>
                </div>
              </div>
            </div>

            {/* Right: Followers + active times */}
            <div className="p-6">
              <p className="text-2xl font-bold">{fmt(profile.followers_count)}</p>
              <p className="text-sm text-gray-500 mt-1 mb-5">Follower insgesamt</p>

              <p className="text-sm font-semibold text-gray-900 mb-3">Aktivste Zeiten</p>
              {/* Day tabs */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`w-8 h-8 text-xs font-medium rounded-full transition-all ${
                      activeDay === d
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {dayLabels[d]}
                  </button>
                ))}
              </div>
              {/* Hour bars */}
              <div className="space-y-1.5">
                {hourSlots.map((h) => {
                  const val = dayHours[h] || 0
                  const barW = maxOnline > 0 ? (val / maxOnline) * 100 : 0
                  return (
                    <div key={h} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 w-10 text-right tabular-nums">{String(h).padStart(2, '0')}:00</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(barW, 2)}%`, backgroundColor: PINK }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 w-12 tabular-nums">{fmtCompact(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 4: INTERAKTIONEN ===== */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Left */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-4xl font-bold tracking-tight">{fmt(metrics.totalInteractions)}</p>
                <p className="text-sm text-gray-500 mt-1">Interaktionen</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>Follower: <strong>{followerSplit.interactions.follower.toFixed(1)}%</strong></span>
                <span>Nicht-Follower: <strong>{followerSplit.interactions.nonFollower.toFixed(1)}%</strong></span>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Konten, die interagiert haben</span>
                  <span className="text-sm font-semibold">{fmt(accountInsights.accountsEngaged)}</span>
                </div>
              </div>
            </div>

            {/* Right: Interaction breakdown */}
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-900 mb-5">Nach Content-Interaktionen</p>
              <div className="space-y-4">
                {interactionBars.map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">{bar.label}</span>
                      <span className="text-sm font-medium text-gray-500">{bar.pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((bar.pct / maxInteractionPct) * 100, 3)}%`,
                          backgroundColor: bar.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: TOP CONTENT NACH INTERAKTIONEN ===== */}
        {topByInteractions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Top-Content nach Interaktionen</h2>
              <button className="flex items-center gap-1 text-sm font-medium" style={{ color: PINK }}>
                Alle ansehen <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {topByInteractions.map((item) => {
                const interactions = item.like_count + item.comments_count + item.saved + item.shares
                return (
                  <TopContentCard key={item.id} item={item} metric={interactions} metricLabel="Interaktionen" />
                )
              })}
            </div>
          </section>
        )}

        {/* ===== SECTION 6: CONTENT INSIGHTS ===== */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Content-Insights</h2>
          {/* Filter row */}
          <div className="flex flex-wrap gap-2 mb-5">
            <select
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value as typeof contentFilter)}
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="all">Alle</option>
              <option value="reels">Reels</option>
              <option value="posts">Beitr&auml;ge</option>
            </select>
            <select
              value={contentSort}
              onChange={(e) => setContentSort(e.target.value as typeof contentSort)}
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="impressions">Aufrufe</option>
              <option value="interactions">Interaktionen</option>
            </select>
            <select
              value={contentOrder}
              onChange={(e) => setContentOrder(e.target.value as typeof contentOrder)}
              className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="desc">H&ouml;chste zuerst</option>
              <option value="asc">Niedrigste zuerst</option>
            </select>
          </div>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {filteredMedia.map((item) => (
              <ContentGridCard key={item.id} item={item} sortMetric={contentSort} />
            ))}
          </div>
        </section>

        {/* ===== SECTION 7: ZIELGRUPPE ===== */}
        {(countries.length > 0 || ageGroups.length > 0) && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Zielgruppe</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Countries */}
              {countries.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">L&auml;nder</p>
                  <div className="space-y-3">
                    {countries.map((c) => (
                      <div key={c.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{countryLabel(c.key)}</span>
                          <span className="text-sm font-medium text-gray-500">{c.pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(c.pct, 2)}%`,
                              backgroundColor: PINK,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Groups */}
              {ageGroups.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Alter</p>
                  <div className="space-y-3">
                    {ageGroups.slice(0, 6).map((a) => (
                      <div key={a.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{a.key}</span>
                          <span className="text-sm font-medium text-gray-500">{a.pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(a.pct, 2)}%`,
                              backgroundColor: PURPLE,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender */}
              {(genderSplit.male > 0 || genderSplit.female > 0) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Geschlecht</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-700">M&auml;nnlich</span>
                        <span className="text-sm font-semibold text-gray-700">{genderSplit.male.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${genderSplit.male}%`, backgroundColor: PURPLE }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-700">Weiblich</span>
                        <span className="text-sm font-semibold text-gray-700">{genderSplit.female.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${genderSplit.female}%`, backgroundColor: PINK }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== SECTION 8: CTA ===== */}
        <section className="text-center py-12 px-6 bg-gray-50 rounded-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Interesse an einer Zusammenarbeit?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Lass uns gemeinsam etwas bewegen.
          </p>
          <a
            href="mailto:pierre@laeuft.ch"
            className="inline-flex items-center gap-2 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: PINK }}
          >
            <Mail size={16} />
            Kontakt aufnehmen
            <ArrowRight size={14} />
          </a>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="text-center pb-8 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Daten werden live von Instagram geladen &middot; Letzte Aktualisierung: {fmtTime(data.fetchedAt)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Powered by <span className="font-medium text-gray-500">l&auml;uft.</span>
          </p>
        </footer>
      </main>
    </div>
  )
}

// --- Sub-components ---

function TopContentCard({
  item,
  metric,
  metricLabel,
}: {
  item: MediaItem
  metric: number
  metricLabel: string
}) {
  const thumb = getThumb(item)
  const video = isVideo(item.media_type)

  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-32 sm:w-36 group"
    >
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100">
        {thumb ? (
          <img
            src={thumb}
            alt={item.caption?.slice(0, 60) || 'Instagram Post'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            {video ? (
              <Play size={24} className="text-gray-400" />
            ) : (
              <Instagram size={20} className="text-gray-300" />
            )}
          </div>
        )}
        {/* Badge */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6">
          <p className="text-white text-xs font-semibold">{fmtCompact(metric)}</p>
          <p className="text-white/70 text-[10px]">{metricLabel}</p>
        </div>
        {/* Play icon */}
        {video && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-md p-1">
            <Play size={10} className="text-white fill-white" />
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5 truncate">{fmtDate(item.timestamp)}</p>
    </a>
  )
}

function ContentGridCard({
  item,
  sortMetric,
}: {
  item: MediaItem
  sortMetric: 'impressions' | 'interactions'
}) {
  const thumb = getThumb(item)
  const video = isVideo(item.media_type)
  const value =
    sortMetric === 'impressions'
      ? item.impressions || item.plays || 0
      : item.like_count + item.comments_count + item.saved + item.shares

  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={item.caption?.slice(0, 60) || 'Post'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          crossOrigin="anonymous"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {video ? <Play size={24} className="text-gray-400" /> : <Instagram size={20} className="text-gray-300" />}
        </div>
      )}
      {/* Badge */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
        <p className="text-white text-xs font-semibold">{fmtCompact(value)}</p>
      </div>
      {/* Video indicator */}
      {video && (
        <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded p-0.5">
          <Play size={10} className="text-white fill-white" />
        </div>
      )}
      {/* Carousel indicator */}
      {item.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-1.5 right-1.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white drop-shadow-lg">
            <rect x="1" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="5" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}
    </a>
  )
}
