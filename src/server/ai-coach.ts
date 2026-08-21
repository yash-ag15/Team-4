import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import * as contract from '@/contracts/ai-coach'
import { AiReviewPayload, CoachBrief, CourseDraft } from '@/contracts/ai-coach'
import { db } from '@/db'
import {
  aiReviews,
  assessments,
  courses,
  enrollments,
  streaks,
  submissions,
  user,
  xpEvents,
} from '@/db/schema'
import { AiError, MOCK_MODEL_LABEL, aiEnabled, generateJson } from '@/lib/ai'
import {
  BRIEF_SYSTEM_PROMPT,
  COACH_SYSTEM_PROMPT,
  DRAFT_COURSE_SYSTEM_PROMPT,
  buildBriefPrompt,
  buildDraftCoursePrompt,
  buildReviewPrompt,
  type ReviewPromptHistoryItem,
} from '@/lib/ai-prompts'
import { applyTrack, levelFromXp, levelName, suggestedXpFromScore, xpToNextLevel } from '@/lib/xp'
import { mockAssessmentContext } from '@/mocks/ai-coach'

/**
 * ============================================================================
 *  THE AI COACH.  Owner: Yash — `feature/ai-coach-backend`.
 * ============================================================================
 *
 * Design: plans/katalyst/ai-coach.md   Tasks: features/05-ai-coach/backend.md
 *
 * THE INVARIANT — the reason this feature is shippable rather than a liability:
 *
 *   This file writes `ai_reviews` and updates
 *   `submissions.status / aiScore / aiXpSuggested`. It NEVER calls `awardXp()` and never
 *   inserts into `xp_events`. XP for a submission is written in exactly one place:
 *   `src/server/mentor.ts` -> `decide()`, keyed `submission:<submissionId>`.
 *
 *   The AI advises. The mentor decides.
 *
 * (`xpEvents` is imported below for a READ-ONLY sum in the dashboard brief. If you ever
 * see `insert(xpEvents)` or `awardXp` in this file, it is a bug — delete it.)
 *
 * ---------------------------------------------------------------------------
 * NOTE ON THE SCHEMA (matters if you read the design doc first)
 * ---------------------------------------------------------------------------
 * `ai_reviews` as committed by Siddesh has `submissionId NOT NULL` and carries no
 * `assessmentId` / `studentId` columns. Two consequences, both fine:
 *   1. A PREVIEW IS NOT PERSISTED. It is computed and returned. This matches what the
 *      contract already promised ("Not persisted") — the design doc's stored-preview idea
 *      is dropped, not worked around.
 *   2. Everything about a review is reached through its submission:
 *      ai_reviews -> submissions -> assessments -> courses.
 * `id` columns have no `$defaultFn` on this branch, so we generate them here.
 */

const CONTENT_CAP = 8000
const HISTORY_LIMIT = 5

// ---------------------------------------------------------------------------
// Context loading
// ---------------------------------------------------------------------------

type ReviewContext = {
  submissionId: string | null
  studentId: string
  content: string
  assessment: {
    id: string
    title: string
    kind: string
    prompt: string
    rubric: string
    maxScore: number
    xpAward: number
  }
  course: {
    id: string
    title: string
    category: string
    difficulty: string
    track: 'mandatory' | 'optional'
  }
  history: ReviewPromptHistoryItem[]
}

/**
 * The student's last few graded reviews, oldest first.
 *
 * This is what lets the coach say "you have now cited sources in two submissions running —
 * that habit is sticking", which is the line that makes judges sit up. It is also the
 * FIRST thing to drop if reviews start timing out. Never drop the rubric instead.
 *
 * Reached through `submissions`, because `ai_reviews` has no `studentId` of its own.
 */
async function loadHistory(
  studentId: string,
  excludeSubmissionId: string | null,
): Promise<ReviewPromptHistoryItem[]> {
  // History is an ENRICHMENT — the coach reviews fine without it. Never let a database
  // problem take down a review over it. (In dev that means "no Neon yet"; in production
  // it means one degraded review instead of a 500.)
  try {
    return await loadHistoryRows(studentId, excludeSubmissionId)
  } catch (e) {
    console.warn('[ai-coach] history unavailable, reviewing without it —', e)
    return []
  }
}

