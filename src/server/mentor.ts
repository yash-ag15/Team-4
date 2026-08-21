import { eq, and, asc, desc, lt, sql, inArray, ilike } from 'drizzle-orm'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import * as mentorContract from '@/contracts/mentor'
import type { StudentFlag } from '@/contracts/admin'
import { db } from '@/db'
import {
  courses,
  assessments,
  submissions,
  aiReviews,
  enrollments,
  lessonProgress,
  dailyCheckins,
  user as userTable,
} from '@/db/schema'
import { awardXp, getTotalXpForUsers, type XpAward } from '@/server/xp'
import { levelFromXp } from '@/lib/xp'

/**
 * FEATURE 07 — MENTOR REVIEW & FINAL XP AWARD (backend).
 *
 * The AI Coach ADVISES. The mentor DECIDES. Nothing in this file generates an AI review or
 * calls a model — `getForReview` only reads the latest non-preview row already in
 * `ai_reviews`. Nothing in this file imports `xpEvents` or inserts into it — `decide()` calls
 * `awardXp()` (src/server/xp.ts), which is the only writer.
 */

export type SessionUser = { id: string; systemRole?: string | null }

export type QueueInput = z.infer<(typeof mentorContract.queue)['input']>
export type DecideInput = z.infer<(typeof mentorContract.decide)['input']>
export type StudentsInput = z.infer<(typeof mentorContract.students)['input']>

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/** A mentor or admin may use Mentor Review. A student may not. */
export function assertMentor(user: SessionUser): void {
  if (user.systemRole !== 'mentor' && user.systemRole !== 'admin') {
    throw new ApiError('FORBIDDEN', 'Mentors only')
  }
}

/**
 * Ownership is `courses.mentorId`, NEVER `submissions.mentorId` — the latter is null until a
 * decision is made, so filtering on it would make every mentor's queue empty.
 */
