import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const client_id = searchParams.get('client_id')

  let query = supabaseAdmin
    .from('training_plans')
    .select('*, client:clients(*)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (client_id) {
    query = query.eq('client_id', client_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { client_id, title, start_date, weeks_count = 4 } = body

  if (!client_id || !title || !start_date) {
    return NextResponse.json(
      { error: 'client_id, title und start_date sind erforderlich' },
      { status: 400 }
    )
  }

  // Create plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from('training_plans')
    .insert({ client_id, title, start_date })
    .select()
    .single()

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 })
  }

  // Create initial weeks
  const weekRows = Array.from({ length: weeks_count }, (_, i) => ({
    plan_id: plan.id,
    week_number: i + 1,
    label: `Woche ${i + 1}`,
    sort_order: i,
  }))

  const { error: weeksError } = await supabaseAdmin
    .from('training_weeks')
    .insert(weekRows)

  if (weeksError) {
    // Clean up the plan if weeks creation fails
    await supabaseAdmin.from('training_plans').delete().eq('id', plan.id)
    return NextResponse.json({ error: weeksError.message }, { status: 500 })
  }

  // Return the full plan with weeks
  const { data: fullPlan, error: fetchError } = await supabaseAdmin
    .from('training_plans')
    .select('*, client:clients(*), weeks:training_weeks(*)')
    .eq('id', plan.id)
    .order('sort_order', { referencedTable: 'training_weeks', ascending: true })
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(fullPlan)
}
