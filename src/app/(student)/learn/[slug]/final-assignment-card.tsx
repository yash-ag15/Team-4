'use client'

import React from 'react'
import { Trophy, Lock, Unlock, Zap, CheckCircle2, ArrowRight } from 'lucide-react'
import { Assignment } from './types'

interface FinalAssignmentCardProps {
  assignment: Assignment
  onOpenAssignment?: (assignmentId: string) => void
}

export function FinalAssignmentCard({
  assignment,
  onOpenAssignment,
}: FinalAssignmentCardProps) {
  const isLocked = assignment.status === 'locked'
  const isCompleted = assignment.status === 'completed'
  const isInProgress = assignment.status === 'in_progress'

  const handleAction = () => {
    if (!isLocked && onOpenAssignment) {
      onOpenAssignment(assignment.assignmentId)
    }
  }

  const getButtonLabel = () => {
    if (isCompleted) return 'Review Project'
    if (isInProgress) return 'Continue Assignment'
    return 'Start Final Assignment'
  }

  return (
    <section className="mt-8">
      <div
        className={`rounded-2xl border p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden transition-all ${
          isLocked
            ? 'bg-surface-container-lowest/80 border-outline-variant/40'
            : isCompleted
            ? 'bg-surface-container-lowest border-emerald-600/40 shadow-sm'
            : 'bg-surface-container-lowest border-primary/40 shadow-md ring-2 ring-primary/10'
        }`}
      >
        {/* Top Trophy Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${
            isLocked
              ? 'bg-surface-container text-on-surface-variant/60'
              : isCompleted
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 scale-105'
              : 'bg-secondary-fixed/40 text-xp-gold scale-110 shadow-xs'
          }`}
        >
          <Trophy
            className={`w-8 h-8 ${
              isLocked
                ? 'opacity-50'
                : isCompleted
                ? 'fill-emerald-600/20'
                : 'text-xp-gold fill-xp-gold/30'
            }`}
          />
        </div>

        {/* Title & XP */}
        <div className="flex flex-col items-center gap-1.5 max-w-md">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
            Capstone Project
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-on-background">
            {assignment.title}
          </h3>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mt-1">
            <Zap className="w-3.5 h-3.5 fill-primary" />
            <span>+{assignment.xpReward} XP upon completion</span>
          </div>
        </div>

        {/* Lock / Unlock State Pill */}
        <div className="my-5">
          {isLocked ? (
            <div className="flex items-center gap-2 text-on-surface-variant font-medium text-xs md:text-sm bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
              <Lock className="w-4 h-4 text-on-surface-variant/70" />
              <span>Complete all modules to unlock</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs md:text-sm bg-emerald-100 dark:bg-emerald-950 px-4 py-2 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Final Project Completed & Reviewed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <Unlock className="w-4 h-4 text-primary" />
              <span>Unlocked — Ready to submit</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isLocked}
          onClick={handleAction}
          className={`w-full sm:w-auto font-bold text-xs md:text-sm uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all duration-200 active:scale-95 ${
            isLocked
              ? 'bg-surface-container-highest text-on-surface-variant opacity-60 cursor-not-allowed border-2 border-transparent'
              : isCompleted
              ? 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high border-b-2 border-surface-dim'
              : 'bg-primary text-on-primary hover:bg-primary-container border-b-2 border-primary-container shadow-sm hover:shadow-md'
          }`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </section>
  )
}
