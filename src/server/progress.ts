/**
 * src/server/progress.ts
 *
 * Business logic for the student dashboard composite endpoint.
 *
 * STATUS: STUB — Phase 5, not yet implemented.
 *
 * This handler depends on DB schema tables that are owned by Siddesh and
 * have not been migrated yet:
 *   - src/db/schema/courses.ts    (courses, course_sections, lessons, assessments)
 *   - src/db/schema/learning.ts   (enrollments, lesson_progress, section_progress, submissions, ai_reviews)
 *   - src/db/schema/engagement.ts (xp_events, streaks, daily_checkins, badges, user_badges)
 *
 * Do NOT implement until those migrations have been run on the shared Neon DB.
 *
 * When ready, implement getDashboard(userId) and wire it into the route:
 *   src/app/api/user/dashboard/route.ts — see the TODO comment there.
 *
 * See the query pattern in plans/katalyst/features/10-student-dashboard/backend.md
 * for the required grouped join (2 queries, not N+1).
 */

import type { DashboardData } from '@/contracts/user-dashboard'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getDashboard(_userId: string): Promise<{ dashboard: DashboardData }> {
  throw new Error(
    'getDashboard is not implemented yet — DB schema (courses.ts, learning.ts, engagement.ts) ' +
    'must be created by Siddesh and migrated before this can be written. ' +
    'See plans/katalyst/features/10-student-dashboard/backend.md for the implementation plan.',
  )
}
