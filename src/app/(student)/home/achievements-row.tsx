'use client'

import React from 'react'
import { Star, Flame, Clock, Users, Award, Shield } from 'lucide-react'
import { AchievementItem } from './types'

interface AchievementsRowProps {
  items?: AchievementItem[]
}

const defaultAchievements: (AchievementItem & { iconComponent: React.ComponentType<{ className?: string }> })[] = [
  { id: '1', title: 'First Lesson', icon: 'star', unlocked: true, iconComponent: Star },
  { id: '2', title: '5-Day Streak', icon: 'flame', unlocked: true, iconComponent: Flame },
  { id: '3', title: 'Fast Learner', icon: 'clock', unlocked: true, iconComponent: Clock },
  { id: '4', title: 'Team Player', icon: 'users', unlocked: true, iconComponent: Users },
  { id: '5', title: 'Quiz Master', icon: 'award', unlocked: true, iconComponent: Award },
  { id: '6', title: 'Streak Shield', icon: 'shield', unlocked: true, iconComponent: Shield },
]

export function AchievementsRow({ items }: AchievementsRowProps) {
  const displayItems = items
    ? items.map((item) => ({
        ...item,
        iconComponent:
          item.icon === 'flame'
            ? Flame
            : item.icon === 'clock'
            ? Clock
            : item.icon === 'users'
            ? Users
            : item.icon === 'award'
            ? Award
            : item.icon === 'shield'
            ? Shield
            : Star,
      }))
    : defaultAchievements

  return (
    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
      {displayItems.map((item) => {
        const Icon = item.iconComponent
        return (
          <div
            key={item.id}
            className="flex flex-col items-center gap-2 flex-shrink-0 w-24 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full border-2 border-xp-gold/60 flex items-center justify-center bg-surface-container-lowest shadow-sm group-hover:scale-110 group-hover:border-xp-gold transition-all">
              <Icon className="w-6 h-6 text-xp-gold fill-xp-gold/20" />
            </div>
            <span className="font-semibold text-xs text-on-surface-variant text-center leading-tight">
              {item.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}
