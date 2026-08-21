'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, BookOpen, User } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  matchPrefix?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Catalog', href: '/catalog', icon: Compass },
  { label: 'My Learning', href: '/my-courses', icon: BookOpen, matchPrefix: '/learn' },
  { label: 'Profile', href: '/dashboard', icon: User },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true
    if (item.matchPrefix && pathname?.startsWith(item.matchPrefix)) return true
    return false
  }

  return (
    <nav className="md:hidden bg-surface-container-lowest dark:bg-surface-container bottom-0 rounded-t-xl border-t-2 border-surface-variant dark:border-outline-variant shadow-lg fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1 active:scale-95 transition-all duration-150 ${
              active
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-surface-variant'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[12px] font-semibold mt-1">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
