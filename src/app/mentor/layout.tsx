import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

import { MentorShell } from './mentor-shell'

/**
 * Guard for every `/mentor/*` route.
 *
 * The chrome itself is `MentorShell` — the mentor/admin navbar built for feature 11,
 * kept exactly as it was. It stays a separate client component because it needs
 * `usePathname()` for the active tab, while the guard below has to run on the server:
 * a client-side role check is a suggestion, not a boundary.
 *
 * Mentor pages deliberately do NOT use `AppShell` (the student sidebar). They have their
 * own top-nav design.
 */
export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/sign-in')
  if (!session.user.onboardingComplete) redirect('/onboarding')
  // Students have no business here. `/dashboard` is their route, so this cannot loop.
  if (session.user.systemRole === 'student') redirect('/dashboard')

  return <MentorShell>{children}</MentorShell>
}
