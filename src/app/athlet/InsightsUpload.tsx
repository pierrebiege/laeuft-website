'use client'

import { useState } from 'react'
import { Upload, Check, Loader2 } from 'lucide-react'
import {
  parseGpx,
  parseTcx,
  parseStravaCsv,
  aggregateWeeks,
  type OwnActivity,
  type WeeklyInsight,
} from '@/lib/parseActivities'

function fmtKm(m: number) {
  return (m / 1000).toFixed(1) + ' km'
}
function fmtPace(s: number | null) {
  if (s == null) return '–'
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`
}

async function activitiesFromFile(file: File): Promise<OwnActivity[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.zip')) {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    // activities.csv liegt im Strava-Export im Wurzelverzeichnis
    const entry = Object.values(zip.files).find((f) => f.name.toLowerCase().endsWith('activities.csv'))
    if (!entry) return []
    return parseStravaCsv(await entry.async('string'))
  }
  const text = await file.text()
  if (name.endsWith('.csv')) return parseStravaCsv(text)
  if (name.endsWith('.tcx')) return parseTcx(text)
  if (name.endsWith('.gpx')) {
    const a = parseGpx(text)
    return a ? [a] : []
  }
  return []
}

export default function InsightsUpload({ onSaved }: { onSaved?: () => void }) {
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeks, setWeeks] = useState<WeeklyInsight[] | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setParsing(true)
    setError(null)
    setSaved(false)
    setWeeks(null)
    try {
      const all: OwnActivity[] = []
      for (const f of Array.from(files)) all.push(...(await activitiesFromFile(f)))
      if (all.length === 0) {
        setError('Keine Läufe in der Datei gefunden. Unterstützt: Strava-Export (.zip / activities.csv), .gpx, .tcx.')
      } else {
        setWeeks(aggregateWeeks(all))
      }
    } catch {
      setError('Datei konnte nicht gelesen werden.')
    }
    setParsing(false)
  }

  async function save() {
    if (!weeks || weeks.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/athlete/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks }),
      })
      if (res.ok) {
        setSaved(true)
        setWeeks(null)
        onSaved?.()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d?.error || 'Speichern fehlgeschlagen.')
      }
    } catch {
      setError('Verbindungsfehler.')
    }
    setSaving(false)
  }

  const totalKm = weeks ? weeks.reduce((s, w) => s + w.total_distance_m, 0) : 0
  const totalRuns = weeks ? weeks.reduce((s, w) => s + w.run_count, 0) : 0

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Upload size={16} className="text-zinc-500" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">Eigene Daten hochladen</p>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Lade deinen Trainingsverlauf hoch (Strava-Export <span className="font-medium">.zip</span> /{' '}
        <span className="font-medium">activities.csv</span>, oder einzelne <span className="font-medium">.gpx</span>/
        <span className="font-medium">.tcx</span>). Die Auswertung bleibt dauerhaft erhalten. Deine Dateien werden{' '}
        <span className="font-medium">direkt im Browser</span> ausgewertet – es werden nur die Wochen-Summen gespeichert.
      </p>

      <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
        {parsing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {parsing ? 'Wird gelesen…' : 'Datei(en) wählen'}
        <input
          type="file"
          multiple
          accept=".zip,.csv,.gpx,.tcx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {saved && (
        <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-3">
          <Check size={15} /> Auswertung gespeichert.
        </p>
      )}

      {weeks && weeks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Vorschau · {weeks.length} Wochen · {totalRuns} Läufe · {fmtKm(totalKm)}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {weeks
              .slice()
              .reverse()
              .map((w) => (
                <div key={w.week_start} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-zinc-500">{w.week_start}</span>
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {w.run_count}× · {fmtKm(w.total_distance_m)} · {Math.round(w.total_elevation_m)} hm · {fmtPace(w.avg_pace_s)}
                  </span>
                </div>
              ))}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Bitte kurz prüfen, ob die Zahlen stimmen, dann speichern.</p>
          <button
            onClick={save}
            disabled={saving}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? 'Speichern…' : 'Auswertung speichern'}
          </button>
        </div>
      )}
    </div>
  )
}
