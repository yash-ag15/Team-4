'use client'

import { useState } from 'react'
import type { RubricLine } from '@/contracts/ai-coach'

export function RubricTable({ lines }: { lines: RubricLine[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-md border border-gray-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Rubric breakdown
        </span>
        <span aria-hidden className="text-[#2596BE]">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="flex flex-col divide-y divide-gray-100 border-t border-gray-200">
          {lines.map((line, i) => (
            <div key={i} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">{line.criterion}</span>
                <span className="whitespace-nowrap text-sm font-medium text-[#2596BE]">
                  {line.score} / {line.maxScore}
                </span>
              </div>
              <p className="text-sm text-gray-500">{line.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
