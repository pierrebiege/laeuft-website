import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { getTodaysSessions } from '@/lib/trainingHelper'
import { SESSION_TYPE_LABELS, TrainingPlan, TrainingWeek } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Cron security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anthropic = new Anthropic()
  const results: { client: string; status: string }[] = []

  // Fetch all active/sent training plans with client info and completions
  const { data: plans, error } = await supabaseAdmin
    .from('training_plans')
    .select(
      '*, client:clients(*), weeks:training_weeks(*, sessions:training_sessions(*, completion:training_completions(*)))'
    )
    .in('status', ['sent', 'active'])
    .order('sort_order', {
      referencedTable: 'training_weeks',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'training_weeks.training_sessions',
      ascending: true,
    })

  if (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  for (const plan of plans || []) {
    const client = plan.client
    if (!client?.phone) {
      results.push({ client: client?.name || 'unknown', status: 'no phone' })
      continue
    }

    const { sessions, dayOfWeek } = getTodaysSessions(
      plan as TrainingPlan,
      (plan.weeks || []) as TrainingWeek[]
    )

    if (sessions.length === 0) {
      // No sessions today, skip evening message
      results.push({ client: client.name, status: 'rest_day_skipped' })
      continue
    }

    // Determine completion status for each session
    const sessionDetails = sessions.map((s) => {
      const type = SESSION_TYPE_LABELS[s.session_type] || s.session_type
      const duration = s.duration_minutes
        ? ` (${s.duration_minutes} Min.)`
        : ''

      // Check if completed today
      const isCompleted =
        s.completion &&
        (Array.isArray(s.completion)
          ? s.completion.some((c) => c.completed_at?.startsWith(todayStr))
          : s.completion.completed_at?.startsWith(todayStr))

      return {
        label: `${type}: ${s.title}${duration}`,
        completed: !!isCompleted,
      }
    })

    const completedCount = sessionDetails.filter((s) => s.completed).length
    const totalCount = sessionDetails.length

    const completedList = sessionDetails
      .map((s) => `- ${s.completed ? '[x]' : '[ ]'} ${s.label}`)
      .join('\n')

    // Generate message with Claude Haiku
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-20250414',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Du bist Pierre Biege, Coach. Schreibe eine kurze WhatsApp-Abendnachricht an ${client.name}.

Heute war geplant:
${sessionDetails.map((s) => `- ${s.label}`).join('\n')}

Davon erledigt: ${completedCount}/${totalCount}
${completedList}

Wenn alles erledigt: Gratuliere kurz und echt. "Jeder Schritt zählt."
Wenn nicht alles: Ermutige sanft, kein Vorwurf. "Auch Ruhe ist Training."
Wenn nichts: Verständnisvoll, morgen ist ein neuer Tag.

Stil: WhatsApp-kurz, nahbar, nie belehrend. 2-3 Sätze max. Deutsch.`,
          },
        ],
      })

      const message =
        response.content[0].type === 'text' ? response.content[0].text : ''

      if (message) {
        const waResult = await sendWhatsAppMessage(client.phone, message)
        results.push({
          client: client.name,
          status: waResult ? 'sent' : 'whatsapp_error',
        })
      } else {
        results.push({ client: client.name, status: 'empty_message' })
      }
    } catch (err) {
      console.error(`Error generating message for ${client.name}:`, err)
      results.push({ client: client.name, status: 'ai_error' })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  })
}
