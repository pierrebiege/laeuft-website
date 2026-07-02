'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { HAUS_BIEGE_PEOPLE, personName as lookupPersonName } from '@/lib/hausBiege'

const STORAGE_KEY = 'haus-biege-person'

interface HausBiegePersonContextValue {
  personKey: string
  personName: string
  changePerson: () => void
}

const PersonContext = createContext<HausBiegePersonContextValue | null>(null)

export function useHausBiegePerson(): HausBiegePersonContextValue {
  const ctx = useContext(PersonContext)
  if (!ctx) throw new Error('useHausBiegePerson must be used inside HausBiegeProvider')
  return ctx
}

export function HausBiegeProvider({ children }: { children: React.ReactNode }) {
  const [personKey, setPersonKey] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPersonKey(window.localStorage.getItem(STORAGE_KEY))
    setReady(true)
  }, [])

  if (!ready) return null

  if (!personKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-center mb-1">🏠 Haus-Check</h1>
          <p className="text-center text-zinc-500 mb-6">Familie Biege — wer bist du?</p>
          <div className="flex flex-col gap-2">
            {HAUS_BIEGE_PEOPLE.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  window.localStorage.setItem(STORAGE_KEY, p.key)
                  setPersonKey(p.key)
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition"
              >
                <span className="font-medium">{p.name}</span>
                {p.household && <span className="text-zinc-400 text-sm"> · {p.household}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PersonContext.Provider
      value={{
        personKey,
        personName: lookupPersonName(personKey),
        changePerson: () => {
          window.localStorage.removeItem(STORAGE_KEY)
          setPersonKey(null)
        },
      }}
    >
      {children}
    </PersonContext.Provider>
  )
}
