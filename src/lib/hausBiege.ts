export interface HausBiegePerson {
  key: string
  name: string
  household: string | null
}

export const HAUS_BIEGE_PEOPLE: HausBiegePerson[] = [
  { key: 'flo-tina', name: 'Flo & Tina', household: null },
  { key: 'hannes-nico', name: 'Hannes & Nico', household: '2 Kids' },
  { key: 'cano-caro', name: 'Cano & Caro', household: '3 Kids' },
  { key: 'yves', name: 'Yves', household: null },
  { key: 'luc-maria', name: 'Luc & Maria', household: null },
  { key: 'pierre-lea', name: 'Pierre & Lea', household: '3 Kids' },
  { key: 'bernadette', name: 'Bernadette', household: null },
]

export function personName(key: string): string {
  return HAUS_BIEGE_PEOPLE.find((p) => p.key === key)?.name ?? key
}

export interface HausBiegeVote {
  id: string
  house_id: string
  person_key: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export const SUPPORTED_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP'] as const
export type HausBiegeCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<HausBiegeCurrency, string> = {
  EUR: '€',
  CHF: 'CHF',
  USD: '$',
  GBP: '£',
}

export function formatPrice(price: number | string, currency: string): string {
  const num = Number(price)
  const locale = currency === 'CHF' ? 'de-CH' : 'de-DE'
  const formatted = num.toLocaleString(locale)
  const symbol = CURRENCY_SYMBOLS[currency as HausBiegeCurrency] ?? currency
  return currency === 'CHF' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`
}

export interface HausBiegeHouse {
  id: string
  url: string
  title: string
  image_url: string | null
  description: string | null
  price: number | null
  currency: string
  rooms: number | null
  size_m2: number | null
  location: string | null
  notes: string | null
  added_by: string
  created_at: string
  updated_at: string
  votes?: HausBiegeVote[]
}

export function voteAverage(votes: HausBiegeVote[] | undefined): { avg: number | null; count: number } {
  if (!votes || votes.length === 0) return { avg: null, count: 0 }
  const sum = votes.reduce((acc, v) => acc + v.rating, 0)
  return { avg: sum / votes.length, count: votes.length }
}