async function loadHistoryRows(
  studentId: string,
  excludeSubmissionId: string | null,
): Promise<ReviewPromptHistoryItem[]> {
  const rows = await db
    .select({
      createdAt: aiReviews.createdAt,
      summary: aiReviews.summary,
      suggestedScore: aiReviews.suggestedScore,
      submissionId: aiReviews.submissionId,
      assessmentTitle: assessments.title,
      maxScore: assessments.maxScore,
      courseTitle: courses.title,
    })
    .from(aiReviews)
    .innerJoin(submissions, eq(submissions.id, aiReviews.submissionId))
    .innerJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .innerJoin(courses, eq(courses.id, assessments.courseId))
    .where(and(eq(submissions.studentId, studentId), eq(aiReviews.isPreview, false)))
    .orderBy(desc(aiReviews.createdAt))
    .limit(HISTORY_LIMIT + 1)

  return rows
    .filter((r) => !excludeSubmissionId || r.submissionId !== excludeSubmissionId)
    .slice(0, HISTORY_LIMIT)
    .reverse() // oldest first — the model reads it as a trajectory
    .map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      courseTitle: r.courseTitle,
      assessmentTitle: r.assessmentTitle,
      score: r.suggestedScore,
      maxScore: r.maxScore,
      takeaway: r.summary.slice(0, 220),
    }))
}

/**
 * DEV ONLY. Lets the coach run before Siddesh has seeded (or even provisioned) Neon.
 *
 * Same philosophy as `defineRoute`'s mock identity: a teammate with a fresh clone and no
 * database should still get a working endpoint. Hard-gated on NODE_ENV — `next build`
 * sets NODE_ENV=production, so this branch cannot exist in a deployed app, where a
 * missing assessment is correctly a 404.
 */
function devAssessmentFallback(assessmentId: string) {
  const a = mockAssessmentContext
  return {
    id: assessmentId,
    title: a.title,
    kind: 'assignment',
    prompt:
      'Using the enrolment dataset, identify where students are dropping out of the ' +
      'programme and recommend one intervention.',
    rubric: a.rubric,
    maxScore: a.maxScore,
    xpAward: a.xpAward,
    courseId: a.courseId,
    courseTitle: a.courseTitle,
    category: 'technical',
    difficulty: 'beginner',
    track: a.track,
  }
}

async function loadAssessmentAndCourse(assessmentId: string) {
  const [row] = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      kind: assessments.kind,
      prompt: assessments.prompt,
      rubric: assessments.rubric,
      maxScore: assessments.maxScore,
      xpAward: assessments.xpAward,
      courseId: courses.id,
      courseTitle: courses.title,
      category: courses.category,
      difficulty: courses.difficulty,
      track: courses.track,
    })
    .from(assessments)
    .innerJoin(courses, eq(courses.id, assessments.courseId))
    .where(eq(assessments.id, assessmentId))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', 'Assessment not found')
  return row
}

/** `loadAssessmentAndCourse` + the dev fallback. Every caller goes through this. */
async function resolveAssessment(assessmentId: string) {
  if (process.env.NODE_ENV === 'production') return loadAssessmentAndCourse(assessmentId)
  try {
    return await loadAssessmentAndCourse(assessmentId)
  } catch (e) {
    // No DATABASE_URL at all throws on connect; an empty DB throws NOT_FOUND. Both mean
    // "the data isn't there yet", and in dev that must not block the review UI.
    console.warn(
      `[ai-coach] dev: assessment "${assessmentId}" unavailable (${
        e instanceof ApiError ? e.code : 'db unreachable'
      }) — using the mock assessment fixture`,
    )
    return devAssessmentFallback(assessmentId)
  }
}

