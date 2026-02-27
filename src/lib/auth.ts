import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Validates the session token against the database.
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
