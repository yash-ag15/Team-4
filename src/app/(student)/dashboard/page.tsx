import { headers } from 'next/headers'

import { DashboardView } from '@/components/dashboard/dashboard-view'
import { initialUser } from '@/components/dashboard/mock-data'
import { auth } from '@/lib/auth'
import { brief as loadCoachBrief } from '@/server/ai-coach'

/**
 * The student dashboard — feature 10's `DashboardView`, rendered as built.
 *
 * The identity fields are overridden with the REAL signed-in user. Without this the
 * component falls back to `initialUser` from mock-data.ts, which is why every account was
 * greeted as "Good morning, Methika" no matter who signed in.
 *
 * The gamification numbers (level, xp, streak) still come from the fixture — there is no
 * XP engine yet, and inventing a real-looking zero would be worse than an obvious
 * placeholder. When feature 10's backend lands, pass those through the same prop instead
 * of editing the components.
 *
 * The `(student)` layout above has already checked the session and the onboarding flag.
 */
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user

  // The bottom-right coach panel. Read here rather than fetched by the client so the
  // panel opens already populated. It is cached per user for an hour inside
  // server/ai-coach.ts, and degrades to the contract mock when GEMINI_API_KEY is unset —
  // so a slow or missing model never blocks the dashboard from rendering.
  let coachBrief
  try {
    coachBrief = (await loadCoachBrief(user.id)).brief
  } catch {
    coachBrief = undefined
  }

  return (
    <DashboardView
      coachBrief={coachBrief}
      initialUserData={{
        ...initialUser,
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        avatarUrl: user.image ?? undefined,
        cohortYear: user.cohortYear || initialUser.cohortYear,
        campus: user.campus || initialUser.campus,
      }}
    />
  )
}
