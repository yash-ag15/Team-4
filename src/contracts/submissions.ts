import { z } from 'zod'
import { defineContract } from './_kit'
import { AiReview } from './ai-coach'

/**
 * FEATURE 04 — SUBMISSIONS. The step between attempting an assessment and the mentor
 * deciding on it.
 *
 * ---------------------------------------------------------------------------
 * THE ORDER IS THE POINT
 * ---------------------------------------------------------------------------
 * A student attempts the assessment, SUBMITS IT TO THE MENTOR, and only then may ask the
 * AI Coach to review it. The coach reports strengths, weaknesses and the XP the work
 * might earn — but it reports on work that is already locked in, so its feedback cannot
 * be farmed to iterate a draft to a high predicted score before anyone sees it.
 *
 * `aiCoach.preview` is the opposite trade (review a draft, not persisted). Both exist;
 * this one is the graded path.
 *
 * ---------------------------------------------------------------------------
 * THE INVARIANT
 * ---------------------------------------------------------------------------
 * Nothing here writes XP. `aiXpSuggested` is advice, denormalised from the AI review for
 * the mentor queue. Real XP is written only by the mentor's decision.
 */

export const SubmissionStatus = z.enum([
  'draft',
  'submitted',
  'ai_reviewed',
  'mentor_approved',
  'changes_requested',
])
export type SubmissionStatus = z.infer<typeof SubmissionStatus>

export const Submission = z.object({
  id: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  courseTitle: z.string(),
  content: z.string(),
  status: SubmissionStatus,
  /** Advice from the AI Coach. Null until the coach has run. Never an XP award. */
  aiScore: z.number().int().nullable(),
  aiXpSuggested: z.number().int().nullable(),
  /** The mentor's decision. Null until they decide. */
  finalScore: z.number().int().nullable(),
  finalXp: z.number().int().nullable(),
  mentorNote: z.string(),
  maxScore: z.number().int(),
  xpAward: z.number().int(),
  submittedAt: z.string(), // ISO
})
export type Submission = z.infer<typeof Submission>

const mockSubmission: Submission = {
  id: 'submission-1',
  assessmentId: 'assessment-1',
  assessmentTitle: 'Assessment 2: SQL Aggregations',
  courseTitle: 'Data Foundations',
  content: 'A worked answer, at least fifty characters long so it passes validation.',
  status: 'submitted',
  aiScore: null,
  aiXpSuggested: null,
  finalScore: null,
  finalXp: null,
  mentorNote: '',
  maxScore: 100,
  xpAward: 150,
  submittedAt: '2026-08-21T09:00:00.000Z',
}

/**
 * Submit an attempt to the mentor. This is the gate the AI Coach sits behind.
 *
 * `content.min(50)` matches `aiCoach.preview` — the same floor for "there is enough here
 * to grade". Re-submitting the same assessment updates the open attempt rather than
 * stacking rows, so a student who fixes a typo does not appear twice in the queue.
 */
export const create = defineContract({
  method: 'POST',
  path: '/api/submissions',
  auth: 'user',
  summary: 'Submit an assessment attempt to the mentor. Required before the AI Coach will review it.',
  input: z.object({
    assessmentId: z.string().min(1),
    content: z.string().min(50).max(8000),
  }),
  output: z.object({ submission: Submission }),
  mock: ({ assessmentId, content }) => ({
    submission: { ...mockSubmission, assessmentId, content },
  }),
})

/** The student's own attempt for one assessment, with the AI review once it exists. */
export const forAssessment = defineContract({
  method: 'GET',
  path: '/api/submissions/for-assessment/:assessmentId',
  auth: 'user',
  summary: 'The signed-in student attempt for this assessment, or null if not submitted yet',
  input: z.object({ assessmentId: z.string().min(1) }),
  output: z.object({
    submission: Submission.nullable(),
    review: AiReview.nullable(),
  }),
  mock: () => ({ submission: null, review: null }),
})
