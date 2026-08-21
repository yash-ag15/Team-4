'use client';

import React from 'react';
import { ProgressSummary } from './types';

interface ProgressCardProps {
  progress: ProgressSummary;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  const coursesPct = Math.round((progress.courses.completed / progress.courses.total) * 100);
  const assignmentsPct = Math.round((progress.assignments.completed / progress.assignments.total) * 100);
  const projectsPct = Math.round((progress.projects.completed / progress.projects.total) * 100);
  const mentoringPct = Math.round((progress.mentoring.completed / progress.mentoring.total) * 100);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
        Overall Progress
      </h3>

      <div className="flex items-center gap-6">
        {/* Circular Progress Gauge */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center group cursor-default">
          <svg
            className="w-full h-full transform -rotate-90 transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 36 36"
          >
            <path
              className="text-surface-container-high"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray="100, 100"
              strokeWidth="3"
            />
            <path
              className="text-secondary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${progress.overallPct}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute flex flex-col items-center transition-opacity duration-300">
            <span className="text-2xl font-bold text-on-background">{progress.overallPct}%</span>
            <span className="text-[10px] text-on-surface-variant text-center px-2 leading-tight">
              Programme
              <br />
              Complete
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Courses */}
          <div className="flex flex-col gap-1 group">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-background group-hover:text-secondary transition-colors font-medium">
                Courses
              </span>
              <span className="text-on-surface-variant font-medium">
                {progress.courses.completed}/{progress.courses.total}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500 ease-out group-hover:bg-secondary-container"
                style={{ width: `${coursesPct}%` }}
              />
            </div>
          </div>

          {/* Assignments */}
          <div className="flex flex-col gap-1 group">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-background group-hover:text-secondary transition-colors font-medium">
                Assignments
              </span>
              <span className="text-on-surface-variant font-medium">
                {progress.assignments.completed}/{progress.assignments.total}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500 ease-out group-hover:bg-secondary-container"
                style={{ width: `${assignmentsPct}%` }}
              />
            </div>
          </div>

          {/* Projects */}
          <div className="flex flex-col gap-1 group">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-background group-hover:text-secondary transition-colors font-medium">
                Projects
              </span>
              <span className="text-on-surface-variant font-medium">
                {progress.projects.completed}/{progress.projects.total}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500 ease-out group-hover:bg-secondary-container"
                style={{ width: `${projectsPct}%` }}
              />
            </div>
          </div>

          {/* Mentoring */}
          <div className="flex flex-col gap-1 group">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-background group-hover:text-secondary transition-colors font-medium">
                Mentoring
              </span>
              <span className="text-on-surface-variant font-medium">
                {progress.mentoring.completed}/{progress.mentoring.total}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500 ease-out group-hover:bg-secondary-container"
                style={{ width: `${mentoringPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
