'use client'

import { useState, useEffect } from 'react'
import { Mail, Play } from 'lucide-react'

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

interface InsightsResponse {
  profile: {
    name: string
    biography: string
    followers_count: number
    follows_count: number
    media_count: number
    profile_picture_url: string
  }
  periodMedia: MediaItem[]
  topByImpressions: MediaItem[]
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

// --- Helpers ---

function fmt(n: number): string {
  return n.toLocaleString('de-CH')
}

function countryFlag(code: string): string {
  try {
    return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
  } catch { return code }
}

const COUNTRY_NAMES: Record<string, string> = {
  CH: 'Schweiz',
  DE: 'Deutschland',
  AT: 'Österreich',
  LU: 'Luxemburg',
  IT: 'Italien',
  FR: 'Frankreich',
  US: 'USA',
  GB: 'Grossbritannien',
}

function getThumb(item: MediaItem): string {
  if (item.media_type === 'VIDEO' || item.media_type === 'REEL') {
    return item.thumbnail_url || item.media_url || ''
  }
  return item.media_url || ''
}

// --- Component ---

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/insights?days=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Daten konnten nicht geladen werden.
      </div>
    )
  }

  const periods = [7, 14, 30] as const
  const periodLabels: Record<number, string> = { 7: '7 Tage', 14: '14 Tage', 30: '30 Tage' }

  const kpis = [
    { label: 'Aufrufe', value: data.accountInsights.impressions },
    { label: 'Erreichte Konten', value: data.accountInsights.reach },
    { label: 'Interagierte Konten', value: data.accountInsights.accountsEngaged },
    { label: 'Follower', value: data.profile.followers_count },
  ]

  const sortedPosts = [...data.periodMedia].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const topCountries = data.audience.countries.slice(0, 5)
  const maxCountryValue = topCountries.length > 0 ? topCountries[0].value : 1
  const totalCountryValue = data.audience.countries.reduce((s, c) => s + c.value, 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Konto-Insights · @pierrebiege
            </h1>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-gray-200 rounded-2xl p-5"
            >
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {fmt(kpi.value)}
              </div>
              <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* TOP CONTENT */}
        {data.topByImpressions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Beiträge</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {data.topByImpressions.map((item) => (
                <a
                  key={item.id}
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-36 sm:w-40 aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
                    {getThumb(item) ? (
                      <img
                        src={getThumb(item)}
                        alt=""
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                    {(item.media_type === 'VIDEO' || item.media_type === 'REEL') && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                        <Play className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <div className="text-white text-sm font-semibold">
                        {fmt(item.impressions)} Aufrufe
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ALL POSTS GRID */}
        {sortedPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Beiträge</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {sortedPosts.map((item) => (
                <a
                  key={item.id}
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                >
                  {getThumb(item) ? (
                    <img
                      src={getThumb(item)}
                      alt=""
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  {(item.media_type === 'VIDEO' || item.media_type === 'REEL') && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center text-sm font-medium">
                      <div>{fmt(item.impressions)} Aufrufe</div>
                      <div>{fmt(item.like_count)} Likes</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ZIELGRUPPE */}
        {/* AUDIENCE */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zielgruppe</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Countries */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Länder</p>
              {topCountries.length > 0 ? (
                <div className="space-y-2.5">
                  {topCountries.map((c) => {
                    const pct = totalCountryValue > 0 ? (c.value / totalCountryValue) * 100 : 0
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-700">{countryFlag(c.key)} {COUNTRY_NAMES[c.key] || c.key}</span>
                          <span className="font-medium">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${(c.value / maxCountryValue) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-xs text-gray-400">Keine Daten</p>}
            </div>

            {/* Cities */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Städte</p>
              {data.audience.cities && data.audience.cities.length > 0 ? (
                <div className="space-y-2.5">
                  {data.audience.cities.slice(0, 8).map((c) => {
                    const maxCity = data.audience.cities[0]?.value || 1
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-700">{c.key}</span>
                          <span className="font-medium">{fmt(c.value)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-600 rounded-full" style={{ width: `${(c.value / maxCity) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-xs text-gray-400">Keine Daten</p>}
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="mb-12 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Interesse an einer Zusammenarbeit?
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Lass uns gemeinsam etwas bewegen.
            </p>
            <a
              href="mailto:pierre@laeuft.ch"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Kontakt aufnehmen
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-400 pb-8">
          Live Daten von Instagram
        </div>
      </div>
    </div>
  )
}
