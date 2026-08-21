'use client'

import React from 'react'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { Module } from './types'

interface ModuleStepperProps {
  modules: Module[]
  activeModuleId: string | null
  onSelectModule: (moduleId: string) => void
}

export function ModuleStepper({
  modules,
  activeModuleId,
  onSelectModule,
}: ModuleStepperProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-3 sticky top-24 self-start w-72 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          Course Roadmap
        </h3>
        <span className="text-xs text-on-surface-variant font-medium">
          {modules.length} Modules
        </span>
      </div>

      <nav className="flex flex-col gap-1 relative">
        {modules.map((module, idx) => {
          const isCompleted = module.completedPct === 100
          const isActive = module.moduleId === activeModuleId
          const completedLessonsCount = module.lessons.filter((l) => l.isCompleted).length
          const totalItems = module.lessons.length + 1 // lessons + assignment

          return (
            <button
              key={module.moduleId}
              type="button"
              onClick={() => onSelectModule(module.moduleId)}
              className={`flex items-start gap-3 p-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                  : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              {/* Stepper Node Icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                      isActive
                        ? 'border-primary text-primary bg-background'
                        : 'border-outline-variant text-on-surface-variant bg-surface-variant'
                    }`}
                  >
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Module Text & Progress */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                  className={`text-xs truncate ${
                    isActive
                      ? 'text-primary font-bold'
                      : isCompleted
                      ? 'text-on-background font-semibold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {module.title}
                </span>
                <span className="text-[10px] text-on-surface-variant/80">
                  {isCompleted
                    ? '100% complete'
                    : `${completedLessonsCount}/${module.lessons.length} lessons`}
                </span>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
