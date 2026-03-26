'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  suffix?: string
  large?: boolean
}

export default function MetricCard({ label, value, delta, deltaLabel, suffix, large }: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 sm:p-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className={`font-bold tracking-tight text-white ${large ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
        {typeof value === 'number' ? value.toLocaleString('de-CH') : value}
        {suffix && <span className="text-zinc-500 text-sm ml-1">{suffix}</span>}
      </p>
      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{typeof delta === 'number' && delta % 1 !== 0 ? delta.toFixed(1) : delta}{deltaLabel || ''}</span>
        </div>
      )}
    </div>
  )
}
