import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Skip login page
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const session = request.cookies.get('admin_session')

  // Protect /admin pages
  if (pathname.startsWith('/admin')) {
    if (!session?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Block manager from accessing Buchhaltung
    const role = request.cookies.get('admin_role')?.value
    if (role === 'manager' && pathname.startsWith('/admin/buchhaltung')) {
      const redirectUrl = new URL('/admin', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect admin-only API routes (defense in depth — routes also check via requireAuth())
  if (
    pathname.startsWith('/api/partners') ||
    pathname.startsWith('/api/send-') ||
    pathname.startsWith('/api/calendar') ||
    pathname.startsWith('/api/generate-mandate-invoice')
  ) {
    if (!session?.value) {
      return NextResponse.json(
        { error: 'Nicht autorisiert.' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/partners/:path*',
    '/api/send-:path*',
    '/api/calendar/:path*',
    '/api/generate-mandate-invoice/:path*',
  ],
}
