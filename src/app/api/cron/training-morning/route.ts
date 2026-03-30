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

  // Fetch all active/sent training plans with client info
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

    // Build session list for prompt
    let sessionsList: string
    if (sessions.length === 0) {
      sessionsList = 'Heute ist Ruhetag - kein Training geplant.'
    } else {
      sessionsList = sessions
        .map((s) => {
          const type = SESSION_TYPE_LABELS[s.session_type] || s.session_type
          const duration = s.duration_minutes
            ? ` (${s.duration_minutes} Min.)`
            : ''
          return `- ${type}: ${s.title}${duration}`
        })
        .join('\n')
    }

    // Generate message with Claude Haiku
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-20250414',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Du bist Pierre Biege, Ultrarunner und Coach aus dem Wallis. Schreibe eine kurze WhatsApp-Morgennachricht (2-3 Sätze) an deinen Athleten ${client.name}.

Heute auf dem Plan:
${sessionsList}

Stil: nahbar, direkt, motivierend, kurz. Wie eine WhatsApp-Nachricht von einem Freund. Kein Marketing-Sprech. Ende mit "Hab einen richtig guten Tag." Deutsch.`,
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
