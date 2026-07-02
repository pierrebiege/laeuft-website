'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useHausBiegePerson } from '../PersonProvider'
import { HAUS_BIEGE_PEOPLE, HausBiegeHouse, voteAverage, formatPrice, SUPPORTED_CURRENCIES } from '@/lib/hausBiege'

interface EditForm {
  url: string
  title: string
  imageUrl: string
  description: string
  price: string
  currency: string
  rooms: string
  sizeM2: string
  location: string
  notes: string
}

function toEditForm(house: HausBiegeHouse): EditForm {
  return {
    url: house.url,
    title: house.title,
    imageUrl: house.image_url ?? '',
    description: house.description ?? '',
    price: house.price != null ? String(house.price) : '',
    currency: house.currency || 'EUR',
    rooms: house.rooms != null ? String(house.rooms) : '',
    sizeM2: house.size_m2 != null ? String(house.size_m2) : '',
    location: house.location ?? '',
    notes: house.notes ?? '',
  }
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="text-amber-500">
          <Star size={24} fill={n <= value ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

export default function HausDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { personKey, personName: myName } = useHausBiegePerson()

  const [house, setHouse] = useState<HausBiegeHouse | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [savingVote, setSavingVote] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/haus-biege/houses/${id}`)
    if (!res.ok) {
      setNotFound(true)
      return
    }
    const data: HausBiegeHouse = await res.json()
    setHouse(data)
    const mine = data.votes?.find((v) => v.person_key === personKey)
    setMyRating(mine?.rating ?? 0)
    setMyComment(mine?.comment ?? '')
  }, [id, personKey])

  useEffect(() => {
    load()
  }, [load])

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-zinc-500">Haus nicht gefunden.</p>
        <Link href="/haus-biege" className="underline underline-offset-2 text-sm">
          Zurück zur Liste
        </Link>
      </div>
    )
  }

  if (house === null) return <div className="max-w-2xl mx-auto px-4 py-8 text-zinc-400">Lädt…</div>

  const { avg, count } = voteAverage(house.votes)

  function startEditing() {
    if (!house) return
    setForm(toEditForm(house))
    setEditing(true)
  }

  async function saveEdit() {
    if (!form) return
    await fetch(`/api/haus-biege/houses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: form.url,
        title: form.title,
        image_url: form.imageUrl || null,
        description: form.description || null,
        price: form.price ? Number(form.price) : null,
        currency: form.currency,
        rooms: form.rooms ? Number(form.rooms) : null,
        size_m2: form.sizeM2 ? Number(form.sizeM2) : null,
        location: form.location || null,
        notes: form.notes || null,
      }),
    })
    setEditing(false)
    load()
  }

  async function deleteHouse() {
    if (!confirm('Dieses Haus wirklich löschen?')) return
    await fetch(`/api/haus-biege/houses/${id}`, { method: 'DELETE' })
    router.push('/haus-biege')
  }

  async function saveVote() {
    if (myRating < 1) return
    setSavingVote(true)
    await fetch(`/api/haus-biege/houses/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_key: personKey, rating: myRating, comment: myComment }),
    })
    setSavingVote(false)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link href="/haus-biege" className="inline-flex items-center gap-1 text-sm text-zinc-500">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="flex gap-3">
          <button onClick={editing ? () => setEditing(false) : startEditing} className="inline-flex items-center gap-1 text-sm text-zinc-500">
            <Pencil size={14} /> {editing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
          <button onClick={deleteHouse} className="inline-flex items-center gap-1 text-sm text-red-600">
            <Trash2 size={14} /> Löschen
          </button>
        </div>
      </div>

      {house.image_url && !editing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={house.image_url} alt={house.title} className="w-full h-56 object-cover rounded-2xl mb-4" />
      )}

      {!editing || !form ? (
        <>
          <h1 className="text-2xl font-semibold mb-1">{house.title}</h1>
          {house.location && <p className="text-zinc-500 mb-3">{house.location}</p>}
          <div className="flex flex-wrap gap-2 text-sm text-zinc-600 mb-4">
            {house.price != null && (
              <span className="bg-zinc-100 rounded-full px-3 py-1">{formatPrice(house.price, house.currency)}</span>
            )}
            {house.rooms != null && <span className="bg-zinc-100 rounded-full px-3 py-1">{house.rooms} Zimmer</span>}
            {house.size_m2 != null && <span className="bg-zinc-100 rounded-full px-3 py-1">{house.size_m2} m²</span>}
          </div>
          {house.description && <p className="text-zinc-700 mb-4 whitespace-pre-wrap">{house.description}</p>}
          {house.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-zinc-700 mb-4">
              <strong>Notizen:</strong> {house.notes}
            </div>
          )}
          <a
            href={house.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2 mb-6"
          >
            Original-Inserat ansehen <ExternalLink size={14} />
          </a>
        </>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titel"
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ort"
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Preis"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 min-w-0"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="border border-zinc-300 rounded-lg px-2 py-2 text-sm shrink-0"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.5"
              value={form.rooms}
              onChange={(e) => setForm({ ...form, rooms: e.target.value })}
              placeholder="Zimmer"
              className="border border-zinc-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              value={form.sizeM2}
              onChange={(e) => setForm({ ...form, sizeM2: e.target.value })}
              placeholder="m²"
              className="border border-zinc-300 rounded-lg px-3 py-2"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Beschreibung"
            rows={3}
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notizen"
            rows={2}
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Bild-URL"
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Link zum Inserat"
            className="border border-zinc-300 rounded-lg px-3 py-2"
          />
          <button onClick={saveEdit} className="bg-zinc-900 text-white rounded-full px-4 py-2 font-medium w-fit">
            Speichern
          </button>
        </div>
      )}

      <div className="border-t border-zinc-200 pt-5 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{avg !== null ? avg.toFixed(1) : '–'}</span>
          <span className="text-zinc-400 text-sm">
            Ø aus {count} {count === 1 ? 'Bewertung' : 'Bewertungen'}
          </span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-4 mb-6">
        <h2 className="font-medium mb-3">Deine Bewertung ({myName})</h2>
        <StarPicker value={myRating} onChange={setMyRating} />
        <textarea
          value={myComment}
          onChange={(e) => setMyComment(e.target.value)}
          placeholder="Kommentar (optional)"
          rows={2}
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 mt-3"
        />
        <button
          onClick={saveVote}
          disabled={myRating < 1 || savingVote}
          className="mt-3 bg-amber-500 text-white rounded-full px-4 py-2 font-medium disabled:opacity-40"
        >
          {savingVote ? 'Speichert…' : 'Bewertung speichern'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {HAUS_BIEGE_PEOPLE.map((p) => {
          const vote = house.votes?.find((v) => v.person_key === p.key)
          return (
            <div key={p.key} className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                {vote?.comment && <p className="text-sm text-zinc-500">{vote.comment}</p>}
              </div>
              {vote ? (
                <span className="inline-flex items-center gap-1 text-amber-500 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < vote.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  ))}
                </span>
              ) : (
                <span className="text-xs text-zinc-300 shrink-0">noch offen</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
