import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCurrentWeek } from '@/lib/trainingHelper'
import {
  SESSION_TYPE_LABELS,
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  SessionType,
} from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const COACH_BCC = 'pierre@laeuft.ch'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const TYPE_ORDER: Record<string, number> = { lauf: 0, kraft: 1, mobility: 2, ruhe: 3 }
const TYPE_COLOR: Record<SessionType, string> = { lauf: '#2563eb', kraft: '#ea580c', mobility: '#16a34a', ruhe: '#71717a' }

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })
}

function buildWeekHtml(
  clientName: string,
  weekLabel: string,
  weekMonday: Date,
  sessions: TrainingSession[],
  planUrl: string
) {
  const sunday = new Date(weekMonday)
  sunday.setDate(weekMonday.getDate() + 6)
  const range = `${fmtDate(weekMonday)} – ${fmtDate(sunday)}`

  let daysHtml = ''
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekMonday)
    dayDate.setDate(weekMonday.getDate() + d)
    const daySessions = sessions
      .filter((s) => s.day_of_week === d)
      .sort((a, b) => (TYPE_ORDER[a.session_type] ?? 9) - (TYPE_ORDER[b.session_type] ?? 9) || a.sort_order - b.sort_order)

    const label = `${DAY_NAMES[d]}, ${dayDate.toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric' })}`
    if (daySessions.length === 0) {
      daysHtml += `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><strong style="color:#1a1a1a;">${label}</strong><div style="color:#aaa;font-size:14px;margin-top:2px;">Ruhetag</div></td></tr>`
      continue
    }
    const items = daySessions
      .map((s) => {
        const type = SESSION_TYPE_LABELS[s.session_type as SessionType] || ''
        const color = TYPE_COLOR[s.session_type as SessionType] || '#888'
        const dur = s.duration_minutes ? ` <span style="color:#999;">· ${s.duration_minutes} min</span>` : ''
        return `<div style="margin-top:5px;font-size:15px;"><span style="color:${color};font-weight:600;">${type}</span> <span style="color:#333;">${s.title}</span>${dur}</div>`
      })
      .join('')
    daysHtml += `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><strong style="color:#1a1a1a;">${label}</strong>${items}</td></tr>`
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px;">
    <div style="margin-bottom:24px;"><h1 style="font-size:24px;font-weight:bold;margin:0;">läuft<span style="color:#999;">.</span></h1></div>
    <p>Hallo ${clientName},</p>
    <p>deine Trainingswoche für die kommende Woche – <strong>${weekLabel}</strong> (${range}):</p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 24px;">${daysHtml}</table>
    <a href="${planUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:500;">Zur ganzen Woche</a>
    <p style="color:#666;font-size:14px;margin-top:28px;">Einheiten kannst du direkt abhaken und mir eine Notiz dalassen.<br><br>Beste Grüsse<br>Pierre</p>
    <div style="border-top:1px solid #eee;margin-top:28px;padding-top:16px;font-size:12px;color:#999;"><p>Pierre Biege · pierre@laeuft.ch</p></div>
  </body></html>`
}

function buildWeekText(clientName: string, weekLabel: string, sessions: TrainingSession[], planUrl: string) {
  let body = `Hallo ${clientName},\n\ndeine Trainingswoche für die kommende Woche – ${weekLabel}:\n\n`
  for (let d = 0; d < 7; d++) {
    const ds = sessions.filter((s) => s.day_of_week === d).sort((a, b) => (TYPE_ORDER[a.session_type] ?? 9) - (TYPE_ORDER[b.session_type] ?? 9))
    body += `${DAY_NAMES[d]}: `
    body += ds.length === 0 ? 'Ruhetag' : ds.map((s) => `${SESSION_TYPE_LABELS[s.session_type as SessionType]} ${s.title}${s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}`).join(', ')
    body += '\n'
  }
  body += `\nZur ganzen Woche: ${planUrl}\n\nBeste Grüsse\nPierre`
  return body
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  // Fallback: admin session cookie (manual trigger from the browser)
  const sessionCookie = request.cookies.get('admin_session')?.value
  if (!sessionCookie) return false
  const { data: session } = await supabaseAdmin
    .from('admin_sessions')
    .select('token')
    .eq('token', sessionCookie)
    .gt('expires_at', new Date().toISOString())
    .single()
  return !!session
}

async function handler(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const testMode = url.searchParams.get('test') === '1' // send only to coach, marked as test
  const dryRun = url.searchParams.get('dry') === '1' // build but do not send

  const { data: plans, error } = await supabaseAdmin
    .from('training_plans')
    .select('*, client:clients(*), weeks:training_weeks(*, sessions:training_sessions(*))')
    .in('status', ['sent', 'active'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'
  const results: { client: string; status: string; sessions?: number }[] = []

  // Sent Sunday evening → send the week that starts the next day. Looking one
  // day ahead means a Sunday run picks the upcoming (Mon–Sun) week, not the one
  // that is just ending.
  const refDate = new Date()
  refDate.setDate(refDate.getDate() + 1)

  for (const plan of plans || []) {
    const client = plan.client
    if (!client?.email) {
      results.push({ client: client?.name || 'unbekannt', status: 'keine E-Mail' })
      continue
    }

    const { week, weekIndex, weekMonday } = getCurrentWeek(
      plan as TrainingPlan,
      (plan.weeks || []) as TrainingWeek[],
      refDate
    )

    if (!week || !weekMonday) {
      results.push({ client: client.name, status: 'keine aktuelle Woche' })
      continue
    }

    const sessions = (week.sessions || []) as TrainingSession[]
    if (sessions.length === 0) {
      results.push({ client: client.name, status: 'Woche leer – übersprungen' })
      continue
    }

    const weekLabel = week.label || `Woche ${week.week_number ?? weekIndex + 1}`
    const planUrl = `${siteUrl}/training/${plan.unique_token}`
    const html = buildWeekHtml(client.name, weekLabel, weekMonday, sessions, planUrl)
    const text = buildWeekText(client.name, weekLabel, sessions, planUrl)

    if (dryRun) {
      results.push({ client: client.name, status: 'dry-run', sessions: sessions.length })
      continue
    }

    try {
      await transporter.sendMail({
        from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
        to: testMode ? COACH_BCC : client.email,
        bcc: testMode ? undefined : COACH_BCC,
        subject: `${testMode ? `[TEST → ${client.name}] ` : ''}Deine Trainingswoche: ${weekLabel}`,
        html,
        text,
      })
      results.push({ client: client.name, status: testMode ? 'test an Pierre' : 'gesendet', sessions: sessions.length })
    } catch (err) {
      console.error(`Weekly mail error for ${client.name}:`, err)
      results.push({ client: client.name, status: 'fehler' })
    }
  }

  return NextResponse.json({ ok: true, testMode, dryRun, processed: results.length, results })
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
