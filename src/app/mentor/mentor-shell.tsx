'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MentorShellProps {
  children: React.ReactNode
}

export function MentorShell({ children }: MentorShellProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/mentor/dashboard', label: 'Dashboard' },
    { href: '/mentor/admin/courses/new', label: 'Create Course' },
    { href: '/mentor/students', label: 'Students Roster' },
    { href: '/mentor/review', label: 'Review Queue' },
    { href: '/mentor/admin/reports', label: 'Reports & KPIs' },
    { href: '/mentor/admin/users', label: 'User Roles' },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-[#2596be]/20 selection:text-[#2596be]">
      {/* Top Navbar with Glass Effect & Brand Glow */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-8">
            <Link href="/mentor/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2596be] via-[#38bdf8] to-[#ec4899] text-white flex items-center justify-center font-bold text-base shadow-md shadow-[#2596be]/25 group-hover:scale-105 transition-transform duration-200">
                K
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight font-['Hanken_Grotesk'] text-lg">
                  Katalyst
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 text-[#2596be] border border-[#2596be]/20">
                  Mentor & Admin
                </span>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/mentor/dashboard' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2596be]/15 to-[#ec4899]/10 text-[#2596be] border border-[#2596be]/25 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/mentor/admin/courses/new"
              className="bg-gradient-to-r from-[#2596be] to-[#38bdf8] hover:from-[#1e7898] hover:to-[#0284c7] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Create Course</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-700 hover:text-[#2596be] px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-[#2596be]/40 transition shadow-xs flex items-center gap-1.5"
            >
              <span>Student View</span>
              <span className="text-pink-500 font-bold">→</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
