import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ATHLETE_COOKIE, ATHLETE_SESSION_MAX_AGE } from '@/lib/athleteAuth'

const LOGIN_TOKEN_TTL_MS = 30 * 60 * 1000 // Magic-Link 30 Min gültig
const THROTTLE_WINDOW_MS = 15 * 60 * 1000 // pro E-Mail
const MAX_LINKS_PER_WINDOW = 3            // max. Links pro 15 Min (Mail-Bombing-Schutz)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
})

function baseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'
}

/**
 * Findet die Athleten-Identität zur E-Mail. Wenn noch kein athletes-Eintrag
 * existiert, aber ein bekannter Coaching-Kunde (clients) mit dieser Mail, wird
 * der Athlet angelegt und mit dem clients-Eintrag verknüpft. Bei mehrdeutiger
 * Mail (z.B. geteilte Familien-Adresse) wird NICHT geraten → kein Login.
 */
async function resolveAthlete(email: string): Promise<string | null> {
  const { data: existing } = await supabaseAdmin
    .from('athletes')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existing?.id) return existing.id

  const { data: clientRows } = await supabaseAdmin
    .from('clients')
    .select('id, name, email')
    .ilike('email', email)
  if (!clientRows || clientRows.length === 0) return null
  if (clientRows.length > 1) {
    console.warn('athlete login: mehrdeutige clients-E-Mail, kein Auto-Login:', email)
    return null
  }

  const client = clientRows[0] as { id: string; name: string | null }
  const { data: created } = await supabaseAdmin
    .from('athletes')
    .insert({ email, name: client.name })
    .select('id')
    .single()
  if (!created?.id) return null

  await supabaseAdmin.from('clients').update({ athlete_id: created.id }).eq('id', client.id)
  return created.id
}

function loginEmailHtml(link: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#18181b;max-width:600px;margin:0 auto;padding:24px;">
  <div style="font-size:22px;font-weight:bold;margin-bottom:24px;">läuft<span style="color:#a1a1aa;">.</span></div>
  <p>Hier ist dein Anmelde-Link für dein Training:</p>
  <p style="margin:24px 0;">
    <a href="${link}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Anmelden</a>
  </p>
  <p style="color:#71717a;font-size:13px;">Der Link ist 30 Minuten gültig und nur einmal verwendbar. Wenn du das nicht angefordert hast, ignoriere diese E-Mail einfach.</p>
  <p style="color:#a1a1aa;font-size:12px;margin-top:28px;">laeuft.ch · Training mit Pierre</p>
</body></html>`
}

// POST { email } → Magic-Link anfordern. Immer generische Antwort (enumeration-safe).
export async function POST(request: NextRequest) {
  const generic = NextResponse.json({ ok: true })

  let email = ''
  try {
    const body = await request.json()
    email = String(body?.email || '').trim().toLowerCase()
  } catch {
    return generic
  }
  if (!email || !email.includes('@')) return generic

  try {
    const athleteId = await resolveAthlete(email)
    if (!athleteId) return generic

    // Persistenter Throttle pro Athlet (gegen Mail-Bombing)
    const sinceIso = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString()
    const { count } = await supabaseAdmin
      .from('athlete_login_tokens')
      .select('token', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .gt('created_at', sinceIso)
    if ((count ?? 0) >= MAX_LINKS_PER_WINDOW) return generic

    const loginToken = crypto.randomBytes(32).toString('hex')
    await supabaseAdmin.from('athlete_login_tokens').insert({
      token: loginToken,
      athlete_id: athleteId,
      expires_at: new Date(Date.now() + LOGIN_TOKEN_TTL_MS).toISOString(),
    })
    await supabaseAdmin
      .from('athlete_login_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    const link = `${baseUrl(request)}/api/athlete/auth?token=${loginToken}`
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Dein Anmelde-Link – Training mit Pierre',
      html: loginEmailHtml(link),
    })
  } catch (err) {
    console.error('athlete magic-link error:', err)
  }

  return generic
}

// GET ?token=... → Link bestätigen, Session setzen, weiterleiten nach /athlet.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const loginRedirect = (err: string) => {
    const url = new URL('/athlet/login', baseUrl(request))
    url.searchParams.set('error', err)
    return NextResponse.redirect(url)
  }
  if (!token) return loginRedirect('missing')

  const { data: lt } = await supabaseAdmin
    .from('athlete_login_tokens')
    .select('token, athlete_id, expires_at, consumed_at')
    .eq('token', token)
    .single()

  if (!lt || lt.consumed_at || new Date(lt.expires_at) < new Date()) {
    return loginRedirect('expired')
  }

  // Einmalig konsumieren
  await supabaseAdmin
    .from('athlete_login_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)

  const sessionToken = crypto.randomBytes(32).toString('hex')
  await supabaseAdmin.from('athlete_sessions').insert({
    token: sessionToken,
    athlete_id: lt.athlete_id,
    expires_at: new Date(Date.now() + ATHLETE_SESSION_MAX_AGE * 1000).toISOString(),
  })
  await supabaseAdmin
    .from('athlete_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())

  const res = NextResponse.redirect(new URL('/athlet', baseUrl(request)))
  res.cookies.set(ATHLETE_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ATHLETE_SESSION_MAX_AGE,
    path: '/',
  })
  return res
}

// DELETE → Logout.
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ATHLETE_COOKIE)?.value
  if (token) {
    await supabaseAdmin.from('athlete_sessions').delete().eq('token', token)
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ATHLETE_COOKIE)
  return res
}
