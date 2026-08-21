import { z } from 'zod'
import { defineContract } from './_kit'
import { AdminStudentRow, StudentFlag, SubmissionStatus, CourseTrack } from './admin'
import { mockMentorQueue, mockReviewDetail, mockMentorStudents, mockDecisionFor } from '@/mocks/mentor'

/**
 * FEATURE 07 — MENTOR REVIEW & FINAL XP AWARD.
 *
 * Branch: `feature-admin-backend` → PR into `feature-11-admin`.
 * Source spec: plans/katalyst/features/07-mentor-review/{README,backend}.md
 *              plans/katalyst/features/11-mentor-admin-dashboard/{README,backend}.md (`students`)
 *
 * THE INVARIANT: the AI Coach advises, the mentor decides. This contract never generates an
 * AI review — `queue`/`get` only read a review that already exists in `ai_reviews`. `decide`
 * is the only place in the codebase that results in an `xp_event` being written, and it does
 * so through `awardXp()` (src/server/xp.ts), never by inserting into `xpEvents` itself.
 *
 * `AdminStudentRow`/`StudentFlag` are reused as-is from `./admin` — `mentor.students` and
 * `admin.listStudents` are the same row shape at two different scopes (mentor's own courses
 * vs. every course), so there is no reason to redefine it here.
 *
 * No `src/contracts/ai-coach.ts` exists on this branch, so the AI-review shape below is a
 * read-model mirrored field-for-field from the `ai_reviews` table in
 * `src/db/schema/learning.ts` — not a second AI scoring schema, just this feature's read view
 * of data another feature already produced.
 */

// ---------------------------------------------------------------------------
// 1. Shared read-model types
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

/** Mirrors `aiReviews` (src/db/schema/learning.ts). Read-only — never generated here. */
export const MentorAiReview = z.object({
  id: z.string(),
  model: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  actionItems: z.array(z.string()),
  rubricBreakdown: z.array(RubricLine),
  suggestedScore: z.number().int(),
  suggestedXp: z.number().int(),
  confidence: ReviewConfidence,
  latencyMs: z.number().int(),
  createdAt: z.string(), // ISO
})
export type MentorAiReview = z.infer<typeof MentorAiReview>

/** One row in the mentor's queue — the minimum the list view needs. */
export const MentorQueueItem = z.object({
  submissionId: z.string(),
  submittedAt: z.string(), // ISO
  status: SubmissionStatus,
  aiScore: z.number().int().nullable(),
  aiXpSuggested: z.number().int().nullable(),
  studentId: z.string(),
  studentName: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  maxScore: z.number().int(),
  xpAward: z.number().int(),
  track: CourseTrack,
})
export type MentorQueueItem = z.infer<typeof MentorQueueItem>

export const MentorSubmissionDetail = z.object({
  id: z.string(),
  content: z.string(),
  attachmentUrl: z.string(),
  status: SubmissionStatus,
  aiScore: z.number().int().nullable(),
  aiXpSuggested: z.number().int().nullable(),
  finalScore: z.number().int().nullable(),
  finalXp: z.number().int().nullable(),
  mentorNote: z.string(),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
})
export type MentorSubmissionDetail = z.infer<typeof MentorSubmissionDetail>

export const MentorStudentContext = z.object({
  studentId: z.string(),
  studentName: z.string(),
  totalXp: z.number().int(),
  courseProgressPct: z.number().int().nullable(),
  recentScores: z.array(
    z.object({
      submissionId: z.string(),
      assessmentTitle: z.string(),
      score: z.number().int().nullable(),
      submittedAt: z.string(),
    }),
  ),
})
export type MentorStudentContext = z.infer<typeof MentorStudentContext>

/** The full review screen payload — submission + assessment/course context + the existing AI
 *  review (nullable: a submission the coach failed to review must still be gradable). */
export const MentorReviewDetail = z.object({
  submission: MentorSubmissionDetail,
  course: z.object({ id: z.string(), title: z.string(), track: CourseTrack }),
  assessment: z.object({
    id: z.string(),
    title: z.string(),
    prompt: z.string(),
    rubric: z.string(),
    maxScore: z.number().int(),
    xpAward: z.number().int(),
  }),
  aiReview: MentorAiReview.nullable(),
  student: MentorStudentContext,
})
export type MentorReviewDetail = z.infer<typeof MentorReviewDetail>

