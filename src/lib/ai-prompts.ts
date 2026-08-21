/**
 * The AI Coach's voice — owned by Riya (`feature/ai-coach-front`).
 *
 * Consumed by `src/server/ai-coach.ts` (Yash), which passes `COACH_SYSTEM_PROMPT` as
 * `system` and the output of `buildReviewPrompt`/`buildBriefPrompt` as the user message in
 * `anthropic.messages.parse`. See `plans/katalyst/ai-coach.md` §5.
 *
 * These are pure string builders — no SDK calls, no contract types. The shapes below are
 * prompt inputs, not the `AiReviewPayload`/`CoachBrief` wire types in `@/contracts/ai-coach`.
 */

export const COACH_SYSTEM_PROMPT = `You are the Katalyst AI Coach. You review student submissions for a mentoring
programme and give feedback that helps them improve.

You are an advisor, not the grader. A human mentor makes the final decision on the
score and the XP. Say so when it is relevant; never imply your score is final.

How to review:
- Judge ONLY against the rubric you are given. Do not invent criteria.
- Quote the student's own words when you name a strength or a weakness. Specific
  beats kind.
- Every weakness must be paired with an action item the student can do today.
- Be honest about a weak submission. An inflated score teaches nothing and the
  mentor will override you anyway.
- Address the student as "you". Warm, direct, no preamble.
- If the submission is empty, off-topic or too short to judge, say so plainly,
  score it accordingly, and set confidence to "low".`

interface ReviewPromptCourse {
  title: string
  category: string
  difficulty: string
  track: 'mandatory' | 'optional'
}

interface ReviewPromptAssessment {
  title: string
  kind: string
  prompt: string
  maxScore: number
  xpAward: number
  /** Verbatim rubric text — the single biggest quality lever in the whole feature. */
  rubric: string
}

interface ReviewPromptSubmission {
  content: string
  attachmentUrl?: string | null
}

interface ReviewPromptHistoryItem {
  date: string
  courseTitle: string
  score: number
  maxScore: number
  recurringWeakness?: string
}

export const buildReviewPrompt = ({
  course,
  assessment,
  submission,
  history,
}: {
  course: ReviewPromptCourse
  assessment: ReviewPromptAssessment
  submission: ReviewPromptSubmission
  history: ReviewPromptHistoryItem[]
}): string => {
  const sections: string[] = []

  sections.push(
    [
      '## Course',
      `Title: ${course.title}`,
      `Category: ${course.category}`,
      `Difficulty: ${course.difficulty}`,
      `Track: ${course.track}`,
      course.track === 'optional'
        ? 'This is a self-driven course; students choose it, so hold the bar.'
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )

  sections.push(
    [
      '## Assessment',
      `Title: ${assessment.title}`,
      `Kind: ${assessment.kind}`,
      `Prompt: ${assessment.prompt}`,
      `Max score: ${assessment.maxScore}`,
      `XP on full marks: ${assessment.xpAward}`,
      '',
      'Rubric (verbatim — judge only against this):',
      assessment.rubric,
    ].join('\n'),
  )

  sections.push(
    [
      '## Submission',
      submission.content,
      submission.attachmentUrl ? `Attachment: ${submission.attachmentUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )

  // History is the first thing to drop if the review is timing out — never the rubric.
  const recentHistory = history.slice(-5)
  if (recentHistory.length > 0) {
    sections.push(
      [
        "## This student's recent reviews",
        ...recentHistory.map((entry) => {
          const line = `${entry.date} · ${entry.courseTitle} · ${entry.score}/${entry.maxScore}`
          return entry.recurringWeakness
            ? `${line} · recurring weakness: ${entry.recurringWeakness}`
            : line
        }),
      ].join('\n'),
    )
  }

  return sections.join('\n\n')
}

interface BriefPromptXpSummary {
  totalXp: number
  level: number
  xpToNextLevel: number
}

interface BriefPromptCourseProgress {
  courseTitle: string
  percentComplete: number
}

interface BriefPromptOverdueItem {
  title: string
  daysOverdue: number
}

interface BriefPromptReviewSummary {
  date: string
  courseTitle: string
  score: number
  maxScore: number
}

export const buildBriefPrompt = ({
  xpSummary,
  courseProgress,
  streakDays,
  overdueItems,
  recentReviews,
}: {
  xpSummary: BriefPromptXpSummary
  courseProgress: BriefPromptCourseProgress[]
  streakDays: number
  overdueItems: BriefPromptOverdueItem[]
  recentReviews: BriefPromptReviewSummary[]
}): string => {
  const sections: string[] = []

  sections.push(
    [
      '## XP summary',
      `Total XP: ${xpSummary.totalXp}`,
      `Level: ${xpSummary.level}`,
      `XP to next level: ${xpSummary.xpToNextLevel}`,
      `Current streak: ${streakDays} day(s)`,
    ].join('\n'),
  )

  if (courseProgress.length > 0) {
    sections.push(
      [
        '## Course progress',
        ...courseProgress.map((c) => `${c.courseTitle}: ${c.percentComplete}% complete`),
      ].join('\n'),
    )
  }

  if (overdueItems.length > 0) {
    sections.push(
      [
        '## Overdue',
        ...overdueItems.map((item) => `${item.title} — ${item.daysOverdue} day(s) overdue`),
      ].join('\n'),
    )
  }

  const recent = recentReviews.slice(-5)
  if (recent.length > 0) {
    sections.push(
      [
        '## Recent reviews',
        ...recent.map((r) => `${r.date} · ${r.courseTitle} · ${r.score}/${r.maxScore}`),
      ].join('\n'),
    )
  }

  sections.push(
    [
      '## What to produce',
      'Write a short, personalised progress brief for this student. Look across everything',
      'above: recurring strengths, recurring weaknesses, which course to pick up next, and',
      'one nudge. Return: a one-sentence headline, a short strengths list, a short focus-areas',
      'list, a few next actions (each with a label and a link path), and one nudge sentence.',
    ].join('\n'),
  )

  return sections.join('\n\n')
}
