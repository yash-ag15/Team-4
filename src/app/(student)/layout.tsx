import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

/**
 * Guard for the student routes.
 *
 * No `AppShell` here: the feature 10 dashboard ships its own chrome — `Navbar` at the
 * top and `MobileNav` at the bottom, both inside `DashboardView` — so wrapping it in the
 * AppShell sidebar would render two navigations at once. Same reasoning as the mentor
 * side, which uses its own `MentorShell`.
 *
 * If a later student route needs the sidebar, wrap that page in `AppShell` itself rather
 * than putting it back here.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/sign-in')
  if (!session.user.onboardingComplete) redirect('/onboarding')

  return <>{children}</>
}
