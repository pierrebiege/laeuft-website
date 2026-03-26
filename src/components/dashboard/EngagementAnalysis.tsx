'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { Heart, MessageCircle, Bookmark, Share2, Eye } from 'lucide-react'
import type { InstagramMetrics, InstagramPost, DateRange } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'

interface EngagementAnalysisProps {
  metrics: InstagramMetrics[]
  posts: InstagramPost[]
  dateRange: DateRange
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('de-CH') : p.value}
        </p>
      ))}
    </div>
  )
}

const typeBadge: Record<string, string> = {
  REEL: 'bg-purple-500/20 text-purple-300',
  IMAGE: 'bg-blue-500/20 text-blue-300',
  CAROUSEL_ALBUM: 'bg-amber-500/20 text-amber-300',
  VIDEO: 'bg-red-500/20 text-red-300',
}

export default function EngagementAnalysis({ metrics, posts, dateRange }: EngagementAnalysisProps) {
  const filtered = metrics.slice(-dateRange)

  // Engagement rate over time
  const engagementData = filtered
    .filter((_, i) => i % Math.max(1, Math.floor(filtered.length / 30)) === 0)
    .map((m) => ({
      date: formatDateShort(m.date),
      rate: m.engagement_rate || 0,
    }))

  // Engagement breakdown totals from posts
  const totalLikes = posts.reduce((s, p) => s + p.like_count, 0)
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0)
  const totalSaves = posts.reduce((s, p) => s + p.saves_count, 0)
  const totalShares = posts.reduce((s, p) => s + p.shares_count, 0)
  const totalEngagement = totalLikes + totalComments + totalSaves + totalShares

  const breakdownData = [
    { name: 'Likes', value: totalLikes, fill: '#f87171' },
    { name: 'Comments', value: totalComments, fill: '#60a5fa' },
    { name: 'Saves', value: totalSaves, fill: '#fbbf24' },
    { name: 'Shares', value: totalShares, fill: '#34d399' },
  ]

  // Top posts by engagement
  const topPosts = [...posts]
    .sort((a, b) => (b.like_count + b.comments_count + b.saves_count + b.shares_count) - (a.like_count + a.comments_count + a.saves_count + a.shares_count))
    .slice(0, 6)

  return (
    <section>
      <SectionHeading title="Engagement" subtitle="Wie die Community interagiert" />

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Engagement Rate Over Time */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Engagement Rate</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Aufteilung</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {breakdownData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Heart size={10} className="text-red-400" /> {((totalLikes / totalEngagement) * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1"><MessageCircle size={10} className="text-blue-400" /> {((totalComments / totalEngagement) * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1"><Bookmark size={10} className="text-amber-400" /> {((totalSaves / totalEngagement) * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1"><Share2 size={10} className="text-emerald-400" /> {((totalShares / totalEngagement) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Top Posts nach Engagement</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {topPosts.map((post) => (
          <a
            key={post.id}
            href={post.permalink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition-all"
          >
            <div className="aspect-square bg-zinc-800 relative">
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <Eye size={24} />
                </div>
              )}
              <span className={`absolute top-1.5 right-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBadge[post.media_type] || 'bg-zinc-700 text-zinc-300'}`}>
                {post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : post.media_type === 'REEL' ? 'Reel' : post.media_type}
              </span>
            </div>
            <div className="p-2">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="flex items-center gap-0.5"><Heart size={9} /> {post.like_count.toLocaleString('de-CH')}</span>
                <span className="flex items-center gap-0.5"><MessageCircle size={9} /> {post.comments_count}</span>
                <span className="flex items-center gap-0.5"><Bookmark size={9} /> {post.saves_count}</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Reach: {post.reach.toLocaleString('de-CH')}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
