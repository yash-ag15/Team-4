import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { listSessions } from '@/server/sessions'

import { SessionConflict } from './session-conflict'

/**
 * "Someone else is already signed in as you."
 *
 * Reached from /post-auth when the account has more than one live session. The list is
 * read here on the server rather than fetched by the client so the screen has no
 * loading state — the person seeing it is already mid-sign-in and does not need another
 * spinner.
 */
export const dynamic = 'force-dynamic'

export default async function SessionConflictPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')

  const { sessions } = await listSessions(session.user.id, session.session.id)
  const others = sessions.filter((s) => !s.current)

  // The other device signed itself out between /post-auth and here — nothing to resolve.
  if (others.length === 0) {
    redirect(session.user.onboardingComplete ? '/dashboard' : '/onboarding')
  }

  // Computed, never taken from a query parameter: a `?next=` on a page that runs
  // immediately after sign-in is an open redirect waiting to happen.
  const continueHref = session.user.onboardingComplete ? '/dashboard' : '/onboarding'

  return <SessionConflict sessions={others} email={session.user.email} continueHref={continueHref} />
}
