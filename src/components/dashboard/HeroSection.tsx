'use client'

import { Users } from 'lucide-react'
import type { DashboardData } from '@/lib/instagram-types'
import MetricCard from './MetricCard'

interface HeroSectionProps {
  config: DashboardData['config']
  summary: DashboardData['summary']
  dateRange: number
}

export default function HeroSection({ config, summary, dateRange }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/30 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Profile */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex-shrink-0">
            {config.profile_image_url ? (
              <img
                src={config.profile_image_url}
                alt={config.account_name || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Users size={36} />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              {config.hero_headline || config.account_name}
            </h1>
            <p className="text-zinc-400 mt-1 text-sm sm:text-base">
              {config.hero_subtext || config.account_bio}
            </p>
            <p className="text-zinc-600 text-xs mt-1">{config.account_name}</p>
          </div>
        </div>

        {/* KPI Grid - 4 main metrics as requested */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Follower"
            value={summary.current_followers}
            delta={summary.follower_growth}
            deltaLabel={` (${summary.follower_growth_pct > 0 ? '+' : ''}${summary.follower_growth_pct}%)`}
            large
          />
          <MetricCard
            label={`Aufrufe / ${dateRange}d`}
            value={summary.total_views}
            large
          />
          <MetricCard
            label={`Interaktionen / ${dateRange}d`}
            value={summary.total_interactions}
            large
          />
          <MetricCard
            label="Engagement Rate"
            value={`${summary.avg_engagement_rate}%`}
            large
          />
        </div>
      </div>
    </section>
  )
}
