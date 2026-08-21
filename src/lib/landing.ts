/**
 * Where a signed-in person belongs.
 *
 * ONE definition, imported by every place that redirects after authentication —
 * `/post-auth`, `/session-conflict` and the home page. Two copies of this rule is exactly
 * how the post-sign-in redirect broke the first time: each caller hard-coded its own
 * destination and they drifted apart.
 *
 * Pure and dependency-free on purpose, so it is safe to import from a client component
 * too — no DB driver comes with it.
 */

/** Mentors and admins share the mentor/admin dashboard. */
export const MENTOR_HOME = '/mentor/dashboard'
/**
 * Students land on the student home page (feature 3) after signing in, then continue to
 * the dashboard from its navbar. Mentors skip it and go straight to their console.
 *
 * NOTE this is /home, the signed-in student surface — not `/`, which is the public
 * marketing page and stays static.
 */
export const STUDENT_HOME = '/home'
/** The student dashboard itself — reached from the home page, not landed on directly. */
export const STUDENT_DASHBOARD = '/dashboard'
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
 * Where sign-in / sign-up drops someone.
 *
 * Onboarding wins over role: a mentor who has not finished onboarding still has no
 * `systemRole` worth trusting — it is only assigned when the mentor code is accepted at
 * the end of the gate.
 *
 * Note students land on the HOME page, not straight on the dashboard — they get the
 * Katalyst landing page and choose to continue. Mentors go straight to their console.
 */
export function landingPathFor(user: LandingUser): string {
  if (!user.onboardingComplete) return ONBOARDING
  return isMentorRole(user.systemRole) ? MENTOR_HOME : STUDENT_HOME
}

/**
 * The dashboard for this person — what the home page's "Go to dashboard" button points
 * at. Distinct from `landingPathFor`, which for a student is the home page itself.
 */
export function dashboardPathFor(user: LandingUser): string {
  return isMentorRole(user.systemRole) ? MENTOR_HOME : STUDENT_DASHBOARD
}
