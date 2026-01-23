import { NextRequest, NextResponse } from 'next/server'
import * as OTPAuth from 'otpauth'

export async function POST(request: NextRequest) {
  try {
    const { password, code } = await request.json()

    const correctPassword = process.env.ADMIN_PASSWORD
    const totpSecret = process.env.ADMIN_TOTP_SECRET

    if (!correctPassword || !totpSecret) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    // Check password
    if (password !== correctPassword) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }

    // Check TOTP code
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

    // Generate session token
    const crypto = await import('crypto')
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Set cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  return response
}
