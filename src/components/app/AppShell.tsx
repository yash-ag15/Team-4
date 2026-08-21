'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { signOut } from '@/lib/auth-client'
import { api } from '@/lib/api-client'
import type { PublicUser } from '@/server/users'

interface AppShellProps {
  user: PublicUser
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user.systemRole === 'mentor' || user.systemRole === 'admin') {
      // Safely check if mentor API exists (in case another team hasn't merged it yet)
      const fetchQueue = async () => {
        try {
          // @ts-ignore - temporary until mentor contract is merged
          const queue = api.mentor?.queue
          if (queue) {
            const res = await queue({ limit: 1 })
            setPendingCount(res.total ?? 0)
          }
        } catch (e) {
          // Ignore
        }
      }
      fetchQueue()
    }
  }, [user.systemRole])

  const studentLinks: { href: string; label: string; count?: number }[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/learn', label: 'My Courses' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/badges', label: 'Badges' },
  ]

  // Mentor and admin pages live under /mentor/*, behind the guard in
  // src/app/mentor/layout.tsx. /dashboard is the STUDENT route — linking a mentor there
  // would bounce them straight back out via that guard.
  const mentorLinks: { href: string; label: string; count?: number }[] = [
    { href: '/mentor/dashboard', label: 'Dashboard' },
    { href: '/mentor/review', label: 'Review Queue', count: pendingCount },
    { href: '/learn', label: 'My Courses' },
    { href: '/mentor/students', label: 'Students' },
  ]

  if (user.systemRole === 'admin') {
    mentorLinks.push({ href: '/mentor/admin/reports', label: 'Reports' })
    mentorLinks.push({ href: '/mentor/admin/users', label: 'User Roles' })
  }

  const links = user.systemRole === 'student' ? studentLinks : mentorLinks

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar (Desktop) / Topbar (Mobile) */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r border-gray-200">
        <div className="p-4 flex items-center justify-between md:flex-col md:items-start md:gap-8 h-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Katalyst</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{user.systemRole}</p>
          </div>
          
          <nav className="hidden md:flex flex-col gap-1 w-full">
            {links.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-semibold">
                      {link.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:block mt-auto w-full pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                {user.systemRole === 'student' && (
                  <p className="text-xs text-indigo-600 font-medium truncate">Level 1 • 0 XP</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left text-sm font-medium text-red-600 hover:text-red-700 py-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
