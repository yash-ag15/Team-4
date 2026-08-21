import { mockAssessmentContext, mockCoachBrief, mockReviewFor } from '@/mocks/ai-coach'
import type { AiReview, AiReviewPayload } from '@/contracts/ai-coach'
import { ReviewCard } from '@/components/ai/review-card'
import { CoachBrief } from '@/components/ai/coach-brief'

export const metadata = { title: 'AI Coach preview' }

/** Mirrors the contract's own `toAiReview` so this page needs no server/DB/API key. */
function toPreviewReview(payload: AiReviewPayload, id: string): AiReview {
  const track = mockAssessmentContext.track
  const trackMultiplier = track === 'optional' ? 1.5 : 1
  const suggestedXp = Math.round(
    mockAssessmentContext.xpAward * (payload.suggestedScore / mockAssessmentContext.maxScore) * trackMultiplier,
  )

  return {
    ...payload,
    id,
    submissionId: null,
    assessmentId: mockAssessmentContext.id,
    assessmentTitle: mockAssessmentContext.title,
    courseTitle: mockAssessmentContext.courseTitle,
    suggestedXp,
    maxScore: mockAssessmentContext.maxScore,
    xpAward: mockAssessmentContext.xpAward,
    track,
    model: 'claude-opus-5',
    latencyMs: 14200,
    isPreview: true,
    createdAt: '2026-08-21T06:42:00.000Z',
  }
}

const SAMPLES: { label: string; content: string }[] = [
  { label: 'Strong submission', content: 'x'.repeat(600) },
  { label: 'Thin submission', content: 'x'.repeat(200) },
  { label: 'Empty / too short', content: 'x'.repeat(10) },
]

export default function AiCoachPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Coach — component preview</h1>
          <p className="mt-2 text-sm text-gray-500">
            Renders <code className="rounded bg-gray-100 px-1">ReviewCard</code> and{' '}
            <code className="rounded bg-gray-100 px-1">CoachBrief</code> directly against{' '}
            <code className="rounded bg-gray-100 px-1">src/mocks/ai-coach.ts</code> — no API
            key, no backend.
          </p>
        </div>

        <section className="flex flex-col gap-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Dashboard widget
          </h2>
          <CoachBrief brief={mockCoachBrief} />
        </section>

        <section className="flex flex-col gap-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Review card — by submission length
          </h2>
          {SAMPLES.map((sample) => (
            <div key={sample.label} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-gray-700">{sample.label}</h3>
              <ReviewCard
                review={toPreviewReview(mockReviewFor(sample.content), `preview-${sample.label}`)}
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
