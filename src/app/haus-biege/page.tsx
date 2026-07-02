'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Plus, Users } from 'lucide-react'
import { useHausBiegePerson } from './PersonProvider'
import { HausBiegeHouse, voteAverage } from '@/lib/hausBiege'

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-zinc-400 text-sm">Noch keine Bewertung</span>
  return (
    <span className="inline-flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} fill={i < Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
      <span className="text-zinc-500 text-sm ml-1">{value.toFixed(1)}</span>
    </span>
  )
}

export default function HausBiegePage() {
  const { personName, changePerson } = useHausBiegePerson()
  const [houses, setHouses] = useState<HausBiegeHouse[] | null>(null)

  useEffect(() => {
    fetch('/api/haus-biege/houses')
      .then((r) => r.json())
      .then(setHouses)
  }, [])

  const sorted = [...(houses || [])].sort((a, b) => {
    const avgA = voteAverage(a.votes).avg
    const avgB = voteAverage(b.votes).avg
    if (avgA === null && avgB === null) return 0
    if (avgA === null) return 1
    if (avgB === null) return -1
    return avgB - avgA
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🏠 Haus-Check Familie Biege</h1>
          <p className="text-zinc-500 text-sm">
            Hallo {personName} ·{' '}
            <button onClick={changePerson} className="underline underline-offset-2">
              Person wechseln
            </button>
          </p>
        </div>
        <Link
          href="/haus-biege/neu"
          className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition shrink-0"
        >
          <Plus size={16} /> Haus
        </Link>
      </div>

      {houses === null && <p className="text-zinc-400">Lädt…</p>}
      {houses !== null && houses.length === 0 && (
        <p className="text-zinc-500">Noch kein Haus erfasst — leg direkt los.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((house) => {
          const { avg, count } = voteAverage(house.votes)
          return (
            <Link
              key={house.id}
              href={`/haus-biege/${house.id}`}
              className="rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-md transition flex flex-col"
            >
              <div className="h-40 bg-zinc-100">
                {house.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={house.image_url} alt={house.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-4xl">🏠</div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <h2 className="font-medium leading-snug">{house.title}</h2>
                {house.location && <p className="text-sm text-zinc-500">{house.location}</p>}
                <div className="flex flex-wrap gap-1.5 text-xs text-zinc-600">
                  {house.price != null && (
                    <span className="bg-zinc-100 rounded-full px-2 py-0.5">
                      CHF {Number(house.price).toLocaleString('de-CH')}
                    </span>
                  )}
                  {house.rooms != null && (
                    <span className="bg-zinc-100 rounded-full px-2 py-0.5">{house.rooms} Zimmer</span>
                  )}
                  {house.size_m2 != null && (
                    <span className="bg-zinc-100 rounded-full px-2 py-0.5">{house.size_m2} m²</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <Stars value={avg} />
                  {count > 0 && (
                    <span className="text-xs text-zinc-400 inline-flex items-center gap-1">
                      <Users size={12} /> {count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
