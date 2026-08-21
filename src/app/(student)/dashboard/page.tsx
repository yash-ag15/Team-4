import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@/lib/auth'

/**
 * PLACEHOLDER. Every post-auth redirect in the app terminates at /dashboard, and until
 * this file existed that redirect landed on a 404 — which is what made sign-in look
 * like it "wasn't redirecting". Real dashboard work replaces the body; keep the route.
 *
 * The `(student)` layout above it has already checked the session and the onboarding
 * flag, so the session read here is only for display.
 */
export const dynamic = 'force-dynamic'

const nextUp: { href: string; label: string; blurb: string }[] = [
  { href: '/catalog', label: 'Catalog', blurb: 'Browse courses and enrol.' },
  { href: '/learn', label: 'My courses', blurb: 'Pick up where you left off.' },
  { href: '/leaderboard', label: 'Leaderboard', blurb: 'See where your cohort stands.' },
]

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500">
          Signed in as {user.email}
          {user.cohortYear ? ` • Cohort ${user.cohortYear}` : ''}
          {user.campus ? ` • ${user.campus}` : ''}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'XP', value: '0' },
          { label: 'Level', value: '1' },
          { label: 'Badges', value: '0' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Next up</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {nextUp.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-900"
            >
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="mt-1 text-xs text-gray-500">{item.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Account</h2>
        {/* Bounces straight back here when this is the only signed-in device. */}
        <Link
          href="/session-conflict"
          className="inline-block rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Check for other signed-in devices
        </Link>
      </section>

      <p className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500">
        Placeholder dashboard — the real one lands with the courses and XP features.
      </p>
    </div>
  )
}
