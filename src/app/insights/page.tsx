'use client'

import { useState } from 'react'
import { Users, Mail, ArrowRight } from 'lucide-react'

type Period = '7' | '14' | '30'

const DATA: Record<Period, {
  aufrufe: number
  erreichte_konten: number
  follower_pct: number
  nicht_follower_pct: number
  interaktionen: number
  inter_follower_pct: number
  inter_nicht_follower_pct: number
  stories_pct: number
  reels_pct: number
  beitraege_pct: number
  neue_follower: number
}> = {
  '7': {
    aufrufe: 301582,
    erreichte_konten: 44492,
    follower_pct: 66.5,
    nicht_follower_pct: 33.5,
    interaktionen: 5500,
    inter_follower_pct: 87,
    inter_nicht_follower_pct: 13,
    stories_pct: 55.3,
    reels_pct: 38.8,
    beitraege_pct: 5.9,
    neue_follower: 120,
  },
  '14': {
    aufrufe: 515160,
    erreichte_konten: 54822,
    follower_pct: 68.3,
    nicht_follower_pct: 31.7,
    interaktionen: 8282,
    inter_follower_pct: 88.5,
    inter_nicht_follower_pct: 11.5,
    stories_pct: 54.3,
    reels_pct: 40.0,
    beitraege_pct: 5.7,
    neue_follower: 210,
  },
  '30': {
    aufrufe: 948301,
    erreichte_konten: 82184,
    follower_pct: 67.2,
    nicht_follower_pct: 32.8,
    interaktionen: 16333,
    inter_follower_pct: 86.5,
    inter_nicht_follower_pct: 13.5,
    stories_pct: 53.0,
    reels_pct: 43.4,
    beitraege_pct: 3.6,
    neue_follower: 354,
  },
}

const TOP_REELS = [
  { title: 'POV: Durch Berlin', likes: 930, date: '25. März' },
  { title: 'Behaltet dieses Reel', likes: 832, date: '13. März' },
  { title: 'Class de Quévy', likes: 830, date: '11. März' },
  { title: 'Das Fünfti', likes: 762, date: '6. März' },
]

const INTERAKTIONEN_30D = [
  { label: 'Gefällt mir', value: 13258 },
  { label: 'Geteilt', value: 420 },
  { label: 'Kommentare', value: 385 },
  { label: 'Gespeichert', value: 308 },
  { label: 'Reposts', value: 115 },
]

