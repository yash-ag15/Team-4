import { NextResponse, type NextRequest } from 'next/server'

/**
 * OPTIMISTIC redirect ONLY. Never the real authorization boundary.
 *
 * Middleware runs on every request, and a DB round-trip here is the classic way to make
 * an app feel slow — so this is a cookie-*presence* check, nothing more. A cookie can be
 * forged; the session lookup cannot.
 *
 * The real check is `contract.auth` in `defineRoute` plus
 * `auth.api.getSession({ headers: await headers() })` in server components.
 */
export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  const hasCookie =
    req.cookies.get('better-auth.session_token') ??
    // Better Auth prefixes the cookie with `__Secure-` when served over HTTPS.
    req.cookies.get('__Secure-better-auth.session_token')

  // In production, optimistic cookie check. In dev mode without cookie, let the mock layer authenticate.
  if (!hasCookie && !isDev) return NextResponse.redirect(new URL('/sign-in', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/catalog/:path*',
    '/learn/:path*',
    '/leaderboard/:path*',
    '/mentor/:path*',
    '/admin/:path*',
    '/onboarding',
    // Both run immediately after sign-in and both read the session server-side. Listed
    // here so an unauthenticated hit bounces at the edge instead of rendering a server
    // component only to redirect from inside it.
    '/post-auth',
    '/session-conflict',
  ],
}
