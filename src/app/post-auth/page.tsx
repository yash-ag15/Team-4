import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { landingPathFor } from '@/lib/landing'
import { listSessions } from '@/server/sessions'

/**
 * The single landing spot after ANY successful authentication.
 *
 * Email sign-in, email sign-up and the Google callback all point here instead of each
 * hard-coding where to go next. That matters because "where next" is four questions,
 * not one — is this person signed in, is someone else signed in as them, have they
 * onboarded, and are they a mentor — and answering them in three separate client
 * components is how the redirect drifted out of sync in the first place.
 *
 * It renders nothing: every path out of it is a redirect.
 */
export const dynamic = 'force-dynamic'

export default async function PostAuthPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  // Landing here without a session means sign-in failed or the cookie was dropped.
  if (!session) redirect('/sign-in')

  // Mentors and admins go to /mentor/dashboard, students to /dashboard, and anyone who
  // has not finished onboarding to the gate first. See `@/lib/landing`.
  const destination = landingPathFor(session.user)

  // Somebody else is signed in on this account right now. Make them deal with it first;
  // that screen works out the same destination once they have.
  const { otherCount } = await listSessions(session.user.id, session.session.id)
  if (otherCount > 0) redirect('/session-conflict')

  redirect(destination)
}
