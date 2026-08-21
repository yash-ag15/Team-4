/**
 * Where a signed-in person belongs.
 *
 * ONE definition, imported by every place that redirects after authentication —
 * `/post-auth` and `/session-conflict` today. Two copies of this rule is exactly how the
 * post-sign-in redirect broke the first time: each caller hard-coded its own destination
 * and they drifted apart.
 *
 * Pure and dependency-free on purpose, so it is safe to import from a client component
 * too — no DB driver comes with it.
 */

/** Mentors and admins share the mentor/admin dashboard. */
export const MENTOR_HOME = '/mentor/dashboard'
/** Students land here. Feature 10 fills it in. */
export const STUDENT_HOME = '/dashboard'
/** The gate everyone passes through exactly once. */
export const ONBOARDING = '/onboarding'

export interface LandingUser {
  systemRole?: string | null
  onboardingComplete?: boolean | null
}

/** True for the roles that may see `/mentor/*`. Mirrors the guard in the mentor layout. */
export const isMentorRole = (systemRole?: string | null): boolean =>
  systemRole === 'mentor' || systemRole === 'admin'

/**
 * Onboarding wins over role: a mentor who has not finished onboarding still has no
 * `systemRole` worth trusting — it is only assigned when the mentor code is accepted at
 * the end of the gate.
 */
export function landingPathFor(user: LandingUser): string {
  if (!user.onboardingComplete) return ONBOARDING
  return isMentorRole(user.systemRole) ? MENTOR_HOME : STUDENT_HOME
}
