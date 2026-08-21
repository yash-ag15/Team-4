'use client'

import React from 'react'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  streakCount: number
  className?: string
}

export function StreakBadge({ streakCount, className = '' }: StreakBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-2 rounded-full w-max shadow-sm border border-secondary-fixed-dim ${className}`}
    >
      <Flame className="w-4 h-4 text-streak-orange fill-streak-orange" />
      <span className="font-semibold text-sm">{streakCount} day streak</span>
    </div>
  )
}
