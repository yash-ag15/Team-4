import type {
  AiReview,
  QueueSubmission,
  SubmissionDetail,
  StudentContext,
} from '@/contracts/mentor'
import type { AdminStudentRow } from '@/contracts/admin'

export const mockAiReview: AiReview = {
  id: 'ai-review-1',
  feedback:
    'A genuinely good piece of analysis. Priya found the real drop-off point and backed it ' +
    'with numbers instead of asserting it.',
  strengths: [
    'Anchors the argument in the data: "62% of the drop happens between week 3 and week 4."',
    'Separates correlation from cause when discussing the assignment deadline.',
  ],
  weaknesses: [
    'The recommendation targets week 1, but the analysis puts the drop-off at week 3-4.',
  ],
  actionItems: [
    'Rewrite the recommendation so it acts on the week 3-4 window identified in the analysis.',
  ],
  rubricBreakdown: [
    { criterion: 'Evidence', score: 20, maxScore: 25, comment: 'Specific and well-chosen.' },
    { criterion: 'Analysis', score: 30, maxScore: 35, comment: 'Explains the drop-off.' },
    { criterion: 'Clarity', score: 18, maxScore: 20, comment: 'Clean structure, plain language.' },
    { criterion: 'Recommendation', score: 10, maxScore: 20, comment: 'Reasonable.' },
  ],
  score: 78,
  suggestedXp: 117,
  confidence: 'high',
  isPreview: false,
  reviewedAt: '2026-08-21T06:42:00.000Z',
}

export const mockMentorQueue: QueueSubmission[] = [
  {
    id: 'submission-1',
    submittedAt: '2026-08-21T04:10:00.000Z',
    status: 'ai_reviewed',
    aiScore: 78,
    aiXpSuggested: 117,
    studentId: 'user-priya',
    studentName: 'Priya Nair',
    studentEmail: 'priya.nair@katalyst.test',
    studentAvatar: null,
    courseId: 'course-1',
    courseTitle: 'Data Foundations & SQL Mastery',
    assessmentId: 'assessment-2',
    assessmentTitle: 'Enrolment drop-off analysis',
    maxScore: 100,
    xpAward: 150,
  },
  {
    id: 'submission-2',
    submittedAt: '2026-08-20T18:30:00.000Z',
    status: 'ai_reviewed',
    aiScore: null,
    aiXpSuggested: null,
    studentId: 'user-daniel',
    studentName: 'Daniel Okafor',
    studentEmail: 'daniel.okafor@katalyst.test',
    studentAvatar: null,
    courseId: 'course-3',
    courseTitle: 'Communication Essentials',
    assessmentId: 'assessment-5',
    assessmentTitle: 'Weekly reflection',
    maxScore: 100,
    xpAward: 120,
  },
]

export function mockReviewDetail(submissionId: string): {
  submission: SubmissionDetail
  aiReview: AiReview | null
  studentContext: StudentContext
} {
  const queueItem = mockMentorQueue.find((r) => r.id === submissionId) ?? mockMentorQueue[0]

  return {
    submission: {
      id: queueItem.id,
      studentId: queueItem.studentId,
      studentName: queueItem.studentName,
      studentEmail: queueItem.studentEmail,
      studentAvatar: null,
      courseId: queueItem.courseId,
      courseTitle: queueItem.courseTitle,
      assessmentId: queueItem.assessmentId,
      assessmentTitle: queueItem.assessmentTitle,
      content:
        'Enrolment drops sharply between week 3 and week 4: 62% of the total drop-off for ' +
        'the cohort happens in that single window, well before the course midpoint...',
      status: queueItem.status,
      finalScore: null,
      finalXp: null,
      mentorNote: '',
      submittedAt: queueItem.submittedAt,
      maxScore: queueItem.maxScore,
      xpAward: queueItem.xpAward,
    },
    aiReview: submissionId === 'submission-2' ? null : mockAiReview,
    studentContext: {
      currentXp: 850,
      level: 3,
      courseProgressPct: 62,
      recentScores: [
        { assessmentTitle: 'Cleaning messy data', score: 74, maxScore: 100 },
        { assessmentTitle: 'Working with data', score: 81, maxScore: 100 },
      ],
    },
  }
}

export function mockDecisionFor(input: {
  id: string
  decision: string
  score?: number
  finalScore?: number
  finalXp?: number
  mentorNote?: string
  note?: string
}) {
  const approved = input.decision === 'approve'
  const finalScore = input.score ?? input.finalScore ?? 80
  const finalXp = input.finalXp ?? 100
  return {
    success: true,
    submissionId: input.id,
    status: approved ? ('mentor_approved' as const) : ('changes_requested' as const),
    finalScore: approved ? finalScore : null,
    finalXp: approved ? finalXp : null,
    awardedXp: approved ? finalXp : 0,
    note: input.mentorNote ?? input.note ?? '',
    award: approved
      ? {
          awarded: true,
          amount: finalXp,
          newTotalXp: 950,
          newLevel: 3,
          leveledUp: false,
        }
      : null,
  }
}

export const mockMentorStudents: AdminStudentRow[] = [
  {
    id: 'user-priya',
    name: 'Priya Nair',
    email: 'priya.nair@katalyst.test',
    image: null,
    cohortYear: '2026',
    campus: 'Bengaluru',
    totalXp: 850,
    level: 3,
    coursesEnrolled: 3,
    coursesCompleted: 1,
    avgProgressPct: 68,
    lastActiveAt: '2026-08-21T04:10:00.000Z',
    flag: null,
    flagReason: null,
  },
  {
    id: 'user-daniel',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@katalyst.test',
    image: null,
    cohortYear: '2026',
    campus: 'Lagos',
    totalXp: 210,
    level: 1,
    coursesEnrolled: 2,
    coursesCompleted: 0,
    avgProgressPct: 18,
    lastActiveAt: '2026-08-10T11:00:00.000Z',
    flag: 'stalled',
    flagReason: 'Low progress on enrolled courses',
  },
]