export async function assertOwnsCourse(user: SessionUser, courseId: string): Promise<void> {
  if (user.systemRole === 'admin') return

  const [course] = await db
    .select({ mentorId: courses.mentorId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)

  if (!course) throw new ApiError('NOT_FOUND', 'Course not found')
  if (course.mentorId !== user.id) throw new ApiError('FORBIDDEN', 'Not your course')
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export async function queue(
  user: SessionUser,
  input: QueueInput,
): Promise<{ reviews: mentorContract.MentorQueueItem[]; total: number }> {
  assertMentor(user)

  const conditions = [
    eq(submissions.status, input.status ?? 'ai_reviewed'),
    user.systemRole === 'admin' ? undefined : eq(courses.mentorId, user.id),
    input.courseId ? eq(courses.id, input.courseId) : undefined,
  ].filter((c) => c !== undefined)

  // Total independent of `limit` — the frontend badge calls `queue({ limit: 1 })` purely to
  // keep the payload small while still getting an accurate pending count.
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .where(and(...conditions))

  const rows = await db
    .select({
      submissionId: submissions.id,
      submittedAt: submissions.submittedAt,
      status: submissions.status,
      aiScore: submissions.aiScore,
      aiXpSuggested: submissions.aiXpSuggested,
      studentId: submissions.studentId,
      studentName: userTable.name,
      courseId: courses.id,
      courseTitle: courses.title,
      track: courses.track,
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      maxScore: assessments.maxScore,
      xpAward: assessments.xpAward,
    })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .innerJoin(userTable, eq(submissions.studentId, userTable.id))
    .where(and(...conditions))
    .orderBy(asc(submissions.submittedAt))
    .limit(input.limit ?? 100)

  return {
    reviews: rows.map((r) => ({
      ...r,
      submittedAt: r.submittedAt.toISOString(),
    })),
    total: Number(total),
  }
}

// ---------------------------------------------------------------------------
// Get for review
// ---------------------------------------------------------------------------

async function loadSubmissionContext(id: string) {
  const [row] = await db
    .select({ submission: submissions, assessment: assessments, course: courses })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .where(eq(submissions.id, id))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', 'Submission not found')
  return row
}

export async function getForReview(
  user: SessionUser,
  id: string,
): Promise<mentorContract.MentorReviewDetail> {
  assertMentor(user)
  const { submission, assessment, course } = await loadSubmissionContext(id)
  await assertOwnsCourse(user, course.id)

  // The latest NON-PREVIEW review — a student who ran previews has several rows; only one
  // (isPreview: false) is the real review the mentor should see.
  const [review] = await db
    .select()
    .from(aiReviews)
    .where(and(eq(aiReviews.submissionId, id), eq(aiReviews.isPreview, false)))
    .orderBy(desc(aiReviews.createdAt))
    .limit(1)

  const [enrollment] = await db
    .select({ progressPct: enrollments.progressPct })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, submission.studentId), eq(enrollments.courseId, course.id)))
    .limit(1)

  const recentScores = await db
    .select({
      submissionId: submissions.id,
      assessmentTitle: assessments.title,
      score: submissions.finalScore,
      aiScore: submissions.aiScore,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .where(and(eq(submissions.studentId, submission.studentId), sql`${submissions.id} != ${id}`))
    .orderBy(desc(submissions.submittedAt))
    .limit(2)

  const totalXpByUser = await getTotalXpForUsers([submission.studentId])

  return {
    submission: {
      id: submission.id,
      content: submission.content,
      attachmentUrl: submission.attachmentUrl,
      status: submission.status,
      aiScore: submission.aiScore,
      aiXpSuggested: submission.aiXpSuggested,
      finalScore: submission.finalScore,
      finalXp: submission.finalXp,
      mentorNote: submission.mentorNote,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
    },
    course: { id: course.id, title: course.title, track: course.track },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      prompt: assessment.prompt,
      rubric: assessment.rubric,
      maxScore: assessment.maxScore,
      xpAward: assessment.xpAward,
    },
    aiReview: review
      ? {
          id: review.id,
          model: review.model,
          summary: review.summary,
          strengths: review.strengths,
          weaknesses: review.weaknesses,
          actionItems: review.actionItems,
          rubricBreakdown: review.rubricBreakdown as mentorContract.RubricLine[],
          suggestedScore: review.suggestedScore,
          suggestedXp: review.suggestedXp,
          confidence: review.confidence,
          latencyMs: review.latencyMs,
          createdAt: review.createdAt.toISOString(),
        }
      : null,
    student: {
      studentId: submission.studentId,
      studentName: await studentNameOf(submission.studentId),
      totalXp: totalXpByUser[submission.studentId] ?? 0,
      courseProgressPct: enrollment?.progressPct ?? null,
      recentScores: recentScores.map((s) => ({
        submissionId: s.submissionId,
        assessmentTitle: s.assessmentTitle,
        score: s.score ?? s.aiScore,
        submittedAt: s.submittedAt.toISOString(),
      })),
    },
  }
}

/** `getForReview` needs the student's name but doesn't otherwise select from `userTable` —
 *  a tiny lookup rather than joining a fourth table into the query above for one column. */
async function studentNameOf(studentId: string): Promise<string> {
  const [row] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, studentId)).limit(1)
  return row?.name ?? 'Unknown student'
}

// ---------------------------------------------------------------------------
// Decide
// ---------------------------------------------------------------------------

async function loadForDecision(id: string) {
  const [row] = await db
    .select({ submission: submissions, assessment: assessments, courseId: assessments.courseId })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .where(eq(submissions.id, id))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', 'Submission not found')
  return row
}

