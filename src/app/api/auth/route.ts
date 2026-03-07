import { NextRequest, NextResponse } from 'next/server'
import * as OTPAuth from 'otpauth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

// --- Rate Limiting (in-memory) ---
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// Cleanup stale entries every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(ip)
    }
  }
}, 30 * 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    const { password, code, loginType } = await request.json()

    const adminPassword = process.env.ADMIN_PASSWORD
    const totpSecret = process.env.ADMIN_TOTP_SECRET
    const managerPassword = process.env.CRM_PASSWORD

    if (!adminPassword || !totpSecret) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    // Manager login (password only, no TOTP)
    if (loginType === 'manager') {
      if (!managerPassword) {
        return NextResponse.json({ error: 'Manager-Zugang nicht konfiguriert' }, { status: 500 })
      }

      if (password !== managerPassword) {
        return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
      }

      const crypto = await import('crypto')
      const sessionToken = crypto.randomBytes(32).toString('hex')

      // Store session in DB
      await supabaseAdmin.from('admin_sessions').insert({
        token: sessionToken,
        role: 'manager',
        expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
      })

      // Cleanup expired sessions
      await supabaseAdmin.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())

      const response = NextResponse.json({ success: true, role: 'manager' })
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })
      response.cookies.set('admin_role', 'manager', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })

      return response
    }

    // Admin login (password + TOTP)
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Laeuft',
      label: 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: totpSecret,
    })

    const delta = totp.validate({ token: code, window: 1 })

    if (delta === null) {
      return NextResponse.json({ error: 'Falscher Code' }, { status: 401 })
    }

    const crypto = await import('crypto')
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Store session in DB
    await supabaseAdmin.from('admin_sessions').insert({
      token: sessionToken,
      role: 'admin',
      expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
    })

    // Cleanup expired sessions
    await supabaseAdmin.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())

    const response = NextResponse.json({ success: true, role: 'admin' })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    response.cookies.set('admin_role', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Delete session from DB
  const token = request.cookies.get('admin_session')?.value
  if (token) {
    await supabaseAdmin.from('admin_sessions').delete().eq('token', token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  response.cookies.delete('admin_role')
  return response
}
