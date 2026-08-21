'use client';

import React, { useState } from 'react';
import { HeatmapCell } from './types';

interface ActivityHeatmapProps {
  cells: HeatmapCell[];
  totalActivities?: number;
  currentStreak?: number;
  longestStreak?: number;
  totalXp?: number;
}

export function ActivityHeatmap({
  cells,
  totalActivities = 142,
  currentStreak = 12,
  longestStreak = 18,
  totalXp = 2450,
}: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const getCellColorClass = (intensity: number) => {
    switch (intensity) {
      case 1:
        return 'bg-secondary/20 hover:bg-secondary/30';
      case 2:
        return 'bg-secondary/40 hover:bg-secondary/50';
      case 3:
        return 'bg-secondary/70 hover:bg-secondary/80';
      case 4:
        return 'bg-secondary hover:bg-secondary-container';
      default:
        return 'bg-surface-container-high border border-outline-variant/30 hover:border-outline-variant';
    }
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant group-hover:text-on-background transition-colors">
          Learning Activity
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-on-background">{totalActivities}</span>
            <span className="text-on-surface-variant">Activities</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-on-background">{currentStreak} days</span>
            <span className="text-on-surface-variant">Current Streak</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-on-background">{longestStreak} days</span>
            <span className="text-on-surface-variant">Longest Streak</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-secondary">{totalXp.toLocaleString()}</span>
            <span className="text-on-surface-variant">XP Earned</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-outline-variant scrollbar-track-transparent">
        <div className="min-w-[750px]">
          {/* Months header */}
          <div className="flex text-[10px] text-on-surface-variant mb-1 ml-6 justify-between pr-2 font-medium">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>

          {/* Grid rows */}
          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 text-[10px] text-on-surface-variant pt-2 pr-1 w-5 font-medium">
              <span className="h-3 leading-3">Mon</span>
              <span className="h-3 mt-3 leading-3">Wed</span>
              <span className="h-3 mt-3 leading-3">Fri</span>
            </div>

            {/* 364 Cells Container (7 rows high, flex-wrap column layout) */}
            <div className="flex flex-col flex-wrap h-28 gap-1 content-start flex-1 relative">
              {cells.map((cell) => (
                <button
                  key={cell.dayIndex}
                  type="button"
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3 h-3 rounded-sm ${getCellColorClass(
                    cell.intensity
                  )} transition-colors focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:ring-offset-1 focus:ring-offset-background`}
                  aria-label={`${cell.activitiesCount} activities on ${cell.date}`}
                  title={`${cell.date}: ${cell.activitiesCount} activities`}
                />
              ))}
            </div>
          </div>

          {/* Hover Status & Legend */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-on-surface-variant font-medium">
            <div>
              {hoveredCell ? (
                <span className="font-semibold text-on-background">
                  {hoveredCell.date}: {hoveredCell.activitiesCount} {hoveredCell.activitiesCount === 1 ? 'activity' : 'activities'}
                </span>
              ) : (
                <span>Hover over a cell to see daily activity</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-surface-container-high border border-outline-variant/30" />
              <div className="w-3 h-3 rounded-sm bg-secondary/20" />
              <div className="w-3 h-3 rounded-sm bg-secondary/40" />
              <div className="w-3 h-3 rounded-sm bg-secondary/70" />
              <div className="w-3 h-3 rounded-sm bg-secondary" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
