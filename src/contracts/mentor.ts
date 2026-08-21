import { z } from 'zod'
import { defineContract } from './_kit'
import { AdminStudentRow, StudentFlag } from './admin'

export const SubmissionStatus = z.enum([
  'draft',
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
  studentAvatar: z.string().nullable().optional(),
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
  isPreview: z.boolean().optional(),
  reviewedAt: z.string().optional(),
})
export type AiReview = z.infer<typeof AiReview>

export const StudentContext = z.object({
  currentXp: z.number().int(),
  level: z.number().int(),
  courseProgressPct: z.number().int(),
  recentScores: z.array(
    z.object({
      assessmentTitle: z.string(),
      score: z.number().int().nullable(),
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
  studentAvatar: z.string().nullable().optional(),
  courseId: z.string(),
  courseTitle: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  content: z.string(),
  submittedAt: z.string(),
  status: SubmissionStatus,
  finalScore: z.number().int().nullable(),
  finalXp: z.number().int().nullable(),
  mentorNote: z.string().nullable().optional(),
  maxScore: z.number().int(),
  xpAward: z.number().int(),
})
export type SubmissionDetail = z.infer<typeof SubmissionDetail>

export const MentorDecisionKind = z.enum(['approve', 'changes_requested', 'request_changes'])
export type MentorDecisionKind = z.infer<typeof MentorDecisionKind>

export type MentorAiReview = AiReview
export type MentorQueueItem = QueueSubmission
export type MentorReviewDetail = {
  submission: SubmissionDetail
  aiReview: AiReview | null
  studentContext: StudentContext
}

export const XpAwardResult = z.object({
  awarded: z.boolean(),
  amount: z.number().int(),
  newTotalXp: z.number().int(),
  newLevel: z.number().int(),
  leveledUp: z.boolean(),
})
export type XpAwardResult = z.infer<typeof XpAwardResult>

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export const queue = defineContract({
  method: 'GET',
  path: '/api/mentor/queue',
  auth: 'user',
  summary: 'Submissions waiting for mentor decision',
  input: z.object({
    courseId: z.string().optional(),
    status: SubmissionStatus.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    submissions: z.array(QueueSubmission),
    total: z.number().int(),
  }),
  mock: () => ({
    submissions: [
      {
        id: 'sub-1',
        studentId: 'user-st-1',
        studentName: 'Priya Nair',
        studentEmail: 'priya.nair@example.org',
        studentAvatar: null,
        courseId: 'course-1',
        courseTitle: 'Data Foundations & SQL Mastery',
        assessmentId: 'assessment-2',
        assessmentTitle: 'Enrolment drop-off analysis',
        maxScore: 100,
        xpAward: 150,
        status: 'ai_reviewed' as const,
        aiScore: 78,
        aiXpSuggested: 117,
        submittedAt: '2026-08-21T04:10:00.000Z',
      },
    ],
    total: 1,
  }),
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
  mock: ({ id }) => ({
    submission: {
      id,
      studentId: 'user-priya',
      studentName: 'Priya Nair',
      studentEmail: 'priya.nair@example.org',
      studentAvatar: null,
      courseId: 'course-1',
      courseTitle: 'Data Foundations & SQL Mastery',
      assessmentId: 'assessment-2',
      assessmentTitle: 'Enrolment drop-off analysis',
      content: 'Here is my submission analyzing the drop-off data...',
      submittedAt: '2026-08-21T04:10:00.000Z',
      status: 'ai_reviewed' as const,
      finalScore: null,
      finalXp: null,
      mentorNote: '',
      maxScore: 100,
      xpAward: 150,
    },
    aiReview: {
      id: 'ai-rev-1',
      score: 78,
      suggestedXp: 117,
      confidence: 'high' as const,
      feedback: 'Good analysis of drop-off points with concrete data.',
      strengths: ['Identified week 3-4 dropoff', 'Solid SQL queries'],
      weaknesses: ['Recommendation does not directly target dropoff week'],
      actionItems: ['Align recommendations with week 3 data'],
      rubricBreakdown: [
        { criterion: 'Evidence', score: 20, maxScore: 25, comment: 'Strong evidence' },
        { criterion: 'Analysis', score: 30, maxScore: 35, comment: 'Detailed analysis' },
      ],
      isPreview: false,
      reviewedAt: '2026-08-21T04:15:00.000Z',
    },
    studentContext: {
      currentXp: 350,
      level: 2,
      courseProgressPct: 65,
      recentScores: [
        { assessmentTitle: 'SQL Basics', score: 85, maxScore: 100 },
      ],
    },
  }),
})
export const get = getForReview

export const decide = defineContract({
  method: 'POST',
  path: '/api/mentor/submissions/:id/decide',
  auth: 'user',
  summary: 'Mentor records final score/XP or requests changes',
  input: z.object({
    id: z.string(),
    decision: MentorDecisionKind,
    score: z.number().int().min(0).max(1000).optional(),
    finalScore: z.number().int().min(0).max(1000).optional(),
    finalXp: z.number().int().min(0).max(10000).optional(),
    mentorNote: z.string().max(2000).optional(),
    note: z.string().max(2000).optional(),
  }),
  output: z.object({
    success: z.boolean(),
    submissionId: z.string(),
    status: SubmissionStatus,
    finalScore: z.number().int().nullable(),
    finalXp: z.number().int().nullable(),
    awardedXp: z.number().int().optional(),
    note: z.string().optional(),
    award: XpAwardResult.nullable().optional(),
  }),
  mock: (input) => ({
    success: true,
    submissionId: input.id,
    status: input.decision === 'approve' ? ('mentor_approved' as const) : ('changes_requested' as const),
    finalScore: input.score ?? input.finalScore ?? 85,
    finalXp: input.finalXp ?? 100,
    awardedXp: input.finalXp ?? 100,
    note: input.mentorNote ?? input.note ?? '',
    award: {
      awarded: true,
      amount: input.finalXp ?? 100,
      newTotalXp: 450,
      newLevel: 3,
      leveledUp: false,
    },
  }),
})

export const students = defineContract({
  method: 'GET',
  path: '/api/mentor/students',
  auth: 'user',
  summary: 'Students enrolled in this mentor courses with triage flags',
  input: z.object({
    courseId: z.string().optional(),
    flag: StudentFlag.optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    students: z.array(AdminStudentRow),
  }),
  mock: () => ({
    students: [],
  }),
})
