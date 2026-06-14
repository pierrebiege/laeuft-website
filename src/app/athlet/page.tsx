import { redirect } from 'next/navigation'
import { getAthleteSession } from '@/lib/athleteAuth'
import { getAthletePlan } from '@/lib/athletePlan'
import AthleteApp from './AthleteApp'

export const dynamic = 'force-dynamic'

export default async function AthletHome() {
  const athlete = await getAthleteSession()
  if (!athlete) redirect('/athlet/login')

  const result = await getAthletePlan(athlete.id)

  return (
    <AthleteApp
      athleteName={athlete.name}
      plan={result?.plan ?? null}
      initialCompletions={result?.completions ?? []}
    />
  )
}
