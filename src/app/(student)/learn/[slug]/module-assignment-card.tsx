'use client'

import React from 'react'
import { Lock, FileText, CheckCircle2, Zap, ArrowRight } from 'lucide-react'
import { Assignment } from './types'

interface ModuleAssignmentCardProps {
  assignment: Assignment
  slug?: string
  onOpenAssignment?: (assignmentId: string) => void
}

export function ModuleAssignmentCard({
  assignment,
  slug,
  onOpenAssignment,
}: ModuleAssignmentCardProps) {
  const isLocked = assignment.status === 'locked'
  const isCompleted = assignment.status === 'completed'
  const isInProgress = assignment.status === 'in_progress'

  const handleClick = () => {
    if (isLocked) return
    if (onOpenAssignment) {
      onOpenAssignment(assignment.assignmentId)
    }
  }

  // Border & status badge styles
  const getStatusStyles = () => {
    switch (assignment.status) {
      case 'completed':
        return {
          leftBorder: 'bg-emerald-600',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200',
          label: 'Completed',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        }
      case 'in_progress':
        return {
          leftBorder: 'bg-primary',
          badgeClass: 'bg-primary/10 text-primary',
          label: 'In Progress',
          icon: <FileText className="w-3.5 h-3.5 text-primary shrink-0" />,
        }
      case 'not_started':
        return {
          leftBorder: 'bg-surface-variant',
          badgeClass: 'bg-surface-container-high text-on-surface-variant',
          label: 'Not Started',
          icon: <FileText className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />,
        }
      case 'locked':
      default:
        return {
          leftBorder: 'bg-outline-variant/50',
          badgeClass: 'bg-surface-container text-on-surface-variant opacity-75',
          label: 'Locked',
          icon: <Lock className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />,
        }
    }
  }

  const statusInfo = getStatusStyles()

  return (
    <div
      onClick={handleClick}
      role={isLocked ? 'region' : 'button'}
      tabIndex={isLocked ? -1 : 0}
      className={`mt-4 bg-surface-bright rounded-xl p-4 border border-outline-variant/40 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden transition-all ${
        isLocked
          ? 'opacity-70 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-[0.99]'
      }`}
    >
      {/* Accent Indicator Left Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusInfo.leftBorder}`} />

      <div className="pl-2 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold text-[11px] uppercase tracking-wider">
            Assignment
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <Zap className="w-3 h-3 fill-primary" />
            +{assignment.xpReward} XP
          </span>
        </div>

        <h4 className="font-bold text-sm md:text-base text-on-background">
          {assignment.title}
        </h4>
      </div>

      {/* Right Side: Status Badge & CTA */}
      <div className="pl-2 sm:pl-0 flex items-center gap-3 self-end sm:self-center">
        <div
          className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${statusInfo.badgeClass}`}
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>

        {!isLocked && (
          <div className="text-primary hover:text-primary-container p-1 hidden sm:block">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}