const buildContext = (
  a: Awaited<ReturnType<typeof resolveAssessment>>,
  rest: { submissionId: string | null; studentId: string; content: string; history: ReviewPromptHistoryItem[] },
): ReviewContext => ({
  ...rest,
  assessment: {
    id: a.id,
    title: a.title,
    kind: a.kind,
    prompt: a.prompt,
    rubric: a.rubric,
    maxScore: a.maxScore,
    xpAward: a.xpAward,
  },
  course: {
    id: a.courseId,
    title: a.courseTitle,
    category: a.category,
    difficulty: a.difficulty,
    track: a.track,
  },
})

/** Preview: the student pastes a draft. No submission row exists yet. */
async function contextForDraft(
  studentId: string,
  assessmentId: string,
  content: string,
): Promise<ReviewContext> {
  const a = await resolveAssessment(assessmentId)
  return buildContext(a, {
    submissionId: null,
    studentId,
    content,
    history: await loadHistory(studentId, null),
  })
}

/**
 * Review: everything is derived from the submission id.
 *
 * Ayush passes an ID, not a payload — that keeps prompt building entirely inside this file
 * and means `submissions.ts` never has to know what the coach reads.
 */
async function contextForSubmission(submissionId: string): Promise<ReviewContext> {
  const [row] = await db
    .select({
      id: submissions.id,
      studentId: submissions.studentId,
      content: submissions.content,
      assessmentId: submissions.assessmentId,
    })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', 'Submission not found')

  const a = await resolveAssessment(row.assessmentId)
  return buildContext(a, {
    submissionId: row.id,
    studentId: row.studentId,
    content: row.content,
    history: await loadHistory(row.studentId, row.id),
  })
}

// ---------------------------------------------------------------------------
// The model call
// ---------------------------------------------------------------------------

type ModelResult = {
  payload: z.infer<typeof AiReviewPayload>
  model: string
  latencyMs: number
  tokensIn: number
  tokensOut: number
}

/**
 * Translate SDK failures into ApiErrors with copy a student can actually read.
 *
 * NOTHING here may 500 a page. By the time `review()` runs, the submission is already
 * saved — a failed review is a missing enrichment, not lost work.
 */
function translateAiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e

  // Provider specifics live in src/lib/ai.ts. This file only knows the six outcomes it
  // has to show a student, which is why swapping provider did not touch anything below.
  if (e instanceof AiError) {
    switch (e.kind) {
      case 'rate_limited':
        return new ApiError('RATE_LIMITED', e.message)
      case 'quota':
        console.error(
          '[ai-coach] FREE-TIER QUOTA EXHAUSTED — wait for the daily reset, or set a ' +
            'different GEMINI_MODEL, or unset GEMINI_API_KEY to fall back to mock reviews ' +
            'and keep the demo running.',
        )
        return new ApiError('INTERNAL', e.message)
      case 'blocked':
        return new ApiError('INTERNAL', 'The coach could not review this submission.')
      case 'unreadable':
        return new ApiError('INTERNAL', 'The coach returned an unreadable review.')
      default:
        return new ApiError('INTERNAL', e.message)
    }
  }

  console.error('[ai-coach] unexpected failure', e)
  return new ApiError('INTERNAL', 'The coach could not review this right now — your work is saved.')
}

async function callModel(ctx: ReviewContext, isPreview: boolean): Promise<ModelResult> {
  try {
    // `AiReviewPayload` is the SAME zod object the contract exports. It constrains
    // generation (via responseJsonSchema) and validates the response on the way back, so
    // the model cannot hand Riya's UI a shape it does not expect.
    const res = await generateJson({
      system: COACH_SYSTEM_PROMPT,
      prompt: buildReviewPrompt({
        course: ctx.course,
        assessment: ctx.assessment,
        submission: { content: ctx.content },
        history: ctx.history,
        isPreview,
      }),
      schema: AiReviewPayload,
    })

    return {
      payload: res.data,
      model: res.model,
      latencyMs: res.latencyMs,
      tokensIn: res.tokensIn,
      tokensOut: res.tokensOut,
    }
  } catch (e) {
    throw translateAiError(e)
  }
}

