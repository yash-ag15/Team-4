import { z } from 'zod'
import { defineContract } from './_kit'
<<<<<<< HEAD

export const SubmissionStatus = z.enum([
  'submitted',
  'ai_reviewed',
  'mentor_approved',
  'changes_requested',
])
export type SubmissionStatus = z.infer<typeof SubmissionStatus>

export const QueueSubmission = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  studentEmail: z.string(),
  studentAvatar: z.string().nullable(),
  courseId: z.string(),
  courseTitle: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  maxScore: z.number().int(),
  xpAward: z.number().int(),
  status: SubmissionStatus,
  aiScore: z.number().int().nullable(),
  aiXpSuggested: z.number().int().nullable(),
  submittedAt: z.string(),
})
export type QueueSubmission = z.infer<typeof QueueSubmission>

export const AiReview = z.object({
  id: z.string(),
  score: z.number().int(),
  suggestedXp: z.number().int(),
  confidence: z.enum(['high', 'medium', 'low']),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  actionItems: z.array(z.string()),
  rubricBreakdown: z
    .array(
      z.object({
        criterion: z.string(),
        score: z.number().int(),
        maxScore: z.number().int(),
        comment: z.string(),
      }),
    )
    .optional(),
  isPreview: z.boolean(),
  reviewedAt: z.string(),
})
export type AiReview = z.infer<typeof AiReview>

export const StudentContext = z.object({
  currentXp: z.number().int(),
  level: z.number().int(),
  courseProgressPct: z.number().int(),
  recentScores: z.array(
    z.object({
      assessmentTitle: z.string(),
      score: z.number().int(),
      maxScore: z.number().int(),
    }),
  ),
})
export type StudentContext = z.infer<typeof StudentContext>

export const SubmissionDetail = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  studentEmail: z.string(),
  studentAvatar: z.string().nullable(),
=======
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
>>>>>>> origin/feature-admin-backend
  courseId: z.string(),
  courseTitle: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
<<<<<<< HEAD
  content: z.string(),
  submittedAt: z.string(),
  status: SubmissionStatus,
  finalScore: z.number().int().nullable(),
  finalXp: z.number().int().nullable(),
  mentorNote: z.string().nullable(),
  maxScore: z.number().int(),
  xpAward: z.number().int(),
})
export type SubmissionDetail = z.infer<typeof SubmissionDetail>

