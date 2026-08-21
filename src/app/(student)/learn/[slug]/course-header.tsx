'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Sparkles } from 'lucide-react'

interface CourseHeaderProps {
  title: string
  overallCompletedPct: number
  xpEarned: number
  xpTotalPossible: number
  loading?: boolean
}

export function CourseHeader({
  title,
  overallCompletedPct,
  xpEarned,
  xpTotalPossible,
  loading = false,
}: CourseHeaderProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-surface-variant rounded-full" />
          <div className="h-8 bg-surface-variant rounded w-1/3" />
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-4">
          <div className="h-6 bg-surface-variant rounded w-1/4" />
          <div className="w-full h-3 bg-surface-variant rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar: Back Action & Course Title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-background transition-colors active:scale-95"
            aria-label="Back to Home"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl md:text-3xl font-extrabold text-primary tracking-tight line-clamp-1">
            {title}
          </h1>
        </div>
      </div>

      {/* Hero Section: Progress & XP Card */}
      <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Course Progress
            </span>
            <h2 className="text-2xl font-bold text-on-background mt-0.5">
              {overallCompletedPct}% Complete
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed-variant px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm shadow-xs border border-secondary-fixed-dim">
            <Zap className="w-4 h-4 text-xp-gold fill-xp-gold" />
            <span>
              {xpEarned} / {xpTotalPossible} XP
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallCompletedPct === 100 ? 'bg-emerald-600' : 'bg-primary'
            }`}
            style={{ width: `${overallCompletedPct}%` }}
          />
        </div>
      </section>
    </div>
  )
}