/**
 * With no API key we serve the contract mock instead of throwing, so the WHOLE pipeline —
 * including the mentor queue — is demoable before anyone has a key.
 *
 * The review card header shows `model`, so a mock review is visibly labelled as one.
 * Nobody demos a fake review believing it is real.
 */
function mockResult(ctx: ReviewContext): ModelResult {
  const { review } = contract.preview.mock({
    assessmentId: ctx.assessment.id,
    content: ctx.content,
  })
  return {
    payload: {
      summary: review.summary,
      strengths: review.strengths,
      weaknesses: review.weaknesses,
      actionItems: review.actionItems,
      rubricBreakdown: review.rubricBreakdown,
      suggestedScore: review.suggestedScore,
      confidence: review.confidence,
    },
    model: MOCK_MODEL_LABEL,
    latencyMs: 0,
    tokensIn: 0,
    tokensOut: 0,
  }
}

// ---------------------------------------------------------------------------
// Wire mapping
// ---------------------------------------------------------------------------

/**
 * The real ceiling on this assessment's XP.
 *
 * `assessment.xpAward` is authored per-course and does NOT include the optional-track
 * bonus. If we suggested a track-multiplied XP but the mentor's clamp used the raw
 * xpAward, a perfect score on an optional course would suggest 225 while `decide()`
 * awarded 150 — the mentor accepts one number and the student receives another. The
 * multiplier has to move the ceiling too, or it is not really a bonus.
 *
 * `src/server/mentor.ts` -> decide() MUST clamp to this same value. It is echoed on the
 * wire as `AiReview.xpAward` precisely so both halves use one number.
 */
const xpCeiling = (ctx: ReviewContext) => applyTrack(ctx.assessment.xpAward, ctx.course.track)

/** Never above the ceiling, whatever the arithmetic or a future multiplier change does. */
const xpFor = (ctx: ReviewContext, score: number) =>
  Math.min(
    suggestedXpFromScore(score, ctx.assessment.maxScore, ctx.assessment.xpAward, ctx.course.track),
    xpCeiling(ctx),
  )

/**
 * `suggestedXp` is ARITHMETIC, not a model output. The model grades; code converts the
 * grade to XP. Letting the model pick both invites it to hand back a number that
 * disagrees with the score it just gave.
 */
const toWire = (
  ctx: ReviewContext,
  result: ModelResult,
  opts: { id: string; isPreview: boolean; createdAt: Date },
): z.infer<typeof contract.AiReview> => ({
  ...result.payload,
  id: opts.id,
  submissionId: ctx.submissionId,
  assessmentId: ctx.assessment.id,
  assessmentTitle: ctx.assessment.title,
  courseTitle: ctx.course.title,
  suggestedXp: xpFor(ctx, result.payload.suggestedScore),
  maxScore: ctx.assessment.maxScore,
  xpAward: xpCeiling(ctx),
  track: ctx.course.track,
  model: result.model,
  latencyMs: result.latencyMs,
  isPreview: opts.isPreview,
  createdAt: opts.createdAt.toISOString(),
})

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/**
 * In-memory, per-instance. Vercel Functions are stateless and scale to zero, so a cold
 * start resets this — which is fine. It exists to stop one student holding down "Ask the
 * coach", not as a security boundary.
 */
const previewHits = new Map<string, number[]>()
const PREVIEW_LIMIT = 5
const PREVIEW_WINDOW_MS = 10 * 60 * 1000

function assertPreviewQuota(userId: string) {
  const now = Date.now()
  const recent = (previewHits.get(userId) ?? []).filter((t) => now - t < PREVIEW_WINDOW_MS)
  if (recent.length >= PREVIEW_LIMIT) {
    throw new ApiError(
      'RATE_LIMITED',
      `You've asked the coach ${PREVIEW_LIMIT} times in the last 10 minutes. Sit with the feedback you have, then try again.`,
    )
  }
  recent.push(now)
  previewHits.set(userId, recent)
}

// ---------------------------------------------------------------------------
// Public API — the three functions the routes call
// ---------------------------------------------------------------------------

