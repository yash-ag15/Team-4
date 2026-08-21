import type { AiReview } from '@/contracts/ai-coach'
import { ScoreRing } from './score-ring'

type PredictedScoreReview = Pick<
  AiReview,
  'suggestedScore' | 'maxScore' | 'suggestedXp' | 'xpAward' | 'track'
>

export function PredictedScore({ review }: { review: PredictedScoreReview }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-[#2596BE]/20 bg-[#2596BE]/5 px-6 py-6">
      <span className="text-sm font-medium uppercase tracking-wide text-gray-500">
        Suggested score
      </span>
      <ScoreRing value={review.suggestedScore} max={review.maxScore} />
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E8DA4D] bg-[#E8DA4D]/25 px-2 py-0.5 text-sm">
          ≈ <span className="font-semibold text-gray-900">{review.suggestedXp} XP</span>
        </span>
        <span className="text-sm text-gray-500">/ {review.xpAward} max</span>
        {review.track === 'optional' && (
          <span className="rounded-full border border-[#E8DA4D] bg-[#E8DA4D]/25 px-2 py-0.5 text-xs font-medium text-gray-800">
            1.5x
          </span>
        )}
      </div>
    </div>
  )
}
