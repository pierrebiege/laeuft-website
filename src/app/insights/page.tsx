'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import type { InstagramPost, InstagramAudience } from '@/lib/instagram-types'

type Period = '7' | '14' | '30'

interface InsightsSummary {
  current_followers: number
  follower_growth: number
  follower_growth_pct: number
  avg_engagement_rate: number
  avg_reach: number
  total_views: number
  total_interactions: number
  total_posts_period: number
  posts_per_week: number
  reached_accounts: number
  media_count: number
  last_updated: string | null
}

interface InsightsData {
  config: {
    account_name: string
    account_bio: string | null
    contact_email: string | null
  }
  summary: InsightsSummary | null
  posts: InstagramPost[]
  audience: {
    age_gender: InstagramAudience[]
    country: InstagramAudience[]
    city: InstagramAudience[]
  }
}

function fmt(n: number) {
  return n.toLocaleString('de-CH')
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>('30')
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/insights?period=${p}`)
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
    fetchData(period)
  }, [period, fetchData])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade Instagram Insights...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-black text-zinc-500 mb-2">Fehler</p>
          <p className="text-zinc-600 text-sm">{error}</p>
          <button
            onClick={() => fetchData(period)}
            className="mt-4 px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const posts = data?.posts || []
  const audience = data?.audience
  const contactEmail = data?.config?.contact_email || 'pierre@laeuft.ch'

  // Top posts by impressions
  const topPosts = [...posts]
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 4)

  // Interaction breakdown from posts
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0)
  const totalSaves = posts.reduce((s, p) => s + (p.saves_count || 0), 0)
  const totalShares = posts.reduce((s, p) => s + (p.shares_count || 0), 0)

  const interactions = [
    { label: 'Gefällt mir', value: totalLikes },
    { label: 'Kommentare', value: totalComments },
    { label: 'Gespeichert', value: totalSaves },
    { label: 'Geteilt', value: totalShares },
  ].sort((a, b) => b.value - a.value)

  // Content type breakdown from posts
  const reelCount = posts.filter((p) => p.media_type === 'REEL' || p.media_type === 'VIDEO').length
  const imageCount = posts.filter((p) => p.media_type === 'IMAGE').length
  const carouselCount = posts.filter((p) => p.media_type === 'CAROUSEL_ALBUM').length
  const totalContent = reelCount + imageCount + carouselCount || 1
  const reelsPct = parseFloat(((reelCount / totalContent) * 100).toFixed(1))
  const imagePct = parseFloat(((imageCount / totalContent) * 100).toFixed(1))
  const carouselPct = parseFloat(((carouselCount / totalContent) * 100).toFixed(1))

  // Audience demographics
  const countries = parseAudienceItems(audience?.country || [])
  const ageGroups = parseAgeGroups(audience?.age_gender || [])
  const genderSplit = parseGenderSplit(audience?.age_gender || [])

  const engagementRate = summary
    ? summary.avg_engagement_rate > 0
      ? `${summary.avg_engagement_rate.toFixed(2)}%`
      : summary.total_views > 0 && summary.current_followers > 0
        ? `${((summary.total_interactions / summary.total_views) * 100).toFixed(2)}%`
        : '—'
    : '—'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Pierre Biege</h1>
              <p className="text-zinc-400 text-sm mt-0.5">
                <a href="https://instagram.com/pierrebiege" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">@pierrebiege</a> · Ultrarunner · Content Creator
              </p>
              {summary && (
                <p className="text-zinc-600 text-xs mt-0.5">
                  {fmt(summary.current_followers)} Follower · {fmt(summary.total_posts_period)} Inhalte / {period}d
                </p>
              )}
            </div>

            {/* LIVE indicator */}
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400">Live Instagram Daten</span>
            </div>
          </div>

          {summary?.last_updated && (
            <p className="text-[10px] text-zinc-600 mt-2">
              Letzte Aktualisierung: {fmtDate(summary.last_updated)}
            </p>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {(['7', '14', '30'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                period === p
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {p === '30' ? '30 Tage' : p === '14' ? '14 Tage' : '7 Tage'}
            </button>
          ))}
          {loading && data && (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin ml-2" />
          )}
        </div>

        {summary ? (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Follower</p>
                <p className="text-2xl font-black text-white mt-1">{fmt(summary.current_followers)}</p>
                <p className="text-xs text-emerald-400 mt-0.5">+{fmt(summary.follower_growth)}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Aufrufe</p>
                <p className="text-2xl font-black text-white mt-1">{fmt(summary.total_views)}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Interaktionen</p>
                <p className="text-2xl font-black text-white mt-1">{fmt(summary.total_interactions)}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Engagement</p>
                <p className="text-2xl font-black text-white mt-1">{engagementRate}</p>
              </div>
            </div>

            {/* Aufrufe Detail */}
            <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                {/* Left: Aufrufe */}
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-white">{fmt(summary.total_views)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 mb-5">Aufrufe</p>

                  <div className="mt-5 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Erreichte Konten</span>
                      <span className="text-lg font-bold text-white">{fmt(summary.reached_accounts)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Nach Content-Art */}
                <div>
                  <p className="text-sm font-semibold text-white mb-4">Nach Content-Art</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-300">Reels / Videos</span>
                        <span className="text-sm text-zinc-400">{reelsPct}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600" style={{ width: `${Math.max(reelsPct, 2)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-300">Beiträge</span>
                        <span className="text-sm text-zinc-400">{imagePct}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${Math.max(imagePct, 2)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-zinc-300">Karussells</span>
                        <span className="text-sm text-zinc-400">{carouselPct}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-700" style={{ width: `${Math.max(carouselPct, 2)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Interaktionen */}
            <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
              <p className="text-sm font-semibold text-white mb-1">{fmt(summary.total_interactions)} Interaktionen</p>
              <p className="text-xs text-zinc-500 mb-4">Basierend auf {fmt(posts.length)} Beiträgen</p>

              {interactions.length > 0 && (
                <div className="space-y-2">
                  {interactions.map((item) => {
                    const maxVal = interactions[0].value || 1
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-24">{item.label}</span>
                        <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(item.value / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500 w-14 text-right">{fmt(item.value)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Top Posts */}
            {topPosts.length > 0 && (
              <section>
                <p className="text-sm font-semibold text-white mb-3">Top Beiträge nach Aufrufen ({period} Tage)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topPosts.map((post) => (
                    <a
                      key={post.id || post.ig_media_id}
                      href={post.permalink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                    >
                      <p className="text-xs text-zinc-400 font-medium line-clamp-2">
                        {post.caption ? post.caption.slice(0, 60) + (post.caption.length > 60 ? '...' : '') : 'Beitrag'}
                      </p>
                      <p className="text-lg font-bold text-white mt-2">{fmt(post.impressions || 0)}</p>
                      <p className="text-[10px] text-zinc-600">
                        Aufrufe · {fmtDate(post.timestamp)}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Zielgruppe */}
            {audience && (countries.length > 0 || ageGroups.length > 0) && (
              <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
                <p className="text-sm font-semibold text-white mb-4">Zielgruppe</p>

                <div className="grid sm:grid-cols-3 gap-6">
                  {/* Laender */}
                  {countries.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Länder</p>
                      <div className="space-y-1.5">
                        {countries.slice(0, 5).map((c) => (
                          <div key={c.key} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{countryFlag(c.key)} {countryName(c.key)}</span>
                            <span className="text-xs font-medium text-zinc-400">{c.pct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alter */}
                  {ageGroups.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Alter</p>
                      <div className="space-y-1.5">
                        {ageGroups.slice(0, 5).map((a) => (
                          <div key={a.key} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{a.key}</span>
                            <span className="text-xs font-medium text-zinc-400">{a.pct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Geschlecht */}
                  {(genderSplit.male > 0 || genderSplit.female > 0) && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Geschlecht</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-300">Männlich</span>
                            <span className="text-xs font-medium text-zinc-400">{genderSplit.male.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${genderSplit.male}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-300">Weiblich</span>
                            <span className="text-xs font-medium text-zinc-400">{genderSplit.female.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${genderSplit.female}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Empty state when no data */
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm">Keine Daten für diesen Zeitraum verfügbar.</p>
          </div>
        )}

        {/* CTA */}
        <section className="text-center py-10">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Interesse an einer Zusammenarbeit?</h2>
          <p className="text-zinc-500 text-sm mb-5">Lass uns gemeinsam etwas bewegen.</p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <Mail size={16} />
            Kontakt aufnehmen
            <ArrowRight size={14} />
          </a>
        </section>

        {/* Footer */}
        <footer className="text-center pb-6 pt-3 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-700">
            Powered by <span className="text-zinc-500">läuft.</span> · Daten werden live von Instagram geladen
          </p>
        </footer>
      </main>
    </div>
  )
}

// --- Helper functions for audience data ---

function parseAudienceItems(items: InstagramAudience[]): Array<{ key: string; pct: number }> {
  if (!items.length) return []
  // Get the latest date's data
  const latestDate = items[0].date
  const latest = items.filter((i) => i.date === latestDate)
  const total = latest.reduce((s, i) => s + i.value, 0) || 1
  return latest
    .map((i) => ({ key: i.dimension_key, pct: (i.value / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)
}

function parseAgeGroups(items: InstagramAudience[]): Array<{ key: string; pct: number }> {
  if (!items.length) return []
  const latestDate = items[0].date
  const latest = items.filter((i) => i.date === latestDate)

  // age_gender entries have keys like "M.25-34", "F.18-24"
  const ageMap: Record<string, number> = {}
  let total = 0
  for (const item of latest) {
    const parts = item.dimension_key.split('.')
    const ageRange = parts.length > 1 ? parts[1] : parts[0]
    ageMap[ageRange] = (ageMap[ageRange] || 0) + item.value
    total += item.value
  }
  if (total === 0) return []

  return Object.entries(ageMap)
    .map(([key, val]) => ({ key, pct: (val / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)
}

function parseGenderSplit(items: InstagramAudience[]): { male: number; female: number } {
  if (!items.length) return { male: 0, female: 0 }
  const latestDate = items[0].date
  const latest = items.filter((i) => i.date === latestDate)

  let male = 0
  let female = 0
  for (const item of latest) {
    if (item.dimension_key.startsWith('M')) male += item.value
    else if (item.dimension_key.startsWith('F')) female += item.value
  }
  const total = male + female || 1
  return {
    male: (male / total) * 100,
    female: (female / total) * 100,
  }
}

const COUNTRY_FLAGS: Record<string, string> = {
  CH: '\u{1F1E8}\u{1F1ED}',
  DE: '\u{1F1E9}\u{1F1EA}',
  AT: '\u{1F1E6}\u{1F1F9}',
  LU: '\u{1F1F1}\u{1F1FA}',
  FR: '\u{1F1EB}\u{1F1F7}',
  IT: '\u{1F1EE}\u{1F1F9}',
  US: '\u{1F1FA}\u{1F1F8}',
  GB: '\u{1F1EC}\u{1F1E7}',
  NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}',
}

const COUNTRY_NAMES: Record<string, string> = {
  CH: 'Schweiz',
  DE: 'Deutschland',
  AT: 'Österreich',
  LU: 'Luxemburg',
  FR: 'Frankreich',
  IT: 'Italien',
  US: 'USA',
  GB: 'Grossbritannien',
  NL: 'Niederlande',
  BE: 'Belgien',
}

function countryFlag(code: string): string {
  return COUNTRY_FLAGS[code] || ''
}

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code
}