const MOCK_QUEUE: QueueSubmission[] = [
  {
    id: 'sub-1',
    studentId: 'user-st-1',
    studentName: 'Priya Nair',
    studentEmail: 'priya.nair@example.org',
    studentAvatar: null,
    courseId: 'course-1',
    courseTitle: 'Data Foundations',
    assessmentId: 'asm-1',
    assessmentTitle: 'SQL Aggregations & Window Functions',
    maxScore: 100,
    xpAward: 120,
    status: 'ai_reviewed',
    aiScore: 87,
    aiXpSuggested: 105,
    submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-2',
    studentId: 'user-st-2',
    studentName: 'Rahul Verma',
    studentEmail: 'rahul.verma@example.org',
    studentAvatar: null,
    courseId: 'course-2',
    courseTitle: 'Web Development Basics',
    assessmentId: 'asm-2',
    assessmentTitle: 'Responsive Layouts & Grid Systems',
    maxScore: 100,
    xpAward: 100,
    status: 'ai_reviewed',
    aiScore: 61,
    aiXpSuggested: 60,
    submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-3',
    studentId: 'user-st-3',
    studentName: 'Zoya Khan',
    studentEmail: 'zoya.khan@example.org',
    studentAvatar: null,
    courseId: 'course-1',
    courseTitle: 'Data Foundations',
    assessmentId: 'asm-1',
    assessmentTitle: 'SQL Aggregations & Window Functions',
    maxScore: 100,
    xpAward: 120,
    status: 'ai_reviewed',
    aiScore: 74,
    aiXpSuggested: 90,
    submittedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sub-4',
    studentId: 'user-st-4',
    studentName: 'Aman Gupta',
    studentEmail: 'aman.gupta@example.org',
    studentAvatar: null,
    courseId: 'course-3',
    courseTitle: 'Business Communication',
    assessmentId: 'asm-3',
    assessmentTitle: 'Executive Summary Brief',
    maxScore: 100,
    xpAward: 150,
    status: 'mentor_approved',
    aiScore: 92,
    aiXpSuggested: 140,
    submittedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
]

=======
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
>>>>>>> origin/feature-admin-backend
export const queue = defineContract({
  method: 'GET',
  path: '/api/mentor/queue',
  auth: 'user',
<<<<<<< HEAD
  summary: 'Submissions waiting for mentor decision',
  input: z.object({
    status: SubmissionStatus.optional(),
    courseId: z.string().optional(),
    limit: z.coerce.number().optional(),
  }),
  output: z.object({
    submissions: z.array(QueueSubmission),
    total: z.number().int(),
  }),
  mock: ({ status, courseId, limit }) => {
    let list = MOCK_QUEUE
    if (status) list = list.filter((s) => s.status === status)
    if (courseId) list = list.filter((s) => s.courseId === courseId)
    if (limit) list = list.slice(0, limit)
    return {
      submissions: list,
      total: list.length,
    }
  },
})

export const getForReview = defineContract({
  method: 'GET',
  path: '/api/mentor/submissions/:id',
  auth: 'user',
  summary: 'Submission detail with AI review and student context',
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    submission: SubmissionDetail,
    aiReview: AiReview.nullable(),
    studentContext: StudentContext,
  }),
  mock: ({ id }) => {
    const item = MOCK_QUEUE.find((q) => q.id === id) ?? MOCK_QUEUE[0]
    return {
      submission: {
        ...item,
        content: `### Executive SQL Aggregation Summary\n\nTo analyze customer churn and monthly active transaction volumes, I authored the following window function query:\n\n\`\`\`sql\nWITH monthly_cohort AS (\n  SELECT\n    user_id,\n    DATE_TRUNC('month', created_at) AS signup_month,\n    COUNT(order_id) OVER(PARTITION BY user_id) AS total_orders,\n    DENSE_RANK() OVER(PARTITION BY user_id ORDER BY order_date DESC) as rank_recent\n  FROM transactions\n  WHERE status = 'completed'\n)\nSELECT signup_month, COUNT(DISTINCT user_id) as active_users\nFROM monthly_cohort\nGROUP BY 1\nORDER BY 1 DESC;\n\`\`\`\n\n**Insights:**\n- Churn reduced by 14% among users completing 3+ orders in their first 30 days.\n- Peak transaction velocity observed on Saturday evenings.`,
        finalScore: item.status === 'mentor_approved' ? item.aiScore : null,
        finalXp: item.status === 'mentor_approved' ? item.aiXpSuggested : null,
        mentorNote:
          item.status === 'mentor_approved'
            ? 'Excellent query optimization and thorough cohort breakdown.'
            : null,
      },
      aiReview: {
        id: `air-${id}`,
        score: item.aiScore ?? 87,
        suggestedXp: item.aiXpSuggested ?? 105,
        confidence: 'high' as const,
        feedback:
          'Strong analytical structure and correct usage of window functions with partition keys. Demonstrates deep understanding of cohort segmentation.',
        strengths: [
          'Correct window clause syntax and partitioning',
          'Clear presentation of business takeaways alongside raw SQL',
          'Good adherence to naming conventions and formatting standards',
        ],
        weaknesses: [
          'Could have included an indexing recommendation on `transactions(status, created_at)` for large dataset scale',
          'Consider handling edge-case NULL timestamps explicitly',
        ],
        actionItems: [
          'Add an EXPLAIN ANALYZE benchmark comment',
          'Explore cumulative sum running totals for retention curve graphs',
        ],
        rubricBreakdown: [
          { criterion: 'Query Correctness', score: 38, maxScore: 40, comment: 'Flawless syntax and logic.' },
          { criterion: 'Analytical Depth', score: 28, maxScore: 30, comment: 'Great cohort insights.' },
          { criterion: 'Code Quality & Formatting', score: 21, maxScore: 30, comment: 'Clean formatting, minor index note.' },
        ],
        isPreview: false,
        reviewedAt: item.submittedAt,
      },
      studentContext: {
        currentXp: 1240,
        level: 4,
        courseProgressPct: 72,
        recentScores: [
          { assessmentTitle: 'Assessment 1: Relational Modeling', score: 92, maxScore: 100 },
          { assessmentTitle: 'Assessment 0: Data Types & Schemas', score: 84, maxScore: 100 },
        ],
      },
    }
  },
})

