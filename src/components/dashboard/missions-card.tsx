'use client';

import React, { useState } from 'react';
import { Mission } from './types';

interface MissionsCardProps {
  initialMissions: Mission[];
  onMissionToggle?: (missionId: string, completed: boolean) => void;
}

export function MissionsCard({ initialMissions, onMissionToggle }: MissionsCardProps) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const newStatus = m.status === 'completed' ? 'due_today' : 'completed';
          onMissionToggle?.(id, newStatus === 'completed');
          return {
            ...m,
            status: newStatus,
            dueLabel: newStatus === 'completed' ? 'Completed' : 'Due Today, 11:59 PM',
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
          Today&apos;s Missions
        </h3>
        <span className="material-symbols-outlined text-primary">rocket_launch</span>
      </div>

      <div className="flex flex-col gap-3">
        {missions.map((mission) => {
          const isCompleted = mission.status === 'completed';
          const isDueToday = mission.status === 'due_today';

          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => toggleMission(mission.id)}
              className={`w-full text-left group flex items-start gap-3 p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer relative overflow-hidden bg-surface-container-lowest active:scale-[0.99] ${
                isDueToday ? 'shadow-sm' : ''
              }`}
            >
              {/* Left accent bar for due today */}
              {isDueToday && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary group-hover:w-1.5 transition-all" />
              )}

              {/* Checkbox indicator */}
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isCompleted
                    ? 'border-primary bg-primary group-hover:bg-primary-container group-hover:border-primary-container'
                    : isDueToday
                    ? 'border-primary group-hover:bg-primary/10'
                    : 'border-outline-variant group-hover:border-primary/50'
                }`}
              >
                {isCompleted && (
                  <span className="material-symbols-outlined text-white text-[14px]">check</span>
                )}
              </div>

              {/* Content */}
              <div className={`flex flex-col flex-1 ${isDueToday ? 'pl-1' : ''}`}>
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-medium transition-all ${
                      isCompleted
                        ? 'text-on-background line-through opacity-70 group-hover:opacity-100'
                        : isDueToday
                        ? 'text-on-background font-bold group-hover:text-primary'
                        : 'text-on-background group-hover:text-primary'
                    }`}
                  >
                    {mission.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-opacity ${
                      isCompleted
                        ? 'bg-xp-gold/20 text-on-surface-variant opacity-70 group-hover:opacity-100'
                        : isDueToday
                        ? 'bg-xp-gold text-on-background'
                        : 'bg-xp-gold/30 text-on-background'
                    }`}
                  >
                    +{mission.xpReward} XP
                  </span>
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isCompleted
                      ? 'text-on-surface-variant opacity-70 group-hover:opacity-100'
                      : isDueToday
                      ? 'text-error font-bold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {mission.dueLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