/**
 * Review a DRAFT. NOT persisted, repeatable, rate limited.
 *
 * The retention hook: a student iterates against this until the predicted score stops
 * moving, and only then submits. Better work reaches the mentor, and the student spent
 * ten engaged minutes instead of abandoning.
 */
export async function preview(
  userId: string,
  input: z.infer<(typeof contract.preview)['input']>,
): Promise<{ review: z.infer<typeof contract.AiReview> }> {
  const content = input.content
  if (content.length > CONTENT_CAP) {
    throw new ApiError('VALIDATION_ERROR', 'That draft is too long for the coach to read.', {
      content: [
        `This is ${content.length.toLocaleString()} characters — the limit is ${CONTENT_CAP.toLocaleString()}.`,
      ],
    })
  }

  assertPreviewQuota(userId)

  const ctx = await contextForDraft(userId, input.assessmentId, content)
  const result = aiEnabled() ? await callModel(ctx, true) : mockResult(ctx)

  // Deliberately no DB write — `ai_reviews.submissionId` is NOT NULL and a draft has no
  // submission. The contract promises "not persisted"; this honours it.
  return {
    review: toWire(ctx, result, {
      id: `preview-${ctx.assessment.id}-${Date.now()}`,
      isPreview: true,
      createdAt: new Date(),
    }),
  }
}

/**
 * Review a SUBMITTED assessment and move it into the mentor's queue.
 *
 * Called by `src/server/submissions.ts` (Ayush) AFTER the submission row is inserted and
 * committed — never inside the same transaction. A student's work is never lost because
 * the coach was slow.
 */
export async function review(input: {
  submissionId: string
}): Promise<{ review: z.infer<typeof contract.AiReview> }> {
  const ctx = await contextForSubmission(input.submissionId)

  if (!ctx.content.trim()) {
    throw new ApiError('VALIDATION_ERROR', 'This submission is empty.')
  }

  const result = aiEnabled() ? await callModel(ctx, false) : mockResult(ctx)
  const createdAt = new Date()
  const suggestedXp = xpFor(ctx, result.payload.suggestedScore)
  const reviewId = crypto.randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(aiReviews).values({
      id: reviewId,
      submissionId: input.submissionId,
      model: result.model,
      summary: result.payload.summary,
      strengths: result.payload.strengths,
      weaknesses: result.payload.weaknesses,
      actionItems: result.payload.actionItems,
      rubricBreakdown: result.payload.rubricBreakdown,
      suggestedScore: result.payload.suggestedScore,
      suggestedXp,
      confidence: result.payload.confidence,
      isPreview: false,
      latencyMs: result.latencyMs,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      createdAt,
    })

    // Denormalise onto the submission so Riya's mentor queue renders 20 rows without
    // joining ai_reviews 20 times, and flip the status so it enters that queue.
    //
    // NOTE: no XP is written here. There is no path from this file to xp_events.
    await tx
      .update(submissions)
      .set({
        status: 'ai_reviewed',
        aiScore: result.payload.suggestedScore,
        aiXpSuggested: suggestedXp,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, input.submissionId))
  })

  return { review: toWire(ctx, result, { id: reviewId, isPreview: false, createdAt }) }
}

// ---------------------------------------------------------------------------
// The dashboard brief
// ---------------------------------------------------------------------------

/**
 * Per-instance cache, 1 hour. A dashboard that costs a model call on every render will
 * run us out of budget and patience. A cold start loses it, costing one extra call —
 * cheaper than building a cache table.
 */
const briefCache = new Map<string, { at: number; brief: z.infer<typeof CoachBrief> }>()
const BRIEF_TTL_MS = 60 * 60 * 1000

