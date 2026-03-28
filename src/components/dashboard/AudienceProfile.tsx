'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { DashboardData } from '@/lib/instagram-types'
import SectionHeading from './SectionHeading'

interface AudienceProfileProps {
  audience: DashboardData['audience']
}

const GENDER_COLORS = { M: '#60a5fa', F: '#f472b6' }
const COUNTRY_FLAGS: Record<string, string> = {
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', FR: '🇫🇷', IT: '🇮🇹', US: '🇺🇸', UK: '🇬🇧', NL: '🇳🇱',
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

export default function AudienceProfile({ audience }: AudienceProfileProps) {
  // Age distribution
  const ageMap = new Map<string, number>()
  for (const item of audience.age_gender) {
    const [, ageRange] = item.dimension_key.split('.')
    ageMap.set(ageRange, (ageMap.get(ageRange) || 0) + item.value)
  }
  const ageData = Array.from(ageMap.entries())
    .map(([range, value]) => ({ range, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .sort((a, b) => {
      const order = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
      return order.indexOf(a.range) - order.indexOf(b.range)
    })

  // Gender split
  let maleTotal = 0
  let femaleTotal = 0
  for (const item of audience.age_gender) {
    if (item.dimension_key.startsWith('M.')) maleTotal += item.value
    else femaleTotal += item.value
  }
  const total = maleTotal + femaleTotal
  const genderData = [
    { name: 'Männlich', value: maleTotal, color: GENDER_COLORS.M },
    { name: 'Weiblich', value: femaleTotal, color: GENDER_COLORS.F },
  ]

  // Top 4 countries
  const countryData = [...audience.country]
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
  const countryTotal = audience.country.reduce((s, c) => s + c.value, 0)

  // Top 4 cities
  const cityData = [...audience.city]
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)

  return (
    <section>
      <SectionHeading title="Zielgruppe" subtitle="Wer folgt" />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Age Distribution */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Altersverteilung</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis dataKey="range" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Split */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Geschlecht</p>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {genderData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {genderData.map((g) => (
                <div key={g.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                  <div>
                    <p className="text-sm text-white font-medium">{g.name}</p>
                    <p className="text-xs text-zinc-500">{((g.value / total) * 100).toFixed(0)}% · {g.value.toLocaleString('de-CH')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top 6 Countries */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Top Länder</p>
          <div className="space-y-2">
            {countryData.map((c) => {
              const pct = (c.value / countryTotal) * 100
              return (
                <div key={c.dimension_key} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{COUNTRY_FLAGS[c.dimension_key] || '🌍'}</span>
                  <span className="text-sm text-zinc-300 w-8">{c.dimension_key}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500 w-12 text-right">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 5 Cities */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Top Städte</p>
          <div className="space-y-2">
            {cityData.map((c, i) => (
              <div key={c.dimension_key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 w-4">{i + 1}.</span>
                  <span className="text-sm text-zinc-300">{c.dimension_key}</span>
                </div>
                <span className="text-xs text-zinc-500">{c.value.toLocaleString('de-CH')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
