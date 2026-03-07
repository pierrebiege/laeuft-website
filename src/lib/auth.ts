import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

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

  const { data } = await supabase
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
 * Returns true if authenticated, false otherwise.
 */
export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false

  const { data } = await supabase
    .from('admin_sessions')
    .select('token')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return !!data
}
