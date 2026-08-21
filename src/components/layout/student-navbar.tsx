'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Zap, Bell, Home, Compass, BookOpen, Trophy } from 'lucide-react'
import { useStudentProfile } from '@/context/student-profile-context'

interface NavLink {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  matchPrefix?: string
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Catalog', href: '/catalog', icon: Compass },
  { label: 'My Learning', href: '/my-courses', icon: BookOpen, matchPrefix: '/learn' },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
]

export function StudentNavbar() {
  const { profile } = useStudentProfile()
  const pathname = usePathname()

  const isActive = (item: NavLink) => {
    if (pathname === item.href) return true
    if (item.matchPrefix && pathname?.startsWith(item.matchPrefix)) return true
    return false
  }

  return (
    <header className="bg-surface-bright/95 dark:bg-surface-dim/95 backdrop-blur-md top-0 z-40 sticky border-b border-outline-variant/30 transition-all">
      <div className="flex justify-between items-center w-full max-w-[1200px] mx-auto px-4 md:px-8 py-3">
        {/* Left: Katalyst Wordmark */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="text-xl md:text-2xl font-black text-primary tracking-tight">
              Katalyst
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    active
                      ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                      : 'text-on-surface-variant hover:text-on-background hover:bg-surface-container'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: Gamification Badges, Notifications & Profile Avatar */}
        <div className="flex items-center gap-2.5 md:gap-4">
          {/* Streak Indicator */}
          <div
            className="flex items-center gap-1.5 bg-secondary-container/20 text-on-secondary-container px-3 py-1.5 rounded-full border border-secondary-container/30 text-xs md:text-sm font-bold cursor-default"
            title={`${profile.streakCount} day streak`}
          >
            <Flame className="w-4 h-4 text-streak-orange fill-streak-orange" />
            <span>{profile.streakCount}d</span>
          </div>

          {/* XP Indicator */}
          <div
            className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/40 text-xs md:text-sm font-bold text-on-background cursor-default"
            title={`${profile.xpTotal} Total XP`}
          >
            <Zap className="w-4 h-4 text-xp-gold fill-xp-gold" />
            <span>{profile.xpTotal} XP</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-background transition-colors relative focus:outline-none"
            >
              <Bell className="w-4.5 h-4.5" />
              {profile.unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-background" />
              )}
            </button>
          </div>

          {/* Profile Avatar -> navigates to /dashboard */}
          <Link
            href="/dashboard"
            aria-label="Student Dashboard Profile"
            className="flex items-center gap-2 pl-1 group"
            title="Go to Student Dashboard"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary text-on-primary flex items-center justify-center font-bold text-sm border-2 border-primary/30 group-hover:border-primary transition-all active:scale-95 shadow-sm">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.name.charAt(0)}</span>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-on-background leading-tight group-hover:text-primary transition-colors">
                {profile.name}
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                Level {profile.level}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
