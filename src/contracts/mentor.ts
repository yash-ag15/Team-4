import { z } from 'zod'
import { defineContract } from './_kit'

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
  courseId: z.string(),
  courseTitle: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
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

export const queue = defineContract({
  method: 'GET',
  path: '/api/mentor/queue',
  auth: 'user',
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

export const decide = defineContract({
  method: 'POST',
  path: '/api/mentor/submissions/:id/decide',
  auth: 'user',
  summary: 'Submit final mentor scoring and XP decision',
  input: z.object({
    id: z.string(),
    decision: z.enum(['approve', 'request_changes']),
    finalScore: z.number().int().min(0),
    finalXp: z.number().int().min(0),
    note: z.string().max(2000).default(''),
  }),
  output: z.object({
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

export const students = defineContract({
  method: 'GET',
  path: '/api/mentor/students',
  auth: 'user',
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
})
