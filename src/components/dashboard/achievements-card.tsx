'use client';

import React from 'react';
import { AchievementBadge, LeaderboardRankInfo, MentorInfo } from './types';

interface AchievementsCardProps {
  badges: AchievementBadge[];
  rankInfo: LeaderboardRankInfo;
  mentor: MentorInfo;
  onBadgeClick?: (badge: AchievementBadge) => void;
  onRankClick?: () => void;
  onMentorClick?: () => void;
}

export function AchievementsCard({
  badges,
  rankInfo,
  mentor,
  onBadgeClick,
  onRankClick,
  onMentorClick,
}: AchievementsCardProps) {
  const earnedCount = badges.filter((b) => !b.locked).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Achievements Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
            Achievements
          </h3>
          <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-md">
            {earnedCount} / {badges.length} earned
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2">
          {badges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              disabled={badge.locked}
              onClick={() => onBadgeClick?.(badge)}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${
                badge.locked ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-sm relative transition-all ${
                  badge.locked
                    ? 'bg-surface-container-low opacity-50 grayscale border border-dashed border-outline-variant group-hover:opacity-70'
                    : 'bg-surface-container-lowest border border-outline-variant group-hover:border-secondary group-hover:shadow-md group-focus:ring-2 group-focus:ring-secondary/50'
                }`}
              >
                {badge.isEmoji ? (
                  <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </span>
                ) : (
                  <span
                    className={`material-symbols-outlined ${
                      badge.locked ? 'text-on-surface-variant' : badge.colorClass || 'text-secondary fill-icon'
                    } text-2xl md:text-3xl group-hover:scale-110 transition-transform`}
                  >
                    {badge.icon}
                  </span>
                )}

                {/* Optional level counter badge */}
                {badge.levelBadge && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center border border-white">
                    <span className="text-[10px] text-white font-bold leading-none">
                      {badge.levelBadge}
                    </span>
                  </div>
                )}
              </div>

              <span
                className={`text-[10px] text-center leading-tight transition-colors whitespace-pre-line ${
                  badge.locked
                    ? 'text-on-surface-variant opacity-50'
                    : 'text-on-surface-variant group-hover:text-on-background'
                }`}
              >
                {badge.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rank & Mentor 2-Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rank Card */}
        <div
          onClick={onRankClick}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 shadow-sm text-center hover:shadow-md transition-shadow group cursor-pointer"
        >
          <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant group-hover:text-on-background transition-colors">
            Your Rank
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
            <span className="text-2xl font-bold text-secondary group-hover:text-secondary-container transition-colors">
              #{rankInfo.myRank}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2 px-2 border-t border-outline-variant/50 pt-2">
            {/* Rank - 1 */}
            <div className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-[10px] text-on-surface-variant font-medium">
                #{rankInfo.prevRankUser.rank}
              </span>
              <div className="w-5 h-5 rounded-full bg-surface-container-high mt-0.5 overflow-hidden border border-outline-variant/50">
                <img alt={rankInfo.prevRankUser.name} src={rankInfo.prevRankUser.avatarUrl} />
              </div>
            </div>

            {/* Rank + 1 */}
            <div className="flex flex-col items-center opacity-50 hover:opacity-80 transition-opacity">
              <span className="text-[10px] text-on-surface-variant font-medium">
                #{rankInfo.nextRankUser.rank}
              </span>
              <div className="w-5 h-5 rounded-full bg-surface-container-high mt-0.5 overflow-hidden border border-outline-variant/50">
                <img alt={rankInfo.nextRankUser.name} src={rankInfo.nextRankUser.avatarUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* Mentor Card */}
        <div
          onClick={onMentorClick}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow group cursor-pointer focus-within:ring-2 focus-within:ring-secondary/50"
        >
          <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant group-hover:text-on-background transition-colors">
            Your Mentor
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/50 group-hover:border-secondary/50 transition-colors">
              <img alt={mentor.name} src={mentor.avatarUrl} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-on-background leading-tight group-hover:text-secondary transition-colors">
                {mentor.name}
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                {mentor.specialty}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mt-2 border-t border-outline-variant/50 pt-2 w-full text-left focus:outline-none rounded"
          >
            <span className="text-[10px] text-secondary font-bold flex items-center gap-1 group-hover:text-secondary-container transition-colors">
              <span className="material-symbols-outlined text-[12px]">event</span> {mentor.nextSessionTime}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
