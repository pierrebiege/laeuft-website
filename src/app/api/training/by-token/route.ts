import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// Liefert den Plan zu einem unique_token über die Service-Role — ersetzt den
// direkten anon-Read der alten /training/[token]-Seite, damit die training_*-
// Tabellen für anon gesperrt werden können (nur die EINE getokte Zeile, kein
// Dump aller Pläne). Token bleibt das Bearer-Geheimnis wie bisher.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  if (!token) {
    return NextResponse.json({ error: 'token erforderlich' }, { status: 400 })
  }

  const { data: plan, error } = await supabaseAdmin
    .from('training_plans')
    .select(
      '*, client:clients(id, name, company), weeks:training_weeks(*, sessions:training_sessions(*, exercises:session_exercises(*, exercise:exercises(*))))'
    )
    .eq('unique_token', token)
    .single()

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan nicht gefunden' }, { status: 404 })
  }

  const { data: completions } = await supabaseAdmin
    .from('training_completions')
    .select('*')
    .eq('plan_token', token)

  return NextResponse.json({ plan, completions: completions || [] })
}