export async function decide(
  user: SessionUser,
  input: DecideInput,
): Promise<z.infer<(typeof mentorContract.decide)['output']>> {
  assertMentor(user)

  const { submission, assessment, courseId } = await loadForDecision(input.id)
  await assertOwnsCourse(user, courseId)

  const finalScore = clamp(input.finalScore, 0, assessment.maxScore)
  const finalXp = clamp(input.finalXp, 0, assessment.xpAward)
  const status = input.decision === 'approve' ? ('mentor_approved' as const) : ('changes_requested' as const)

  await db
    .update(submissions)
    .set({
      status,
      finalScore,
      finalXp: input.decision === 'approve' ? finalXp : null,
      mentorId: user.id,
      mentorNote: input.note,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, input.id))

  let award: XpAward | null = null
  if (input.decision === 'approve') {
    award = await awardXp({
      userId: submission.studentId,
      amount: finalXp,
      reason: 'assessment_award',
      sourceType: 'submission',
      sourceId: submission.id,
      courseId,
      awardedBy: user.id,
      note: `${assessment.title} — ${finalScore}/${assessment.maxScore}`,
      idempotencyKey: `submission:${submission.id}`,
    })
    // checkBadges(submission.studentId) belongs to feature 08 (gamification), which has not
    // landed on this branch — no badges/user_badges logic exists to call. Intentionally
    // skipped rather than faked; see the implementation report for this run.
  }

  return {
    submissionId: submission.id,
    decision: input.decision,
    status,
    finalScore,
    finalXp: input.decision === 'approve' ? finalXp : null,
    award: award
      ? {
          awarded: award.awarded,
          amount: award.amount,
          newTotalXp: award.newTotalXp,
          newLevel: award.newLevel,
          leveledUp: award.leveledUp,
        }
      : null,
  }
}

// ---------------------------------------------------------------------------
// Students roster (feature 11 — mentor.students)
// ---------------------------------------------------------------------------

