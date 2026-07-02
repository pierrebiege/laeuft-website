'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useHausBiegePerson } from '../PersonProvider'

export default function NeuesHausPage() {
  const { personKey } = useHausBiegePerson()
  const router = useRouter()

  const [url, setUrl] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [rooms, setRooms] = useState('')
  const [sizeM2, setSizeM2] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadPreview() {
    if (!url) return
    setLoadingPreview(true)
    setError(null)
    try {
      const res = await fetch('/api/haus-biege/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok) {
        setTitle(data.title || '')
        setImageUrl(data.image_url || '')
        setDescription(data.description || '')
      } else {
        setError(data.error || 'Vorschau konnte nicht geladen werden.')
      }
    } catch {
      setError('Vorschau konnte nicht geladen werden.')
    } finally {
      setLoadingPreview(false)
    }
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
          <div className="flex gap-2">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.homegate.ch/..."
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={loadPreview}
              disabled={loadingPreview || !url}
              className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-40 shrink-0"
            >
              <Sparkles size={14} /> {loadingPreview ? 'Lädt…' : 'Vorschau'}
            </button>
          </div>
        </div>

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
            <label className="block text-sm font-medium mb-1">Preis (CHF)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2"
            />
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
