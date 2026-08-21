import { and, desc, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import type * as aiCoachContract from '@/contracts/ai-coach'
import type * as submissionsContract from '@/contracts/submissions'
import { db } from '@/db'
import { assessments, courses } from '@/db/schema/courses'
import { aiReviews, enrollments, submissions } from '@/db/schema/learning'

/**
 * Business logic for `submissions.*` — the step between attempting an assessment and the
 * mentor deciding on it.
 *
 * Nothing in this file writes XP. `aiXpSuggested` is advice denormalised from the AI
 * review; the mentor's decision is the only thing that awards XP.
 */

export type Submission = z.infer<typeof submissionsContract.Submission>

/** Statuses that mean "this attempt is still open" — a re-submit updates it in place. */
const OPEN_STATUSES = ['draft', 'submitted', 'ai_reviewed', 'changes_requested'] as const

const toWire = (
  row: typeof submissions.$inferSelect,
  ctx: { assessmentTitle: string; courseTitle: string; maxScore: number; xpAward: number },
): Submission => ({
  id: row.id,
  assessmentId: row.assessmentId,
  assessmentTitle: ctx.assessmentTitle,
  courseTitle: ctx.courseTitle,
  content: row.content,
  status: row.status as Submission['status'],
  aiScore: row.aiScore ?? null,
  aiXpSuggested: row.aiXpSuggested ?? null,
  finalScore: row.finalScore ?? null,
  finalXp: row.finalXp ?? null,
  mentorNote: row.mentorNote ?? '',
  maxScore: ctx.maxScore,
  xpAward: ctx.xpAward,
  submittedAt: row.submittedAt.toISOString(),
})

/** Assessment + its course, or a 404. Also gives the wire shape its score/XP ceilings. */
async function loadAssessment(assessmentId: string) {
  const [row] = await db
    .select({
      id: assessments.id,
      courseId: assessments.courseId,
      title: assessments.title,
      maxScore: assessments.maxScore,
      xpAward: assessments.xpAward,
      courseTitle: courses.title,
      track: courses.track,
    })
    .from(assessments)
    .innerJoin(courses, eq(courses.id, assessments.courseId))
    .where(eq(assessments.id, assessmentId))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', 'That assessment does not exist')
  return row
}

/**
 * Submit an attempt to the mentor.
 *
 * Enrollment is required and checked here, not in the UI: `submissions.enrollmentId` is
 * NOT NULL and references `enrollments`, so an unenrolled student would otherwise hit a
 * raw foreign-key error instead of a sentence they can act on.
 *
 * Re-submitting the same assessment UPDATES the open attempt rather than inserting a
 * second row — otherwise a student who fixes a typo appears twice in the mentor queue and
 * the mentor has to guess which one is current. An attempt the mentor has already
 * approved is closed and cannot be overwritten.
 */
export async function create(
  studentId: string,
  input: { assessmentId: string; content: string },
): Promise<{ submission: Submission }> {
  const assessment = await loadAssessment(input.assessmentId)

  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, assessment.courseId),
        inArray(enrollments.status, ['active', 'completed']),
      ),
    )
    .limit(1)

  if (!enrollment) {
    throw new ApiError('FORBIDDEN', 'Enrol in this course before submitting its assessment')
  }

  const [existing] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.studentId, studentId),
        eq(submissions.assessmentId, input.assessmentId),
        inArray(submissions.status, [...OPEN_STATUSES]),
      ),
    )
    .orderBy(desc(submissions.submittedAt))
    .limit(1)

  const now = new Date()
  const ctx = {
    assessmentTitle: assessment.title,
    courseTitle: assessment.courseTitle,
    maxScore: assessment.maxScore,
    xpAward: assessment.xpAward,
  }

  if (existing) {
    const [row] = await db
      .update(submissions)
      .set({
        content: input.content,
        status: 'submitted',
        // The previous AI advice described the previous text. Clear it so the mentor
        // queue never shows a score that belongs to work that has since changed.
        aiScore: null,
        aiXpSuggested: null,
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(submissions.id, existing.id))
      .returning()
    return { submission: toWire(row, ctx) }
  }

  const [row] = await db
    .insert(submissions)
    .values({
      id: crypto.randomUUID(),
      assessmentId: input.assessmentId,
      studentId,
      enrollmentId: enrollment.id,
      content: input.content,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    })
    .returning()

  return { submission: toWire(row, ctx) }
}

