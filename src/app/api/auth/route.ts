import { NextRequest, NextResponse } from 'next/server'
import * as OTPAuth from 'otpauth'
import { supabase } from '@/lib/supabase'

const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

export async function POST(request: NextRequest) {
  try {
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
      await supabase.from('admin_sessions').insert({
        token: sessionToken,
        role: 'manager',
        expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
      })

      // Cleanup expired sessions
      await supabase.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())

      const response = NextResponse.json({ success: true, role: 'manager' })
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      })
      response.cookies.set('admin_role', 'manager', {
        httpOnly: false, // readable by client for UI
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
    await supabase.from('admin_sessions').insert({
      token: sessionToken,
      role: 'admin',
      expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
    })

    // Cleanup expired sessions
    await supabase.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())

    const response = NextResponse.json({ success: true, role: 'admin' })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    response.cookies.set('admin_role', 'admin', {
      httpOnly: false,
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
    await supabase.from('admin_sessions').delete().eq('token', token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  response.cookies.delete('admin_role')
  return response
}
