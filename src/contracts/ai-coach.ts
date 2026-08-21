import { z } from 'zod'
import { defineContract } from './_kit'
import { applyTrack, suggestedXpFromScore } from '@/lib/xp'
import {
  mockAssessmentContext,
  mockCoachBrief,
  mockCourseDraft,
  mockReviewFor,
} from '@/mocks/ai-coach'

/**
 * FEATURE 05 — THE AI COACH. The USP.
 *
 *   Backend  `feature/ai-coach-back`   Yash   -> src/server/ai-coach.ts, src/lib/ai.ts
 *   Frontend `feature/ai-coach-front`  Riya   -> src/components/ai/*, src/lib/ai-prompts.ts
 *
 * Design doc: plans/katalyst/ai-coach.md
 * Task lists: plans/katalyst/features/05-ai-coach/{backend,frontend}.md
 *
 * ---------------------------------------------------------------------------
 * THE INVARIANT
 * ---------------------------------------------------------------------------
 * The AI Coach ADVISES. The mentor DECIDES.
 *
 * `suggestedScore` and `suggestedXp` below are advice. They are stored on `ai_reviews`
 * and denormalised onto `submissions.aiScore` / `.aiXpSuggested` for list views. They
 * NEVER reach `xp_events`. XP for a submission is written in exactly one place:
 * `src/server/mentor.ts` -> `decide()`, keyed `submission:<submissionId>`.
 *
 * `src/server/ai-coach.ts` must never import `xpEvents` or call `awardXp()`.
 *
 * ---------------------------------------------------------------------------
 * NEITHER BRANCH EDITS THIS FILE
 * ---------------------------------------------------------------------------
 * It lands on `feature/foundation`. Adding an OPTIONAL output field is free. Anything
 * else — renaming, retyping, making a field required — is a breaking change: make it on
 * `feature/ai-coach` (the integration branch), both of us rebase, and post
 * `CONTRACT CHANGE: ai-coach.<op> — <what> — <why>` in the channel.
 */

// ---------------------------------------------------------------------------
// 1. The model's output schema
// ---------------------------------------------------------------------------

export const RubricLine = z.object({
  criterion: z.string(),
  score: z.number().int(),
  maxScore: z.number().int(),
  comment: z.string(),
})
export type RubricLine = z.infer<typeof RubricLine>

export const ReviewConfidence = z.enum(['low', 'medium', 'high'])
export type ReviewConfidence = z.infer<typeof ReviewConfidence>

/**
 * THIS EXACT OBJECT becomes the responseJsonSchema in the model call:
 *
 *   generateJson({ system, prompt, schema: AiReviewPayload })
 *
 * One definition means the model literally cannot return a shape Riya's UI does not
 * expect. Adding a field here changes what the model is asked to produce — so it is a
 * contract change AND a prompt change, and it needs both of us.
 *
 * NOTE: `suggestedXp` is deliberately NOT here. The model GRADES; code converts the grade
 * to XP via `suggestedXpFromScore()`. Letting the model pick both invites it to hand back
 * an XP number that disagrees with the score it just gave.
 *
 * `.min(1)` on the three arrays is load-bearing: it stops the model returning an empty
 * strengths list on a weak submission, which would render as an empty column.
 */
export const AiReviewPayload = z.object({
  /** 2-3 sentences, addressed to the student as "you". The first thing they read. */
  summary: z.string(),
  /** Specific, quoting the student's own words. Never "good structure". */
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  /** Every weakness must be answered by something here that they can do today. */
  actionItems: z.array(z.string()).min(1),
  /** One line per rubric criterion. The model must not invent criteria. */
  rubricBreakdown: z.array(RubricLine),
  /** Out of `maxScore`. */
  suggestedScore: z.number().int(),
  confidence: ReviewConfidence,
})
export type AiReviewPayload = z.infer<typeof AiReviewPayload>

// ---------------------------------------------------------------------------
// 2. The wire shape — what Riya renders
// ---------------------------------------------------------------------------

