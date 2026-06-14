'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const params = useSearchParams()
  const errorParam = params.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await fetch('/api/athlete/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch {
      // bewusst still — generische Antwort, kein Account-Leak
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
          läuft<span className="text-zinc-400">.</span>
        </div>
        <p className="text-sm text-zinc-500 mb-8">Training mit Pierre</p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-left">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Schau in dein Postfach</p>
              <p className="text-sm text-zinc-500">
                Falls deine Adresse hinterlegt ist, haben wir dir einen Anmelde-Link geschickt.
                Er ist 30 Minuten gültig.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-xs text-zinc-500 hover:underline mt-2"
              >
                Andere Adresse verwenden
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Melde dich mit deiner E-Mail an. Wir schicken dir einen Link — ganz ohne Passwort.
              </p>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.ch"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
              {errorParam && (
                <p className="text-sm text-red-500">
                  {errorParam === 'expired'
                    ? 'Der Link ist abgelaufen oder wurde schon verwendet. Fordere einen neuen an.'
                    : 'Etwas hat nicht geklappt. Bitte fordere einen neuen Link an.'}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gesendet…' : 'Anmelde-Link senden'}
              </button>
            </form>
          )}
        </div>

        <p className="text-[10px] text-zinc-400 mt-6">Powered by <span className="text-zinc-500">läuft.</span></p>
      </div>
    </div>
  )
}

export default function AthleteLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  )
}
