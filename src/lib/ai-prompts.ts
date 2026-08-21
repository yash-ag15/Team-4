/**
 * The AI Coach's voice — owned by Riya (`feature/ai-coach-front`).
 *
 * Consumed by `src/server/ai-coach.ts` (Yash), which passes `COACH_SYSTEM_PROMPT` as
 * `system` and the output of `buildReviewPrompt`/`buildBriefPrompt` as the `prompt` in
 * `generateJson()` from `@/lib/ai`. See `plans/katalyst/ai-coach.md` §5.
 *
 * (We are on Google Gemini, not Anthropic — the provider swap happened after this file was
 * first written. Nothing here is provider-specific, which is why it survived unchanged.)
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

/** EXPORTED — `src/server/ai-coach.ts` builds these, so both sides share one definition. */
export interface ReviewPromptHistoryItem {
  date: string
  courseTitle: string
  score: number
  maxScore: number
  /** Optional: which assessment it was. */
  assessmentTitle?: string
  recurringWeakness?: string
  /** Optional: the previous review's summary, trimmed. */
  takeaway?: string
}

export const buildReviewPrompt = ({
  course,
  assessment,
  submission,
  history,
  isPreview = false,
}: {
  course: ReviewPromptCourse
  assessment: ReviewPromptAssessment
  submission: ReviewPromptSubmission
  history: ReviewPromptHistoryItem[]
  /**
   * True when the student is asking "what would I get?" about a DRAFT they have not
   * submitted. It changes the coach's framing to "if you submit this as is…", which is
   * the single best line in the demo — do not drop it.
   */
  isPreview?: boolean
}): string => {
  const sections: string[] = []

  sections.push(
    isPreview
      ? 'This is a DRAFT the student has not submitted yet. They are asking what they would score if they submitted it now. Frame your feedback so they can act on it BEFORE submitting.'
      : 'This is a submitted piece of work. Your review goes to their mentor, who makes the final call on the score and the XP.',
  )

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
          const parts = [
            entry.date,
            entry.courseTitle,
            entry.assessmentTitle,
            `${entry.score}/${entry.maxScore}`,
          ].filter(Boolean)
          let line = parts.join(' · ')
          if (entry.recurringWeakness) line += ` · recurring weakness: ${entry.recurringWeakness}`
          if (entry.takeaway) line += ` · ${entry.takeaway}`
          return line
        }),
        '',
        'If a strength or weakness is recurring, say so explicitly — noticing a pattern across submissions is the most useful thing you can tell them.',
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

// ---------------------------------------------------------------------------
// RIYA: the three exports below were dropped in the rewrite and are imported by
// src/server/ai-coach.ts. Appended at the end of the file so this block does not
// collide with your edits above. The prose is yours to improve — the NAMES are
// call sites in the backend, so ping Yash before renaming any of them.
// ---------------------------------------------------------------------------

/** System prompt for the dashboard brief (`GET /api/ai-coach/brief`). */
export const BRIEF_SYSTEM_PROMPT = `You are the Katalyst AI Coach writing a student's weekly progress brief for their dashboard.

Be short. This is a widget, not an essay — the student reads it in ten seconds on the way
to something else.

Rules:
- Lead with something true and specific about THEIR recent work, not a generic greeting.
- Name recurring patterns across submissions. That is the thing no dashboard can tell them.
- nextActions must be real next steps using the link paths you are given. Never invent a URL.
- The nudge is one sentence and should point at the nearest reachable milestone.
- Encouraging, never saccharine. If they have stalled, say so kindly and give them the
  smallest possible next step.`

// --- GOOD-TO-HAVE: feature 13, mentor authoring copilot. Post-Gate-C only. ---

/** System prompt for `POST /api/ai-coach/draft-course`. */
export const DRAFT_COURSE_SYSTEM_PROMPT = `You design course outlines for the Katalyst mentoring programme.

You are drafting a skeleton a human mentor will edit before it is published. Make it
concrete enough to be worth editing and short enough to be quick to read.

Rules:
- Every lesson needs a real contentBody: a markdown outline of what the lesson actually
  teaches, not a placeholder.
- The assessment rubric must have 3-5 criteria, each with a point value and a sentence
  describing what full marks look like. A vague rubric is useless — the AI Coach grades
  against it later.
- Section xpAward around 50, lesson xpAward around 10, assessment xpAward around 150-200.
- Point values in the rubric must sum to maxScore.`

export interface DraftCoursePromptInput {
  topic: string
  track: 'mandatory' | 'optional'
  difficulty: string
  sectionCount: number
}

export const buildDraftCoursePrompt = ({
  topic,
  track,
  difficulty,
  sectionCount,
}: DraftCoursePromptInput): string =>
  `Draft a course on: ${topic}

Track: ${track} (${track === 'optional' ? 'self-driven, earns 1.5x XP' : 'assigned, has a deadline'})
Difficulty: ${difficulty}
Sections: exactly ${sectionCount}, each with 2-4 lessons.

Finish with one assessment that covers the whole course.`
