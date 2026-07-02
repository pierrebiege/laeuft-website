'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { useHausBiegePerson } from '../PersonProvider'
import { SUPPORTED_CURRENCIES } from '@/lib/hausBiege'

export default function NeuesHausPage() {
  const { personKey } = useHausBiegePerson()
  const router = useRouter()

  const [url, setUrl] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [rooms, setRooms] = useState('')
  const [sizeM2, setSizeM2] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const lastFetchedUrl = useRef<string | null>(null)

  async function loadPreview(candidateUrl: string) {
    if (!candidateUrl || candidateUrl === lastFetchedUrl.current) return
    lastFetchedUrl.current = candidateUrl
    setLoadingPreview(true)
    setError(null)
    setBlockedMessage(null)
    try {
      const res = await fetch('/api/haus-biege/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: candidateUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        setTitle(data.title || '')
        setImageUrl(data.image_url || '')
        setDescription(data.description || '')
        if (data.price != null) setPrice(String(data.price))
        if (data.currency) setCurrency(data.currency)
        if (data.rooms != null) setRooms(String(data.rooms))
        if (data.size_m2 != null) setSizeM2(String(data.size_m2))
        if (data.location) setLocation(data.location)
        if (data.blocked) setBlockedMessage(data.message)
      } else {
        setError(data.error || 'Vorschau konnte nicht geladen werden.')
      }
    } catch {
      setError('Vorschau konnte nicht geladen werden.')
    } finally {
      setLoadingPreview(false)
    }
  }

  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted) {
      setUrl(pasted)
      loadPreview(pasted)
    }
  }

  function handleUrlBlur() {
    loadPreview(url.trim())
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!url) {
      setError('Link fehlt.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/haus-biege/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          title,
          image_url: imageUrl || null,
          description: description || null,
          price: price ? Number(price) : null,
          currency,
          rooms: rooms ? Number(rooms) : null,
          size_m2: sizeM2 ? Number(sizeM2) : null,
          location: location || null,
          notes: notes || null,
          added_by: personKey,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fehler beim Speichern.')
        setSubmitting(false)
        return
      }
      router.push(`/haus-biege/${data.id}`)
    } catch {
      setError('Fehler beim Speichern.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/haus-biege" className="inline-flex items-center gap-1 text-sm text-zinc-500 mb-4">
        <ArrowLeft size={16} /> Zurück
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Haus hinzufügen</h1>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Link zum Inserat</label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handleUrlPaste}
            onBlur={handleUrlBlur}
            placeholder="https://www.homegate.ch/..."
            className="w-full border border-zinc-300 rounded-lg px-3 py-2"
          />
          <p className="text-xs text-zinc-400 mt-1">
            {loadingPreview ? 'Lädt automatisch alles, was von der Seite verfügbar ist…' : 'Wird beim Einfügen automatisch ausgelesen.'}
          </p>
        </div>

        {blockedMessage && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <TriangleAlert size={16} className="shrink-0 mt-0.5" />
            <span>{blockedMessage}</span>
          </div>
        )}

        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-lg" />
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preis</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 min-w-0"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border border-zinc-300 rounded-lg px-2 py-2 text-sm shrink-0"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ort</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zimmer</label>
            <input
              type="number"
              step="0.5"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grösse (m²)</label>
            <input
              type="number"
              value={sizeM2}
              onChange={(e) => setSizeM2(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-amber-500 text-white rounded-full px-4 py-2.5 font-medium hover:bg-amber-600 transition disabled:opacity-50"
        >
          {submitting ? 'Speichert…' : 'Haus speichern'}
        </button>
      </form>
    </div>
  )
}