/**
 * The student's own attempt for one assessment, plus the AI review once it exists.
 *
 * Returns `{ submission: null }` rather than a 404 when they have not submitted — "not
 * submitted yet" is the normal opening state of the page, not an error.
 */
export type AiReviewWire = z.infer<typeof aiCoachContract.AiReview>

/**
 * ai_reviews row -> the `AiReview` wire shape.
 *
 * The table stores the model's payload; the wire shape adds the assessment context the UI
 * needs to draw the card without a second request (title, course, denominator, XP ceiling,
 * track). Returning the bare row fails `defineRoute`'s contract check — which is exactly
 * how this was caught.
 */
const toAiReviewWire = (
  row: typeof aiReviews.$inferSelect,
  ctx: {
    assessmentId: string
    assessmentTitle: string
    courseTitle: string
    maxScore: number
    xpAward: number
    track: 'mandatory' | 'optional'
  },
): AiReviewWire => ({
  id: row.id,
  submissionId: row.submissionId,
  assessmentId: ctx.assessmentId,
  assessmentTitle: ctx.assessmentTitle,
  courseTitle: ctx.courseTitle,
  summary: row.summary,
  strengths: row.strengths,
  weaknesses: row.weaknesses,
  actionItems: row.actionItems,
  rubricBreakdown: row.rubricBreakdown as AiReviewWire['rubricBreakdown'],
  suggestedScore: row.suggestedScore,
  suggestedXp: row.suggestedXp,
  confidence: row.confidence as AiReviewWire['confidence'],
  maxScore: ctx.maxScore,
  xpAward: ctx.xpAward,
  track: ctx.track,
  model: row.model,
  latencyMs: row.latencyMs,
  isPreview: row.isPreview,
  createdAt: row.createdAt.toISOString(),
})

export async function forAssessment(
  studentId: string,
  assessmentId: string,
): Promise<{ submission: Submission | null; review: AiReviewWire | null }> {
  const assessment = await loadAssessment(assessmentId)

  const [row] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.studentId, studentId), eq(submissions.assessmentId, assessmentId)))
    .orderBy(desc(submissions.submittedAt))
    .limit(1)

  if (!row) return { submission: null, review: null }

  const [reviewRow] = await db
    .select()
    .from(aiReviews)
    .where(and(eq(aiReviews.submissionId, row.id), eq(aiReviews.isPreview, false)))
    .orderBy(desc(aiReviews.createdAt))
    .limit(1)

  const ctx = {
    assessmentTitle: assessment.title,
    courseTitle: assessment.courseTitle,
    maxScore: assessment.maxScore,
    xpAward: assessment.xpAward,
  }

  return {
    submission: toWire(row, ctx),
    review: reviewRow
      ? toAiReviewWire(reviewRow, {
          ...ctx,
          assessmentId,
          track: assessment.track as 'mandatory' | 'optional',
        })
      : null,
  }
}

/**
 * THE OWNERSHIP GUARD for `/api/ai-coach/review`.
 *
 * That route takes a bare `submissionId`. Without this check any signed-in user could
 * post someone else's id and read their work back — an AI review quotes the submission
 * text in its strengths and weaknesses.
 *
 * Lives here rather than inside `server/ai-coach.ts` so the coach stays a pure
 * grade-this-thing module with no notion of who is asking.
 */
export async function assertOwnsSubmission(studentId: string, submissionId: string): Promise<void> {
  const [row] = await db
    .select({ studentId: submissions.studentId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1)

  // Same error for "does not exist" and "not yours" — distinguishing them tells an
  // attacker which submission ids are real.
  if (!row || row.studentId !== studentId) {
    throw new ApiError('NOT_FOUND', 'That submission does not exist')
  }
}
