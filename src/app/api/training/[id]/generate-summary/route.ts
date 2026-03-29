import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const { id: planId } = await params
  const body = await request.json()
  const weekId = body.week_id

  // Fetch plan with client + the specific week with sessions
  const { data: plan } = await supabaseAdmin
    .from('training_plans')
    .select('*, client:clients(name)')
    .eq('id', planId)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan nicht gefunden' }, { status: 404 })
  }

  const { data: week } = await supabaseAdmin
    .from('training_weeks')
    .select('*, sessions:training_sessions(*)')
    .eq('id', weekId)
    .single()

  if (!week) {
    return NextResponse.json({ error: 'Woche nicht gefunden' }, { status: 404 })
  }

  // Build session overview for Claude
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  const sessionOverview = dayNames.map((day, i) => {
    const daySessions = (week.sessions || [])
      .filter((s: { day_of_week: number }) => s.day_of_week === i)
      .map((s: { session_type: string; session_subtype: string; title: string; duration_minutes: number | null }) =>
        `${s.session_type}: ${s.title} (${s.duration_minutes || '?'}min)`
      )
    return daySessions.length > 0 ? `${day}: ${daySessions.join(', ')}` : `${day}: Ruhetag`
  }).join('\n')

  const totalMin = (week.sessions || []).reduce((sum: number, s: { duration_minutes: number | null }) => sum + (s.duration_minutes || 0), 0)
  const sessionCount = (week.sessions || []).length

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Du bist Pierre Biege, ein Ultrarunner und Coach aus dem Wallis. Schreibe eine kurze, motivierende Wochen-Einfuhrung (2-3 Satze) fur deinen Athleten ${plan.client?.name || 'dein Athlet'}.

Plan: ${plan.title}
Woche ${week.week_number} (${week.label || ''})
${sessionOverview}
Total: ${sessionCount} Sessions, ${totalMin} Minuten

Schreibe in deinem Stil: nahbar, direkt, ermutigend, nie belehrend. Erwahne was diese Woche besonders ist (welche Schwerpunkte, was neu dazukommt, worauf zu achten ist). Keine Floskeln. Kurz und echt. Deutsch.`
    }]
  })

  const summary = (message.content[0] as { type: string; text: string }).text

  // Save to week
  await supabaseAdmin
    .from('training_weeks')
    .update({ summary })
    .eq('id', weekId)

  return NextResponse.json({ summary })
}
