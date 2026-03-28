'use client'

import { useState, useEffect } from 'react'
import type { DashboardData, DateRange } from '@/lib/instagram-types'
import { getMockDashboardData } from '@/lib/instagram-mock'
import HeroSection from '@/components/dashboard/HeroSection'
import ViewsBreakdown from '@/components/dashboard/ViewsBreakdown'
import ReachGrowthChart from '@/components/dashboard/ReachGrowthChart'
import EngagementAnalysis from '@/components/dashboard/EngagementAnalysis'
import AudienceProfile from '@/components/dashboard/AudienceProfile'
import ContentGallery from '@/components/dashboard/ContentGallery'
import PartnerLogos from '@/components/dashboard/PartnerLogos'
import ContactCTA from '@/components/dashboard/ContactCTA'

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export default function InsightsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (useMock) {
          setData(getMockDashboardData(90))
        } else {
          const res = await fetch('/api/insights')
          if (res.ok) {
            setData(await res.json())
          } else {
            setData(getMockDashboardData(90))
          }
        }
      } catch {
        setData(getMockDashboardData(90))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredData = data ? getFilteredData(data, dateRange) : null

  if (loading || !filteredData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
      <HeroSection config={filteredData.config} summary={filteredData.summary} dateRange={dateRange} />
      <ViewsBreakdown summary={filteredData.summary} posts={filteredData.posts} />
      <ReachGrowthChart metrics={filteredData.metrics} dateRange={dateRange} onDateRangeChange={setDateRange} />
      <EngagementAnalysis metrics={filteredData.metrics} posts={filteredData.posts} dateRange={dateRange} />
      <AudienceProfile audience={filteredData.audience} />
      <ContentGallery posts={filteredData.posts} />
      <PartnerLogos logos={filteredData.config.partner_logos} />
      <ContactCTA config={filteredData.config} />

      <footer className="text-center pb-8 pt-4 border-t border-zinc-900">
        <p className="text-[10px] text-zinc-700">
          Powered by <span className="text-zinc-500">läuft.</span> · Daten werden täglich aktualisiert
        </p>
      </footer>
    </main>
  )
}

function getFilteredData(data: DashboardData, dateRange: DateRange): DashboardData {
  const metrics = data.metrics.slice(-dateRange)
  if (metrics.length < 2) return data

  const latest = metrics[metrics.length - 1]
  const oldest = metrics[0]
  const followerGrowth = latest.followers_count - oldest.followers_count
  const followerGrowthPct = parseFloat((followerGrowth / oldest.followers_count * 100).toFixed(2))
  const avgEngagement = parseFloat(
    (metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / metrics.length).toFixed(2)
  )
  const avgReach = Math.round(
    metrics.reduce((sum, m) => sum + (m.reach || 0), 0) / metrics.length
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - dateRange)
  const posts = data.posts.filter(p => new Date(p.timestamp) >= cutoff)
  const weeks = dateRange / 7

  return {
    ...data,
    metrics,
    posts: posts.length > 0 ? posts : data.posts,
    summary: {
      ...data.summary,
      current_followers: latest.followers_count,
      follower_growth: followerGrowth,
      follower_growth_pct: followerGrowthPct,
      avg_engagement_rate: avgEngagement,
      avg_reach: avgReach,
      total_views: Math.round(data.summary.total_views * (dateRange / 90)),
      total_interactions: Math.round(data.summary.total_interactions * (dateRange / 90)),
      reached_accounts: Math.round(data.summary.reached_accounts * (dateRange / 90)),
      total_posts_period: posts.length,
      posts_per_week: parseFloat((posts.length / weeks).toFixed(1)),
    },
  }
}
