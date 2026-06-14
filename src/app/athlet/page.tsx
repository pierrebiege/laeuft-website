import { redirect } from 'next/navigation'
import { getAthleteSession } from '@/lib/athleteAuth'
import { getAthletePlan } from '@/lib/athletePlan'
import AthleteApp from './AthleteApp'

export const dynamic = 'force-dynamic'

export default async function AthletHome({
  searchParams,
}: {
  searchParams: Promise<{ strava?: string }>
}) {
  const athlete = await getAthleteSession()
  if (!athlete) redirect('/athlet/login')

  const result = await getAthletePlan(athlete.id)
  const sp = await searchParams

  return (
    <AthleteApp
      athleteName={athlete.name}
      plan={result?.plan ?? null}
      initialCompletions={result?.completions ?? []}
      matches={result?.matches ?? []}
      stravaConnected={result?.stravaConnected ?? false}
      lastSync={result?.lastSync ?? null}
      stravaStatus={sp.strava ?? null}
    />
  )
}