export const MentorDecisionKind = z.enum(['approve', 'changes_requested'])
export type MentorDecisionKind = z.infer<typeof MentorDecisionKind>

export const XpAwardResult = z.object({
  awarded: z.boolean(),
  amount: z.number().int(),
  newTotalXp: z.number().int(),
  newLevel: z.number().int(),
  leveledUp: z.boolean(),
})
export type XpAwardResult = z.infer<typeof XpAwardResult>

// ---------------------------------------------------------------------------
// 2. Ops
// ---------------------------------------------------------------------------

/**
 * The mentor's queue. Server-side restricted to submissions on courses this mentor owns
 * (`courses.mentorId === user.id`), or all of them for an admin — see `src/server/mentor.ts`.
 * Never triggers AI generation; only reads reviews/scores that already exist.
 */
export const queue = defineContract({
  method: 'GET',
  path: '/api/mentor/queue',
  auth: 'user',
  summary: "The mentor's review queue — submissions already reviewed by the AI Coach.",
  input: z.object({
    status: SubmissionStatus.optional(),
    courseId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
  output: z.object({ reviews: z.array(MentorQueueItem), total: z.number().int() }),
  mock: () => ({ reviews: mockMentorQueue, total: mockMentorQueue.length }),
})

/** Full review screen: submission + course/assessment context + the latest non-preview AI
 *  review + student context. Verifies mentor ownership before returning anything. */
export const get = defineContract({
  method: 'GET',
  path: '/api/mentor/submissions/:id',
  auth: 'user',
  summary: 'Full submission + AI review + student context for the review screen.',
  input: z.object({ id: z.string() }),
  output: MentorReviewDetail,
  mock: ({ id }) => mockReviewDetail(id),
})

/**
 * The mentor's final call on one submission.
 *
 * `finalXp` here is the mentor's PROPOSED amount (prefilled from the AI's `suggestedXp` on
 * "accept", typed by the mentor on override) — the server clamps it to
 * `[0, assessment.xpAward]` and that clamped value, not this one, is what gets awarded and
 * returned. The client never controls the authoritative XP number.
 */
export const decide = defineContract({
  method: 'POST',
  path: '/api/mentor/submissions/:id/decide',
  auth: 'user',
  summary: 'Finalize a submission — approve (awards XP) or request changes (awards none).',
  input: z.object({
    id: z.string(),
    decision: MentorDecisionKind,
    finalScore: z.number().int().min(0),
    finalXp: z.number().int().min(0),
    note: z.string().max(2000).default(''),
  }),
  output: z.object({
    submissionId: z.string(),
    decision: MentorDecisionKind,
    status: SubmissionStatus,
    finalScore: z.number().int(),
    finalXp: z.number().int().nullable(),
    award: XpAwardResult.nullable(),
  }),
  mock: ({ id, decision, finalScore, finalXp }) => mockDecisionFor({ id, decision, finalScore, finalXp }),
})

/**
 * The mentor's student roster (feature 11). Scoped to students enrolled on this mentor's
 * courses; admins see everyone. Reuses `AdminStudentRow`/`StudentFlag` from `./admin` — same
 * row shape as `admin.listStudents`, different scope.
 */
export const students = defineContract({
  method: 'GET',
  path: '/api/mentor/students',
  auth: 'user',
  summary: "The mentor's student roster with aggregates and intervention flags.",
  input: z.object({
    courseId: z.string().optional(),
    // 'at_risk' is a meta-value ("any flag present") the mentor dashboard already sends
    // (src/app/mentor/dashboard/page.tsx) — accepted alongside the four real flags rather
    // than rejecting a real, already-shipped caller.
    flag: z.union([StudentFlag, z.literal('at_risk')]).optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({ students: z.array(AdminStudentRow) }),
  mock: () => ({ students: mockMentorStudents }),
})
