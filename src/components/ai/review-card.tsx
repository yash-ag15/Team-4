import type { AiReview } from '@/contracts/ai-coach'
import { PredictedScore } from './predicted-score'
import { StrengthsWeaknesses } from './strengths-weaknesses'
import { RubricTable } from './rubric-table'
import { ActionItems } from './action-items'

const CONFIDENCE_STYLES: Record<AiReview['confidence'], string> = {
  high: 'border-gray-300 bg-gray-50 text-gray-700',
  medium: 'border-gray-300 bg-gray-50 text-gray-700',
  low: 'border-[#E8DA4D] bg-[#E8DA4D]/25 text-gray-800',
}

export function ReviewCard({ review }: { review: AiReview }) {
  const isLowConfidence = review.confidence === 'low'
  const latencySeconds = (review.latencyMs / 1000).toFixed(1)

  return (
    <article
      className={`flex flex-col gap-5 rounded-md border p-5 ${
        isLowConfidence ? 'border-[#E8DA4D] bg-[#E8DA4D]/10' : 'border-gray-200'
      }`}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#2596BE] px-2 py-0.5 text-xs font-semibold text-white">
            AI Coach
          </span>
          <span className="text-sm text-gray-500">
            {review.model} · {latencySeconds}s
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[review.confidence]}`}
          >
            confidence: {review.confidence}
          </span>
        </div>
        <p className="rounded-md border-l-4 border-l-[#2596BE] bg-[#2596BE]/5 px-3 py-2 text-sm font-medium text-gray-900">
          This is the AI Coach&apos;s assessment. Your mentor makes the final call.
        </p>
        {isLowConfidence && (
          <p className="text-sm text-gray-600">
            The coach had limited signal on this submission — treat this as a rough read, not
            a firm assessment.
          </p>
        )}
      </header>

      <p className="text-sm text-gray-700">{review.summary}</p>

      <PredictedScore review={review} />
      <StrengthsWeaknesses strengths={review.strengths} weaknesses={review.weaknesses} />
      <RubricTable lines={review.rubricBreakdown} />
      <ActionItems items={review.actionItems} />
    </article>
  )
}
