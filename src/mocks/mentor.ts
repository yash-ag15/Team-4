/**
 * Mentor Review fixtures — deliberately self-contained. Does not import
 * `src/mocks/factories.ts` (leftover NGO starter domain) or `src/contracts/ai-coach.ts`
 * (doesn't exist on this branch). Every field mirrors the actual schema already on this
 * branch (`src/db/schema/{learning,courses}.ts`).
 */
import type {
  MentorAiReview,
  MentorQueueItem,
  MentorReviewDetail,
  MentorDecisionKind,
} from '@/contracts/mentor'
import type { AdminStudentRow } from '@/contracts/admin'

const strongAiReview: MentorAiReview = {
  id: 'ai-review-1',
  model: 'gemini-2.5-flash',
  summary:
    'A genuinely good piece of analysis. Priya found the real drop-off point and backed it ' +
    'with numbers instead of asserting it. Where it slips is the last step — the ' +
    'recommendation does not follow from the pattern the analysis just established.',
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
    { criterion: 'Evidence', score: 20, maxScore: 25, comment: 'Specific and well-chosen, but two figures are missing their denominator.' },
    { criterion: 'Analysis', score: 30, maxScore: 35, comment: 'Explains the drop-off rather than restating it.' },
    { criterion: 'Clarity', score: 18, maxScore: 20, comment: 'Clean structure, plain language.' },
    { criterion: 'Recommendation', score: 10, maxScore: 20, comment: 'Reasonable, but not tied to the week 3-4 window.' },
  ],
  suggestedScore: 78,
  suggestedXp: 117,
  confidence: 'high',
  latencyMs: 14200,
  createdAt: '2026-08-21T06:42:00.000Z',
}

export const mockMentorQueue: MentorQueueItem[] = [
  {
    submissionId: 'submission-1',
    submittedAt: '2026-08-21T04:10:00.000Z',
    status: 'ai_reviewed',
    aiScore: 78,
    aiXpSuggested: 117,
    studentId: 'user-priya',
    studentName: 'Priya Nair',
    courseId: 'course-1',
    courseTitle: 'Data Foundations & SQL Mastery',
    assessmentId: 'assessment-2',
    assessmentTitle: 'Enrolment drop-off analysis',
    maxScore: 100,
    xpAward: 150,
    track: 'optional',
  },
  {
    submissionId: 'submission-2',
    submittedAt: '2026-08-20T18:30:00.000Z',
    status: 'ai_reviewed',
    aiScore: null,
    aiXpSuggested: null,
    studentId: 'user-daniel',
    studentName: 'Daniel Okafor',
    courseId: 'course-3',
    courseTitle: 'Communication Essentials',
    assessmentId: 'assessment-5',
    assessmentTitle: 'Weekly reflection',
    maxScore: 100,
    xpAward: 120,
    track: 'mandatory',
  },
]

const ASSESSMENT_CONTEXT: Record<
  string,
  { maxScore: number; xpAward: number }
> = {
  'submission-1': { maxScore: 100, xpAward: 150 },
  'submission-2': { maxScore: 100, xpAward: 120 },
}

export function mockReviewDetail(submissionId: string): MentorReviewDetail {
  const queueItem = mockMentorQueue.find((r) => r.submissionId === submissionId) ?? mockMentorQueue[0]

  return {
    submission: {
      id: queueItem.submissionId,
      content:
        'Enrolment drops sharply between week 3 and week 4: 62% of the total drop-off for ' +
        'the cohort happens in that single window, well before the course midpoint...',
      attachmentUrl: '',
      status: queueItem.status,
      aiScore: queueItem.aiScore,
      aiXpSuggested: queueItem.aiXpSuggested,
      finalScore: null,
      finalXp: null,
      mentorNote: '',
      submittedAt: queueItem.submittedAt,
      reviewedAt: null,
    },
    course: { id: queueItem.courseId, title: queueItem.courseTitle, track: queueItem.track },
    assessment: {
      id: queueItem.assessmentId,
      title: queueItem.assessmentTitle,
      prompt: 'Analyse the enrolment drop-off pattern in the dataset and recommend one concrete intervention.',
      rubric: [
        'Evidence (25 pts) — every claim is supported by a specific number from the dataset',
        'Analysis (35 pts) — the drop-off is explained, not just described',
        'Clarity (20 pts) — a reader who has not seen the data can follow the argument',
        'Recommendation (20 pts) — one concrete intervention that follows from the analysis',
      ].join('\n'),
      maxScore: queueItem.maxScore,
      xpAward: queueItem.xpAward,
    },
    // submission-2 stands in for "the coach failed" — no AI review, still gradable manually.
    aiReview: submissionId === 'submission-2' ? null : strongAiReview,
    student: {
      studentId: queueItem.studentId,
      studentName: queueItem.studentName,
      totalXp: 850,
      courseProgressPct: 62,
      recentScores: [
        { submissionId: 'submission-0a', assessmentTitle: 'Cleaning messy data', score: 74, submittedAt: '2026-08-10T09:00:00.000Z' },
        { submissionId: 'submission-0b', assessmentTitle: 'Working with data', score: 81, submittedAt: '2026-08-03T09:00:00.000Z' },
      ],
    },
  }
}

export const mockMentorStudents: AdminStudentRow[] = [
  {
    userId: 'user-priya',
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
    pendingSubmissions: 1,
    flags: [],
  },
  {
    userId: 'user-daniel',
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
    pendingSubmissions: 1,
    flags: ['stalled', 'inactive'],
  },
]

/**
 * Mirrors the real `decide()` XP arithmetic — finalXp is whatever the caller sends, capped at
 * `assessment.xpAward` — without a DB. Kept deterministic so the same input always scores the
 * same, matching the convention `src/mocks/ai-coach.ts` established elsewhere in this repo.
 */
export function mockDecisionFor({
  id,
  decision,
  finalScore,
  finalXp,
}: {
  id: string
  decision: MentorDecisionKind
  finalScore: number
  finalXp: number
}) {
  const context = ASSESSMENT_CONTEXT[id] ?? { maxScore: 100, xpAward: 100 }
  const clampedScore = Math.min(context.maxScore, Math.max(0, finalScore))
  const clampedXp = Math.min(context.xpAward, Math.max(0, finalXp))

  return {
    submissionId: id,
    decision,
    status: decision === 'approve' ? ('mentor_approved' as const) : ('changes_requested' as const),
    finalScore: clampedScore,
    finalXp: decision === 'approve' ? clampedXp : null,
    award:
      decision === 'approve'
        ? {
            awarded: true,
            amount: clampedXp,
            newTotalXp: 850 + clampedXp,
            newLevel: 3,
            leveledUp: false,
          }
        : null,
  }
}
