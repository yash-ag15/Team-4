'use client';

import React from 'react';
import { StudyPlanItem } from './types';

interface StudyPlanCardProps {
  items: StudyPlanItem[];
  onViewCalendar?: () => void;
  onTaskClick?: (taskId: string, title: string) => void;
}

export function StudyPlanCard({ items, onViewCalendar, onTaskClick }: StudyPlanCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
          Your Study Plan
        </h3>
        <button
          type="button"
          onClick={onViewCalendar}
          className="text-xs text-secondary hover:text-secondary-container hover:underline focus:outline-none focus:ring-2 focus:ring-secondary/50 rounded px-1 transition-colors font-bold"
        >
          View Full Calendar
        </button>
      </div>

      <div className="relative pl-4 mt-2">
        {/* Timeline connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-outline-variant/50" />

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-[20px] top-1.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest transition-all ${
                  item.isCurrent
                    ? 'bg-secondary group-hover:scale-125'
                    : 'bg-outline-variant group-hover:bg-secondary/50'
                }`}
              />

              <h4
                className={`text-xs font-bold uppercase tracking-wide ${
                  item.isCurrent ? 'text-secondary' : 'text-on-surface-variant'
                }`}
              >
                {item.timeframe}
              </h4>

              <div className="mt-1 flex flex-col gap-2">
                {item.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick?.(task.id, task.title)}
                    className={`w-full text-left p-2 rounded text-sm border border-outline-variant hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors text-on-background active:scale-[0.99] ${
                      item.isCurrent
                        ? 'bg-surface-container-low hover:bg-surface-container'
                        : 'bg-surface-container hover:bg-surface-container-low'
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