/**
 * The payload plus everything the UI needs to draw the card without a second request.
 *
 * `maxScore`, `xpAward` and `track` are echoed back on purpose: `<PredictedScore>` needs
 * the denominator for the ring and the 1.5x chip, and re-fetching the assessment just to
 * draw a ring would be a wasted round trip.
 */
export const AiReview = AiReviewPayload.extend({
  id: z.string(),
  /** Null for a `preview` run — a draft has no submission row yet. */
  submissionId: z.string().nullable(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  courseTitle: z.string(),

  /** COMPUTED from suggestedScore. Advice only — never written to xp_events. */
  suggestedXp: z.number().int(),
  maxScore: z.number().int(),
  /**
   * The EFFECTIVE ceiling the mentor's finalXp is clamped to, already track-adjusted
   * (an optional course multiplies it by 1.5). Shown next to the XP input as "/ N max".
   * `src/server/mentor.ts` -> decide() clamps to THIS number, not to the raw
   * assessment.xpAward, so the mentor never accepts a suggestion the server then reduces.
   */
  xpAward: z.number().int(),
  /** Drives the 1.5x chip next to the predicted XP. */
  track: z.enum(['mandatory', 'optional']),

  /** Shown in the card header — "gemini-2.5-flash · 6.2s · confidence: high". */
  model: z.string(),
  latencyMs: z.number().int(),
  /** True for a draft preview. `mentor.getForReview()` only ever shows `false`. */
  isPreview: z.boolean(),
  createdAt: z.string(), // ISO
})
export type AiReview = z.infer<typeof AiReview>

/** Build the wire shape from a payload + assessment context. Used by the mocks and by
 *  `src/server/ai-coach.ts`, so the two cannot drift. */
const toAiReview = (
  payload: AiReviewPayload,
  opts: { id: string; submissionId: string | null; isPreview: boolean; latencyMs: number },
): AiReview => ({
  ...payload,
  ...opts,
  assessmentId: mockAssessmentContext.id,
  assessmentTitle: mockAssessmentContext.title,
  courseTitle: mockAssessmentContext.courseTitle,
  // Mirrors src/server/ai-coach.ts -> xpCeiling()/xpFor() EXACTLY. If these two ever
  // disagree, a page built against the mock shows different numbers once the handler goes
  // live, which is the precise failure the mock layer exists to prevent.
  suggestedXp: Math.min(
    suggestedXpFromScore(
      payload.suggestedScore,
      mockAssessmentContext.maxScore,
      mockAssessmentContext.xpAward,
      mockAssessmentContext.track,
    ),
    applyTrack(mockAssessmentContext.xpAward, mockAssessmentContext.track),
  ),
  maxScore: mockAssessmentContext.maxScore,
  /** The EFFECTIVE (track-adjusted) ceiling, same as the live handler returns. */
  xpAward: applyTrack(mockAssessmentContext.xpAward, mockAssessmentContext.track),
  track: mockAssessmentContext.track,
  model: 'gemini-3.5-flash (mock)',
  createdAt: '2026-08-21T06:42:00.000Z',
})

// ---------------------------------------------------------------------------
// 3. Ops
// ---------------------------------------------------------------------------

/**
 * THE RETENTION HOOK. A student pastes a draft and asks "what would I get?" before
 * submitting. Not persisted, repeatable, and the score visibly moves as they improve.
 *
 * The mock picks its review by draft length, so Riya can demo the whole ask -> improve ->
 * ask again loop with no API key and no backend. Deterministic: the same draft always
 * scores the same.
 */
export const preview = defineContract({
  method: 'POST',
  path: '/api/ai-coach/preview',
  auth: 'user',
  summary: 'Review a DRAFT before submitting. Not persisted. Rate limited.',
  input: z.object({
    assessmentId: z.string(),
    /**
     * 50 is the "Ask the AI Coach" button's enable threshold — keep the UI and the
     * contract on the same number. 8000 is the prompt-cost cap; above it the handler
     * returns VALIDATION_ERROR, not a truncated review.
     */
    content: z.string().min(50).max(8000),
  }),
  output: z.object({ review: AiReview }),
  mock: ({ content }) => ({
    review: toAiReview(mockReviewFor(content), {
      id: 'review-preview',
      submissionId: null,
      isPreview: true,
      latencyMs: 12400,
    }),
  }),
})

/**
 * The real review. Called by `submissions.create()` AFTER the submission row has been
 * inserted and committed — a student's work is never lost because the coach was slow.
 *
 * Side effects (Yash's handler, not the frontend's concern):
 *   - inserts an `ai_reviews` row
 *   - sets `submissions.status = 'ai_reviewed'`
 *   - denormalises `aiScore` / `aiXpSuggested` onto the submission for the mentor queue
 */
export const review = defineContract({
  method: 'POST',
  path: '/api/ai-coach/review',
  auth: 'user',
  summary: 'Review a submitted assessment. Persists, and moves it into the mentor queue.',
  input: z.object({ submissionId: z.string() }),
  output: z.object({ review: AiReview }),
  mock: ({ submissionId }) => ({
    review: toAiReview(mockReviewFor('x'.repeat(600)), {
      id: 'review-1',
      submissionId,
      isPreview: false,
      latencyMs: 18700,
    }),
  }),
})

export const CoachBriefAction = z.object({ label: z.string(), href: z.string() })

/**
 * The personalised progress update on the student dashboard. Looks across ALL their work:
 * recurring strengths, recurring weaknesses, what to pick up next.
 *
 * Cached per user for an hour — a dashboard that costs a model call on every render will
 * run us out of both budget and patience.
 */
export const CoachBrief = z.object({
  headline: z.string(),
  strengths: z.array(z.string()),
  focusAreas: z.array(z.string()),
  nextActions: z.array(CoachBriefAction),
  nudge: z.string(),
  generatedAt: z.string(), // ISO
})
export type CoachBrief = z.infer<typeof CoachBrief>

export const brief = defineContract({
  method: 'GET',
  path: '/api/ai-coach/brief',
  auth: 'user',
  summary: 'Personalised progress brief for the dashboard. Cached 1h per user.',
  input: z.object({}),
  output: z.object({ brief: CoachBrief }),
  mock: () => ({ brief: mockCoachBrief }),
})

// ---------------------------------------------------------------------------
// 4. Good-to-have — feature 13, post-Gate-C only
// ---------------------------------------------------------------------------

/**
 * Mentor authoring copilot. Same machinery as `review` — `generateJson()` with a different
 * schema and a different prompt — which is why it costs ~40 minutes rather than two hours.
 *
 * The draft is NEVER saved directly. It fills the wizard's editable fields and the mentor
 * clicks Create. Same principle as the review: the AI proposes, the human commits.
 *
 * DO NOT START THIS BEFORE GATE C IS GREEN.
 */
export const CourseDraft = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  coverEmoji: z.string(),
  category: z.enum(['technical', 'business', 'communication', 'leadership', 'wellbeing']),
  estimatedHours: z.number().int(),
  sections: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      xpAward: z.number().int(),
      lessons: z.array(
        z.object({
          title: z.string(),
          kind: z.enum(['video', 'reading', 'link']),
          durationMin: z.number().int(),
          xpAward: z.number().int(),
          contentBody: z.string(),
        }),
      ),
    }),
  ),
  assessment: z.object({
    title: z.string(),
    kind: z.enum(['assignment', 'quiz', 'project', 'reflection']),
    prompt: z.string(),
    /** Must be specific enough that the AI Coach can grade against it. */
    rubric: z.string(),
    maxScore: z.number().int(),
    xpAward: z.number().int(),
  }),
})
export type CourseDraft = z.infer<typeof CourseDraft>

export const draftCourse = defineContract({
  method: 'POST',
  path: '/api/ai-coach/draft-course',
  auth: 'user', // mentor/admin check lives in src/server/ai-coach.ts
  summary: 'GOOD-TO-HAVE: draft a course skeleton for a mentor to edit. Never saved directly.',
  input: z.object({
    topic: z.string().min(3).max(200),
    track: z.enum(['mandatory', 'optional']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    sectionCount: z.coerce.number().int().min(2).max(6).default(4),
  }),
  output: z.object({ draft: CourseDraft }),
  mock: ({ topic }) => ({ draft: { ...mockCourseDraft, title: topic } }),
})
