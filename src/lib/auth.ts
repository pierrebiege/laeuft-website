import { NextRequest, NextResponse } from 'next/server'

/**
 * Checks if the request has a valid admin session.
 * Returns a 401 response if not authenticated, or null if OK.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const session = request.cookies.get('admin_session')?.value
  if (!session) {
    return NextResponse.json(
      { error: 'Nicht autorisiert. Bitte einloggen.' },
      { status: 401 }
    )
  }
  return null
}
