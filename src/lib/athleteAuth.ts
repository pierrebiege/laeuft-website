import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Eigenes, leichtgewichtiges Magic-Link-Login für Athlet:innen — bewusst NICHT
// Supabase GoTrue, damit es nicht mit Pierres hand-gerolltem admin_sessions-Login
// kollidiert (sonst kein auth.uid() für den Coach). Pattern wie src/lib/auth.ts.

export const ATHLETE_COOKIE = 'athlete_session'
export const ATHLETE_SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 Tage in Sekunden

export interface AthleteIdentity {
  id: string
  email: string
  name: string | null
}

/** Liest die eingeloggte Athleten-Identität (für Server Components / Layouts). */
export async function getAthleteSession(): Promise<AthleteIdentity | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ATHLETE_COOKIE)?.value
  if (!token) return null
  return lookupSession(token)
}

/** Schutz für API-Routen: liefert { athlete } oder { response: 401 }. */
export async function requireAthlete(
  request: NextRequest
): Promise<{ athlete: AthleteIdentity } | { response: NextResponse }> {
  const token = request.cookies.get(ATHLETE_COOKIE)?.value
  const athlete = token ? await lookupSession(token) : null
  if (!athlete) {
    return {
      response: NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 }),
    }
  }
  return { athlete }
}

async function lookupSession(token: string): Promise<AthleteIdentity | null> {
  const { data } = await supabaseAdmin
    .from('athlete_sessions')
    .select('athlete:athletes(id, email, name)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  const athlete = (data as { athlete: AthleteIdentity | null } | null)?.athlete
  return athlete ?? null
}
