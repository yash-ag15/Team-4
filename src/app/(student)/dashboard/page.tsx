import { DashboardView } from '@/components/dashboard/dashboard-view'

/**
 * The student dashboard — feature 10's `DashboardView`, used as built.
 *
 * Everything visible here (hero, progress, missions, activity heatmap, study plan,
 * achievements, AI coach panel, mobile nav) lives in `src/components/dashboard/*` and is
 * rendered unchanged. `DashboardView` supplies its own defaults from `mock-data.ts`, so
 * it stands up before the dashboard API is wired; when feature 10's backend lands, pass
 * its data in through the `initial*Data` props instead of editing the components.
 *
 * The `(student)` layout above has already checked the session and the onboarding flag.
 */
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <DashboardView />
}
