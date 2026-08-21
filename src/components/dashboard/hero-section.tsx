'use client';

import React from 'react';
import { UserProfile } from './types';

interface HeroSectionProps {
  user: UserProfile;
}

export function HeroSection({ user }: HeroSectionProps) {
  // Compute progress percent towards next level (assuming 1000 XP per level bracket)
  const currentLevelProgressPct = Math.min(
    100,
    Math.max(0, Math.round(((1000 - user.xpToNextLevel) / 1000) * 100))
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl md:text-3xl font-bold text-on-background tracking-tight">
          Good morning, {user.name} 👋
        </h2>
        <p className="text-base text-on-surface-variant font-medium">
          LEVEL {user.level} • {user.xp.toLocaleString()} XP
        </p>
      </div>

      <div className="flex flex-col gap-1.5 max-w-md w-full">
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden border border-outline-variant/50">
          <div
            className="bg-gradient-to-r from-primary to-tertiary h-full rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${currentLevelProgressPct || 80}%` }}
          ></div>
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          {user.xpToNextLevel} XP to Level {user.level + 1}
        </span>
      </div>
    </section>
  );
}
