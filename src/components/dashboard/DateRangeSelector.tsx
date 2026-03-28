'use client'

import type { DateRange } from '@/lib/instagram-types'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const options: { value: DateRange; label: string }[] = [
  { value: 7, label: '7 Tage' },
  { value: 14, label: '14 Tage' },
  { value: 30, label: '30 Tage' },
]

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === opt.value
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
