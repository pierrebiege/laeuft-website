import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Validates the session token against the database (for API routes).
 * Returns a 401 response if not authenticated, or null if OK.
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get('admin_session')?.value
  if (!token) {
    return NextResponse.json(
      { error: 'Nicht autorisiert. Bitte einloggen.' },
      { status: 401 }
    )
  }

  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('token')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) {
    return NextResponse.json(
      { error: 'Session abgelaufen. Bitte erneut einloggen.' },
      { status: 401 }
    )
  }

  return null
}

/**
 * Server-side session validation for use in Server Components / Layouts.
 * Returns { valid, role } so the layout can pass the role downstream.
 */
export async function validateSession(): Promise<{ valid: boolean; role: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return { valid: false, role: '' }

  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('token, role')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return { valid: false, role: '' }

  return { valid: true, role: data.role || 'admin' }
}
