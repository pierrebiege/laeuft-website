'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import type { InstagramMetrics, DateRange } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'
import DateRangeSelector from './DateRangeSelector'

interface ReachGrowthChartProps {
  metrics: InstagramMetrics[]
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

type Tab = 'reach' | 'followers' | 'impressions'

const tabs: { key: Tab; label: string }[] = [
  { key: 'reach', label: 'Reichweite' },
  { key: 'followers', label: 'Follower' },
  { key: 'impressions', label: 'Impressions' },
]

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400">{label}</p>
      <p className="text-white font-semibold">{payload[0].value.toLocaleString('de-CH')}</p>
    </div>
  )
}

export default function ReachGrowthChart({ metrics, dateRange, onDateRangeChange }: ReachGrowthChartProps) {
  const [tab, setTab] = useState<Tab>('reach')

  const filtered = metrics.slice(-dateRange)
  const data = filtered.map((m) => ({
    date: formatDateShort(m.date),
    reach: m.reach || 0,
    followers: m.followers_count,
    impressions: m.impressions || 0,
  }))

  const dataKey = tab
  const color = tab === 'followers' ? '#34d399' : tab === 'reach' ? '#60a5fa' : '#fbbf24'

  return (
    <section>
      <SectionHeading title="Reichweite & Wachstum" subtitle="Entwicklung über Zeit">
        <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
      </SectionHeading>

      {/* Tab selector */}
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === t.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${tab}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
              interval={Math.floor(filtered.length / 6)}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatNumber}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${tab})`}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
