import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip login page
  if (pathname.startsWith('/admin/login')) {
    const response = NextResponse.next()
    response.headers.set('x-pathname', pathname)
    return response
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
  if (pathname.startsWith('/api/partners') || pathname.startsWith('/api/send-')) {
    if (!session?.value) {
      return NextResponse.json(
        { error: 'Nicht autorisiert.' },
        { status: 401 }
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/partners/:path*', '/api/send-:path*'],
}