=======
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
>>>>>>> origin/feature-admin-backend
export const decide = defineContract({
  method: 'POST',
  path: '/api/mentor/submissions/:id/decide',
  auth: 'user',
<<<<<<< HEAD
  summary: 'Submit final mentor scoring and XP decision',
  input: z.object({
    id: z.string(),
    decision: z.enum(['approve', 'request_changes']),
=======
  summary: 'Finalize a submission — approve (awards XP) or request changes (awards none).',
  input: z.object({
    id: z.string(),
    decision: MentorDecisionKind,
>>>>>>> origin/feature-admin-backend
    finalScore: z.number().int().min(0),
    finalXp: z.number().int().min(0),
    note: z.string().max(2000).default(''),
  }),
  output: z.object({
<<<<<<< HEAD
    success: z.boolean(),
    status: SubmissionStatus,
    awardedXp: z.number().int(),
    note: z.string(),
  }),
  mock: ({ decision, finalScore, finalXp, note }) => {
    return {
      success: true,
      status: (decision === 'approve' ? 'mentor_approved' : 'changes_requested') as SubmissionStatus,
      awardedXp: decision === 'approve' ? finalXp : 0,
      note,
    }
  },
})

=======
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
>>>>>>> origin/feature-admin-backend
export const students = defineContract({
  method: 'GET',
  path: '/api/mentor/students',
  auth: 'user',
<<<<<<< HEAD
  summary: 'List mentor student roster with at-risk triage flags',
  input: z.object({
    flag: z.string().optional(),
    q: z.string().optional(),
    limit: z.coerce.number().optional(),
  }),
  output: z.object({
    students: z.array(
      z.object({
        userId: z.string(),
        name: z.string(),
        email: z.string(),
        image: z.string().nullable(),
        cohortYear: z.string(),
        campus: z.string(),
        totalXp: z.number().int(),
        level: z.number().int(),
        coursesEnrolled: z.number().int(),
        coursesCompleted: z.number().int(),
        avgProgressPct: z.number().int(),
        lastActiveAt: z.string().nullable(),
        pendingSubmissions: z.number().int(),
        flags: z.array(z.enum(['overdue', 'inactive', 'stalled', 'awaiting_resubmit'])),
        reason: z.string().optional(),
      }),
    ),
  }),
  mock: () => ({
    students: [
      {
        userId: 'st-1',
        name: 'Rahul Verma',
        email: 'rahul.verma@example.org',
        image: null,
        cohortYear: '2026',
        campus: 'Mumbai Central',
        totalXp: 1450,
        level: 4,
        coursesEnrolled: 3,
        coursesCompleted: 1,
        avgProgressPct: 38,
        lastActiveAt: new Date(Date.now() - 9 * 86400 * 1000).toISOString(),
        pendingSubmissions: 0,
        flags: ['inactive' as const],
        reason: 'No learning activity in the last 9 days',
      },
      {
        userId: 'st-2',
        name: 'Nikita Rao',
        email: 'nikita.rao@example.org',
        image: null,
        cohortYear: '2026',
        campus: 'Bengaluru Tech',
        totalXp: 2100,
        level: 5,
        coursesEnrolled: 4,
        coursesCompleted: 2,
        avgProgressPct: 55,
        lastActiveAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
        pendingSubmissions: 1,
        flags: ['overdue' as const],
        reason: 'Data Foundations assessment overdue by 2 days',
      },
    ],
  }),
=======
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
>>>>>>> origin/feature-admin-backend
})
