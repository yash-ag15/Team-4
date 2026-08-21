'use client'

import React from 'react'

export type StudentFlag = 'overdue' | 'inactive' | 'stalled' | 'awaiting_resubmit'

interface FlagChipProps {
  flag: StudentFlag
  customReason?: string
}

const FLAG_CONFIG: Record<
  StudentFlag,
  { label: string; bg: string; text: string; border: string; dot: string; defaultReason: string; icon: string }
> = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-rose-50/80 hover:bg-rose-100/90',
    text: 'text-rose-700',
    border: 'border-rose-200/80 shadow-xs shadow-rose-100',
    dot: 'bg-rose-500',
    defaultReason: 'Mandatory course or assessment is overdue',
    icon: '⚠',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-100/90 hover:bg-slate-200/80',
    text: 'text-slate-700',
    border: 'border-slate-300/70',
    dot: 'bg-slate-400',
    defaultReason: 'No learning activity in the last 7+ days',
    icon: '⏳',
  },
  stalled: {
    label: 'Stalled',
    bg: 'bg-amber-50/90 hover:bg-amber-100/90',
    text: 'text-amber-800',
    border: 'border-amber-200/90 shadow-xs shadow-amber-100',
    dot: 'bg-[#e8da4d]',
    defaultReason: 'Progress under 25% on a course enrolled >14 days ago',
    icon: '⏸',
  },
  awaiting_resubmit: {
    label: 'Awaiting Resubmit',
    bg: 'bg-pink-50/90 hover:bg-pink-100/90',
    text: 'text-pink-700',
    border: 'border-pink-200/80 shadow-xs shadow-pink-100',
    dot: 'bg-pink-500',
    defaultReason: 'Changes requested on submission untouched for 3+ days',
    icon: '✍',
  },
}

export function FlagChip({ flag, customReason }: FlagChipProps) {
  const config = FLAG_CONFIG[flag] ?? FLAG_CONFIG.inactive
  const reason = customReason || config.defaultReason

  return (
    <div className="group relative inline-flex items-center">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border backdrop-blur-xs transition-all duration-200 cursor-help ${config.bg} ${config.text} ${config.border} hover:scale-102`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
        <span>{config.label}</span>
      </span>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-52 rounded-xl bg-slate-900/95 backdrop-blur-md px-3 py-2 text-center text-xs text-slate-100 shadow-xl group-hover:block z-50 transition-all border border-slate-800">
        <p className="font-sans font-medium leading-snug">{reason}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  )
}
