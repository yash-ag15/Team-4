import Link from 'next/link'
import type { CoachBrief as CoachBriefData } from '@/contracts/ai-coach'

export function CoachBrief({ brief }: { brief: CoachBriefData }) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-gray-200 p-5">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[#2596BE]">
          AI Coach
        </h2>
        <p className="mt-1 text-base font-medium text-gray-900">{brief.headline}</p>
      </div>

      {brief.strengths.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#2596BE]">
            Strengths
          </h3>
          <ul className="mt-1 flex flex-col gap-1">
            {brief.strengths.map((item, i) => (
              <li key={i} className="text-sm text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.focusAreas.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-700">
            Focus areas
          </h3>
          <ul className="mt-1 flex flex-col gap-1">
            {brief.focusAreas.map((item, i) => (
              <li key={i} className="text-sm text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.nextActions.length > 0 && (
        <div className="flex flex-col gap-2">
          {brief.nextActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="rounded-md bg-[#2596BE] px-3 py-2 text-center text-sm font-medium text-white hover:bg-[#2596BE]/90"
            >
              {action.label} →
            </Link>
          ))}
        </div>
      )}

      <p className="rounded-md border-l-4 border-l-[#E8DA4D] bg-[#E8DA4D]/15 px-3 py-2 text-sm text-gray-700">
        {brief.nudge}
      </p>
    </section>
  )
}