async function loadBriefContext(userId: string) {
  const [profile] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  // READ-ONLY. XP is WRITTEN only by src/server/xp.ts (AGENTS.md rule 11).
  // TODO(feature-06): swap for xpSummary() once src/server/xp.ts lands.
  const [totals] = await db
    .select({ totalXp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))

  const [streak] = await db
    .select({ current: streaks.current })
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1)

  const courseRows = await db
    .select({
      title: courses.title,
      slug: courses.slug,
      track: courses.track,
      progressPct: enrollments.progressPct,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.studentId, userId), eq(enrollments.status, 'active')))
    .limit(10)

  const now = new Date()
  const overdueRows = await db
    .select({ title: assessments.title, courseTitle: courses.title, dueAt: assessments.dueAt })
    .from(assessments)
    .innerJoin(courses, eq(courses.id, assessments.courseId))
    .innerJoin(
      enrollments,
      and(eq(enrollments.courseId, courses.id), eq(enrollments.studentId, userId)),
    )
    .leftJoin(
      submissions,
      and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, userId)),
    )
    .where(and(lt(assessments.dueAt, now), isNull(submissions.id)))
    .limit(5)

  const totalXp = Number(totals?.totalXp ?? 0)
  const level = levelFromXp(totalXp)

  return {
    studentName: profile?.name ?? 'there',
    totalXp,
    level,
    levelName: levelName(level),
    streakDays: streak?.current ?? 0,
    courses: courseRows,
    overdue: overdueRows.map((o) => ({
      title: o.title,
      courseTitle: o.courseTitle,
      daysLate: o.dueAt ? Math.floor((now.getTime() - o.dueAt.getTime()) / 86_400_000) : 0,
    })),
    history: await loadHistory(userId, null),
  }
}

export async function brief(userId: string): Promise<{ brief: z.infer<typeof CoachBrief> }> {
  const cached = briefCache.get(userId)
  if (cached && Date.now() - cached.at < BRIEF_TTL_MS) return { brief: cached.brief }

  if (!aiEnabled()) return contract.brief.mock({})

  const ctx = await loadBriefContext(userId)

  try {
    const res = await generateJson({
      system: BRIEF_SYSTEM_PROMPT,
      // Riya's buildBriefPrompt takes a different shape from loadBriefContext's — map it
      // here rather than reshaping her builder, so her file stays hers.
      prompt: buildBriefPrompt({
        xpSummary: {
          totalXp: ctx.totalXp,
          level: ctx.level,
          xpToNextLevel: xpToNextLevel(ctx.totalXp),
        },
        courseProgress: ctx.courses.map((c) => ({
          courseTitle: c.title,
          percentComplete: c.progressPct,
        })),
        streakDays: ctx.streakDays,
        overdueItems: ctx.overdue.map((o) => ({ title: o.title, daysOverdue: o.daysLate })),
        recentReviews: ctx.history.map((h) => ({
          date: h.date,
          courseTitle: h.courseTitle,
          score: h.score,
          maxScore: h.maxScore,
        })),
      }),
      schema: CoachBrief,
    })

    // The brief is a dashboard widget, not the demo. Any failure degrades to the mock
    // rather than breaking the whole page — see the catch below.
    const value = { ...res.data, generatedAt: new Date().toISOString() }
    briefCache.set(userId, { at: Date.now(), brief: value })
    return { brief: value }
  } catch (e) {
    console.error('[ai-coach] brief failed, serving mock', e)
    return contract.brief.mock({})
  }
}

// ---------------------------------------------------------------------------
// GOOD-TO-HAVE — feature 13. Do not build the UI before Gate C is green.
// ---------------------------------------------------------------------------

export async function draftCourse(
  systemRole: string,
  input: z.infer<(typeof contract.draftCourse)['input']>,
): Promise<{ draft: z.infer<typeof CourseDraft> }> {
  if (systemRole === 'student') throw new ApiError('FORBIDDEN', 'Mentors and admins only')
  if (!aiEnabled()) return contract.draftCourse.mock(input)

  try {
    const res = await generateJson({
      system: DRAFT_COURSE_SYSTEM_PROMPT,
      prompt: buildDraftCoursePrompt(input),
      schema: CourseDraft,
    })

    // NEVER saved directly. This fills the wizard's editable fields; the mentor commits.
    return { draft: res.data }
  } catch (e) {
    throw translateAiError(e)
  }
}