function fmt(n: number) {
  return n.toLocaleString('de-CH')
}

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>('30')
  const d = DATA[period]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-zinc-600">
            <Users size={32} />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Pierre Biege</h1>
            <p className="text-zinc-400 text-sm mt-0.5">@pierrebiege · Ultrarunner · Content Creator</p>
            <p className="text-zinc-600 text-xs mt-0.5">18'200 Follower · 238 Inhalte / 30d</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {(['7', '14', '30'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                period === p
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {p === '30' ? '30 Tage' : p === '14' ? '14 Tage' : '7 Tage'}
            </button>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Follower</p>
            <p className="text-2xl font-black text-white mt-1">18'200</p>
            <p className="text-xs text-emerald-400 mt-0.5">+{fmt(d.neue_follower)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Aufrufe</p>
            <p className="text-2xl font-black text-white mt-1">{fmt(d.aufrufe)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Interaktionen</p>
            <p className="text-2xl font-black text-white mt-1">{fmt(d.interaktionen)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Engagement</p>
            <p className="text-2xl font-black text-white mt-1">1.72%</p>
          </div>
        </div>

        {/* Aufrufe Detail — Instagram Style */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Aufrufe */}
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white">{fmt(d.aufrufe)}</p>
              <p className="text-xs text-zinc-500 mt-0.5 mb-5">Aufrufe</p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Follower</span>
                  <span className="text-sm font-semibold text-white">{d.follower_pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Nicht-Follower</span>
                  <span className="text-sm font-semibold text-white">{d.nicht_follower_pct}%</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Erreichte Konten</span>
                  <span className="text-lg font-bold text-white">{fmt(d.erreichte_konten)}</span>
                </div>
              </div>
            </div>

            {/* Right: Nach Content-Art */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Nach Content-Art</p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-300">Stories</span>
                    <span className="text-sm text-zinc-400">{d.stories_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${d.stories_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-300">Reels</span>
                    <span className="text-sm text-zinc-400">{d.reels_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600" style={{ width: `${d.reels_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-300">Beiträge</span>
                    <span className="text-sm text-zinc-400">{d.beitraege_pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-700" style={{ width: `${Math.max(d.beitraege_pct, 2)}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fuchsia-500" /> Follower</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600" /> Nicht-Follower</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interaktionen */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-white mb-1">{fmt(d.interaktionen)} Interaktionen</p>
          <p className="text-xs text-zinc-500 mb-4">Follower {d.inter_follower_pct}% · Nicht-Follower {d.inter_nicht_follower_pct}%</p>

          {period === '30' && (
            <div className="space-y-2">
              {INTERAKTIONEN_30D.map((item) => {
                const maxVal = INTERAKTIONEN_30D[0].value
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-24">{item.label}</span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(item.value / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 w-14 text-right">{fmt(item.value)}</span>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-[10px] text-zinc-600 mt-3">Interaktionen nach Format: Reels 62.3% · Stories 33.1% · Beiträge 4.6%</p>
        </section>

        {/* Top Reels */}
        <section>
          <p className="text-sm font-semibold text-white mb-3">Top Reels</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOP_REELS.map((reel, i) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-400 font-medium line-clamp-2">{reel.title}</p>
                <p className="text-lg font-bold text-white mt-2">{fmt(reel.likes)}</p>
                <p className="text-[10px] text-zinc-600">Likes · {reel.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Zielgruppe */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sm:p-6">
          <p className="text-sm font-semibold text-white mb-4">Zielgruppe</p>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Länder */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Länder</p>
              <div className="space-y-1.5">
                {[
                  { flag: '🇨🇭', name: 'Schweiz', pct: 53.5 },
                  { flag: '🇩🇪', name: 'Deutschland', pct: 38.2 },
                  { flag: '🇦🇹', name: 'Österreich', pct: 5.7 },
                  { flag: '🇱🇺', name: 'Luxemburg', pct: 0.5 },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">{c.flag} {c.name}</span>
                    <span className="text-xs font-medium text-zinc-400">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alter */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Alter</p>
              <div className="space-y-1.5">
                {[
                  { range: '25–34', pct: 40.6 },
                  { range: '18–24', pct: 22.0 },
                  { range: '35–44', pct: 21.3 },
                  { range: '13–17', pct: 6.9 },
                ].map((a) => (
                  <div key={a.range} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">{a.range}</span>
                    <span className="text-xs font-medium text-zinc-400">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geschlecht */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Geschlecht</p>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300">Männlich</span>
                    <span className="text-xs font-medium text-zinc-400">70.8%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '70.8%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300">Weiblich</span>
                    <span className="text-xs font-medium text-zinc-400">29.2%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: '29.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 mt-4">DACH-Region: 97.4% der Follower</p>
        </section>

        {/* Partner Logos */}
        <section>
          <p className="text-sm font-semibold text-white mb-4">Partner</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 py-6 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {['SPONSER', 'feels.like', 'DRYLL', 'Scott Sports'].map((name) => (
              <span key={name} className="text-sm font-bold text-zinc-500 hover:text-white transition-colors tracking-wider uppercase">
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-10">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Interesse an einer Zusammenarbeit?</h2>
          <p className="text-zinc-500 text-sm mb-5">Lass uns gemeinsam etwas bewegen.</p>
          <a
            href="mailto:pierre@laeuft.ch"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <Mail size={16} />
            Kontakt aufnehmen
            <ArrowRight size={14} />
          </a>
        </section>

        {/* Footer */}
        <footer className="text-center pb-6 pt-3 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-700">
            Powered by <span className="text-zinc-500">läuft.</span> · Daten: 26. Feb. – 27. März 2026
          </p>
        </footer>
      </main>
    </div>
  )
}