const INACTIVE_AFTER_DAYS = 7
const STALLED_MIN_ENROLLMENT_AGE_DAYS = 14
const STALLED_MAX_PROGRESS_PCT = 25
const AWAITING_RESUBMIT_AFTER_DAYS = 3

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export async function students(
  user: SessionUser,
  input: StudentsInput,
): Promise<{ students: z.infer<typeof mentorContract.students.output>['students'] }> {
  assertMentor(user)

  const courseFilter = user.systemRole === 'admin' ? undefined : eq(courses.mentorId, user.id)

  const baseConditions = [
    courseFilter,
    input.courseId ? eq(courses.id, input.courseId) : undefined,
    input.q ? ilike(userTable.name, `%${input.q}%`) : undefined,
  ].filter((c) => c !== undefined)

  // 1. Base aggregates: one grouped query over enrollments joined to this mentor's courses.
  const rows = await db
    .select({
      userId: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      cohortYear: userTable.cohortYear,
      campus: userTable.campus,
      coursesEnrolled: sql<number>`count(distinct ${enrollments.courseId})`,
      coursesCompleted: sql<number>`count(distinct case when ${enrollments.status} = 'completed' then ${enrollments.courseId} end)`,
      avgProgressPct: sql<number>`coalesce(avg(${enrollments.progressPct}), 0)`,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(userTable, eq(enrollments.studentId, userTable.id))
    .where(and(...baseConditions))
    .groupBy(userTable.id, userTable.name, userTable.email, userTable.image, userTable.cohortYear, userTable.campus)
    .limit(input.limit ?? 100)

  const studentIds = rows.map((r) => r.userId)
  if (studentIds.length === 0) return { students: [] }

  // 2. Total XP — bulk, via the XP engine (never xpEvents directly).
  const totalXpByUser = await getTotalXpForUsers(studentIds)

  // 3. Pending submissions per student, scoped to this mentor's courses.
  const pendingRows = await db
    .select({ studentId: submissions.studentId, count: sql<number>`count(*)` })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .where(
      and(
        inArray(submissions.studentId, studentIds),
        inArray(submissions.status, ['submitted', 'ai_reviewed']),
        courseFilter,
      ),
    )
    .groupBy(submissions.studentId)
  const pendingByUser = Object.fromEntries(pendingRows.map((r) => [r.studentId, Number(r.count)]))

  // 4. lastActiveAt — greatest of three independent activity sources, merged in JS (the three
  //    tables have different grains; a single joined query would fan out and inflate counts).
  const [lessonRows, submissionRows, checkinRows] = await Promise.all([
    db
      .select({ studentId: enrollments.studentId, last: sql<Date>`max(${lessonProgress.completedAt})` })
      .from(lessonProgress)
      .innerJoin(enrollments, eq(lessonProgress.enrollmentId, enrollments.id))
      .where(inArray(enrollments.studentId, studentIds))
      .groupBy(enrollments.studentId),
    db
      .select({ studentId: submissions.studentId, last: sql<Date>`max(${submissions.submittedAt})` })
      .from(submissions)
      .where(inArray(submissions.studentId, studentIds))
      .groupBy(submissions.studentId),
    db
      .select({ studentId: dailyCheckins.userId, last: sql<Date>`max(${dailyCheckins.createdAt})` })
      .from(dailyCheckins)
      .where(inArray(dailyCheckins.userId, studentIds))
      .groupBy(dailyCheckins.userId),
  ])
  const lastActiveByUser: Record<string, Date> = {}
  for (const source of [lessonRows, submissionRows, checkinRows]) {
    for (const r of source) {
      if (!r.last) continue
      const current = lastActiveByUser[r.studentId]
      if (!current || r.last > current) lastActiveByUser[r.studentId] = r.last
    }
  }

  // 5. Flag inputs — each a set of student ids, computed with one bounded query per rule.
  const overdueCourseRows = await db
    .selectDistinct({ studentId: enrollments.studentId })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        inArray(enrollments.studentId, studentIds),
        sql`${enrollments.status} != 'completed'`,
        lt(courses.dueAt, new Date()),
      ),
    )

  const overdueAssessmentRows = await db
    .selectDistinct({ studentId: enrollments.studentId })
    .from(enrollments)
    .innerJoin(assessments, eq(assessments.courseId, enrollments.courseId))
    .leftJoin(
      submissions,
      and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, enrollments.studentId)),
    )
    .where(
      and(
        inArray(enrollments.studentId, studentIds),
        lt(assessments.dueAt, new Date()),
        sql`${submissions.id} is null`,
      ),
    )

  const stalledRows = await db
    .selectDistinct({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.studentId, studentIds),
        lt(enrollments.progressPct, STALLED_MAX_PROGRESS_PCT),
        lt(enrollments.enrolledAt, daysAgo(STALLED_MIN_ENROLLMENT_AGE_DAYS)),
      ),
    )

  const awaitingResubmitRows = await db
    .selectDistinct({ studentId: submissions.studentId })
    .from(submissions)
    .where(
      and(
        inArray(submissions.studentId, studentIds),
        eq(submissions.status, 'changes_requested'),
        lt(submissions.reviewedAt, daysAgo(AWAITING_RESUBMIT_AFTER_DAYS)),
      ),
    )

  const overdueSet = new Set([...overdueCourseRows, ...overdueAssessmentRows].map((r) => r.studentId))
  const stalledSet = new Set(stalledRows.map((r) => r.studentId))
  const awaitingResubmitSet = new Set(awaitingResubmitRows.map((r) => r.studentId))

  // 6. Assemble. Flags are four plain booleans over data already loaded — JS, not SQL.
  return {
    students: rows.map((r) => {
      const lastActiveAt = lastActiveByUser[r.userId] ?? null
      const flags: StudentFlag[] = []
      if (overdueSet.has(r.userId)) flags.push('overdue')
      if (!lastActiveAt || lastActiveAt < daysAgo(INACTIVE_AFTER_DAYS)) flags.push('inactive')
      if (stalledSet.has(r.userId)) flags.push('stalled')
      if (awaitingResubmitSet.has(r.userId)) flags.push('awaiting_resubmit')

      const totalXp = totalXpByUser[r.userId] ?? 0

      return {
        userId: r.userId,
        name: r.name,
        email: r.email,
        image: r.image,
        cohortYear: r.cohortYear ?? '',
        campus: r.campus ?? '',
        totalXp,
        level: levelFromXp(totalXp),
        coursesEnrolled: Number(r.coursesEnrolled),
        coursesCompleted: Number(r.coursesCompleted),
        avgProgressPct: Math.round(Number(r.avgProgressPct)),
        lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
        pendingSubmissions: pendingByUser[r.userId] ?? 0,
        flags,
      }
    }).filter((s) => {
      if (!input.flag) return true
      if (input.flag === 'at_risk') return s.flags.length > 0
      return s.flags.includes(input.flag)
    }),
  }
}
