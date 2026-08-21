import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { dashboardPathFor } from '@/lib/landing'

/**
 * Bounces an ALREADY signed-in visitor off /sign-in and /sign-up.
 *
 * The home page is deliberately static — it always offers Sign In / Sign Up, and knows
 * nothing about sessions. That leaves one gap: a student who has signed in lands back on
 * `/`, and the only buttons there point at the auth pages. Without this, clicking Sign In
 * would re-render the login form at someone who is already logged in — a dead end.
 *
 * So the auth pages become the way back in: with a live session they forward to the
 * dashboard for that role, and to /onboarding for anyone who has not finished the gate.
 * The sign-in and sign-up forms themselves are untouched.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect(session.user.onboardingComplete ? dashboardPathFor(session.user) : '/onboarding')
  }

  return <>{children}</>
}
