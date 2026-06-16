import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { syncAthlete } from '@/lib/stravaSync'
import { purgeOldStravaActivities } from '@/lib/stravaInsights'

export const dynamic = 'force-dynamic'

// Abend-Cron: zieht für alle verbundenen Athlet:innen neue Strava-Läufe und
// matcht sie gegen den Plan. Webhook (Echtzeit) folgt später als Politur.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { data: conns } = await supabaseAdmin.from('strava_connections').select('athlete_id')

  let imported = 0
  let matched = 0
  for (const c of conns || []) {
    try {
      const r = await syncAthlete(c.athlete_id)
      if (r) {
        imported += r.imported
        matched += r.matched
      }
    } catch (err) {
      console.error('strava-sync error for athlete', c.athlete_id, err)
    }
  }

  // Aufbewahrung (Strava 7-Tage-Regel): Roh-Aktivitäten >7 Tage löschen.
  // Die dauerhafte Auswertung (athlete_insights) wird NICHT aus API-Daten
  // gespeist (Derivate aus API-Daten bleiben "Strava Data"), sondern aus
  // Athleten-Upload (eigene Daten). Die API ist nur ephemerer ≤7-Tage-Kanal
  // fürs Live-Matching geplant-vs-gelaufen.
  let purged = 0
  try {
    purged = await purgeOldStravaActivities()
  } catch (err) {
    console.error('purge übersprungen:', err)
  }

  return NextResponse.json({ ok: true, connections: (conns || []).length, imported, matched, purged })
}
