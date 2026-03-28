'use client'

import type { DateRange } from '@/lib/instagram-types'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const options: DateRange[] = [14, 30, 60, 90]

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
      {options.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === range
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {range}d
        </button>
      ))}
    </div>
  )
}
