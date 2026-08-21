'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
} from 'lucide-react'
import { Module } from './types'
import { ModuleAssignmentCard } from './module-assignment-card'

interface ModuleAccordionProps {
  modules: Module[]
  slug?: string
  loading?: boolean
  expandedModuleId?: string | null
  onToggleModule?: (moduleId: string) => void
  onSelectLesson?: (lessonId: string) => void
  onOpenAssignment?: (assignmentId: string) => void
}

export function ModuleAccordion({
  modules,
  slug,
  loading = false,
  expandedModuleId,
  onToggleModule,
  onSelectLesson,
  onOpenAssignment,
}: ModuleAccordionProps) {
  // Find first incomplete module as default expanded
  const defaultExpandedId =
    modules.find((m) => m.completedPct < 100)?.moduleId || modules[0]?.moduleId

  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>({
    [defaultExpandedId]: true,
  })

  const toggle = (moduleId: string) => {
    if (onToggleModule) {
      onToggleModule(moduleId)
    } else {
      setLocalExpanded((prev) => ({
        ...prev,
        [moduleId]: !prev[moduleId],
      }))
    }
  }

  const isExpanded = (moduleId: string) => {
    if (expandedModuleId !== undefined) {
      return expandedModuleId === moduleId
    }
    return localExpanded[moduleId] ?? false
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 animate-pulse flex flex-col gap-3"
          >
            <div className="h-6 bg-surface-variant rounded w-1/3" />
            <div className="h-4 bg-surface-variant rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {modules.map((module, idx) => {
        const expanded = isExpanded(module.moduleId)
        const isCompleted = module.completedPct === 100
        const completedLessonsCount = module.lessons.filter((l) => l.isCompleted).length
        const totalItemsCount = module.lessons.length + 1 // lessons + assignment

        return (
          <div
            key={module.moduleId}
            id={`module-${module.moduleId}`}
            className={`bg-surface-container-lowest rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
              expanded
                ? 'border-primary/40 ring-1 ring-primary/10 shadow-sm'
                : 'border-outline-variant/40 hover:border-outline-variant'
            }`}
          >
            {/* Module Accordion Header */}
            <button
              type="button"
              onClick={() => toggle(module.moduleId)}
              className="w-full p-5 md:p-6 flex items-center justify-between gap-4 text-left hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-base md:text-lg text-on-background">
                    {module.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {completedLessonsCount} of {module.lessons.length} lessons complete
                    {module.assignment.status === 'completed' ? ' · Assignment complete' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-block text-xs font-bold text-primary">
                  {module.completedPct}%
                </span>
                <div className="p-1 rounded-full text-on-surface-variant hover:text-on-background">
                  {expanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Accordion Expanded Content */}
            {expanded && (
              <div className="px-5 md:px-6 pb-6 pt-2 border-t border-outline-variant/30 flex flex-col gap-3">
                {/* Lesson Rows */}
                <div className="flex flex-col gap-1.5 divide-y divide-outline-variant/20">
                  {module.lessons.map((lesson, lessonIdx) => (
                    <button
                      key={lesson.lessonId}
                      type="button"
                      onClick={() => onSelectLesson?.(lesson.lessonId)}
                      className="w-full py-3 px-2 rounded-lg flex items-center justify-between text-left hover:bg-surface-container transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary fill-primary/10 shrink-0" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-outline-variant group-hover:text-primary transition-colors shrink-0" />
                        )}
                        <span
                          className={`text-sm md:text-base font-medium transition-colors ${
                            lesson.isCompleted
                              ? 'text-on-background'
                              : 'text-on-surface group-hover:text-primary'
                          }`}
                        >
                          {lessonIdx + 1}. {lesson.title}
                        </span>
                      </div>

                      <div className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Start</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Per-Module Assignment Card */}
                <ModuleAssignmentCard
                  assignment={module.assignment}
                  slug={slug}
                  onOpenAssignment={onOpenAssignment}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
