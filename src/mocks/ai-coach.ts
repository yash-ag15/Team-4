/**
 * AI Coach fixtures — owned by Yash (`feature/ai-coach-back`).
 *
 * DELIBERATELY SELF-CONTAINED. This file imports nothing from `@/mocks/factories`, so the
 * AI Coach contract compiles and serves realistic data no matter what state the shared
 * fixtures are in. Riya can build the whole review UI against it from minute one, with no
 * database, no ANTHROPIC_API_KEY and no backend.
 *
 * The review below is written to look like a REAL review of a real submission — specific,
 * quoting the student, every weakness paired with an action. If the mock looks generic,
 * the UI built against it will look generic too.
 */
import type { AiReviewPayload, CoachBrief } from '@/contracts/ai-coach'

/**
 * A stand-in for the assessment the coach is grading against. The real handler loads this
 * from the `assessments` table; the mock needs the same four numbers so the predicted-XP
 * arithmetic is exercised in mock mode too.
 */
export const mockAssessmentContext = {
  id: 'assessment-2',
  title: 'Enrolment drop-off analysis',
  courseId: 'course-1',
  courseTitle: 'Data Foundations',
  /** Optional course -> the 1.5x chip shows up in the UI. */
  track: 'optional' as const,
  maxScore: 100,
  xpAward: 150,
  rubric: [
    'Evidence (25 pts) — every claim is supported by a specific number from the dataset',
    'Analysis (35 pts) — the drop-off is explained, not just described',
    'Clarity (20 pts) — a reader who has not seen the data can follow the argument',
    'Recommendation (20 pts) — one concrete intervention that follows from the analysis',
  ].join('\n'),
}

const STRONG_REVIEW: AiReviewPayload = {
  summary:
    'A genuinely good piece of analysis. You found the real drop-off point and backed it ' +
    'with numbers instead of asserting it. Where it slips is the last step — your ' +
    'recommendation is sensible on its own but does not follow from the pattern you just ' +
    'spent three paragraphs establishing.',
  strengths: [
    'You anchored the whole argument in the data: "62% of the drop happens between week 3 and week 4" is exactly the kind of specific claim the rubric rewards.',
    'You separated correlation from cause when discussing the assignment deadline, and said so explicitly rather than hedging.',
    'The write-up is readable end to end — someone who has never seen this dataset could follow your reasoning without stopping.',
  ],
  weaknesses: [
    'Your recommendation (a weekly reminder email) targets week 1, but your own analysis puts the drop-off at week 3-4. The intervention and the finding do not line up.',
    'Two of the three supporting figures have no denominator — "180 students dropped" means very different things out of 200 versus out of 2,000.',
  ],
  actionItems: [
    'Rewrite the recommendation so it acts on the week 3-4 window you identified — e.g. an intervention triggered by a missed week-3 checkpoint.',
    'Add the denominator to every count you cite, or convert them all to percentages and state the base once.',
    'Add one sentence naming what would disprove your explanation. It is the fastest way to lift an Analysis score from good to excellent.',
  ],
  rubricBreakdown: [
    {
      criterion: 'Evidence',
      score: 20,
      maxScore: 25,
      comment: 'Specific and well-chosen, but two figures are missing their denominator.',
    },
    {
      criterion: 'Analysis',
      score: 30,
      maxScore: 35,
      comment: 'You explained the drop-off rather than restating it. Falls short of full marks only because no alternative explanation is considered.',
    },
    {
      criterion: 'Clarity',
      score: 18,
      maxScore: 20,
      comment: 'Clean structure, plain language, no jargon left undefined.',
    },
    {
      criterion: 'Recommendation',
      score: 10,
      maxScore: 20,
      comment: 'Reasonable in isolation, but it does not act on the window your own analysis identified.',
    },
  ],
  suggestedScore: 78,
  confidence: 'high',
}

const THIN_REVIEW: AiReviewPayload = {
  summary:
    'There is a real idea in here, but it is asserted rather than argued. Right now a ' +
    'reader has to take your word for the drop-off, because none of the numbers from the ' +
    'dataset made it into the write-up.',
  strengths: [
    'You correctly identified that the drop-off is concentrated rather than spread evenly across the course — that instinct is right.',
  ],
  weaknesses: [
    'No figures from the dataset appear anywhere. The Evidence criterion is 25 points and is currently unmet.',
    'The analysis describes what happened but never proposes why, which is what the Analysis criterion asks for.',
    'The recommendation is one line and is not tied to anything you observed.',
  ],
  actionItems: [
    'Pick the three numbers that most support your claim and put them in, with denominators.',
    'Add a paragraph answering "why here and not elsewhere?" — that is the Analysis criterion in one question.',
    'Expand the recommendation into three sentences: what to do, when it triggers, and which number you would expect to move.',
  ],
  rubricBreakdown: [
    { criterion: 'Evidence', score: 6, maxScore: 25, comment: 'No specific figures cited.' },
    { criterion: 'Analysis', score: 14, maxScore: 35, comment: 'Describes the pattern; does not explain it.' },
    { criterion: 'Clarity', score: 14, maxScore: 20, comment: 'Readable, but thin enough that there is little to follow.' },
    { criterion: 'Recommendation', score: 6, maxScore: 20, comment: 'Present but not grounded in the analysis.' },
  ],
  suggestedScore: 40,
  confidence: 'medium',
}

const EMPTY_REVIEW: AiReviewPayload = {
  summary:
    'There is not enough here for me to review yet. Write a first attempt — even a rough ' +
    'one — and ask me again. I will tell you exactly where it stands before you submit.',
  strengths: ['You opened the assessment, which is the hard part. Draft something and come back.'],
  weaknesses: ['The submission is too short to judge against any of the four rubric criteria.'],
  actionItems: [
    'Write a paragraph answering the prompt in your own words, then ask the coach again.',
    'Look at the rubric next to the editor — each criterion is a question your answer should answer.',
  ],
  rubricBreakdown: [
    { criterion: 'Evidence', score: 0, maxScore: 25, comment: 'Nothing to assess yet.' },
    { criterion: 'Analysis', score: 0, maxScore: 35, comment: 'Nothing to assess yet.' },
    { criterion: 'Clarity', score: 0, maxScore: 20, comment: 'Nothing to assess yet.' },
    { criterion: 'Recommendation', score: 0, maxScore: 20, comment: 'Nothing to assess yet.' },
  ],
  suggestedScore: 0,
  confidence: 'low',
}

/**
 * Picks a review by how much the student has written.
 *
 * This is the single most useful thing in this file for Riya: it means the "ask the coach,
 * improve the draft, ask again, watch the score move" loop is demoable against MOCK data,
 * before the model call exists. Deterministic — no Math.random, so two identical drafts
 * always score the same.
 */
export const mockReviewFor = (content: string): AiReviewPayload => {
  const length = content.trim().length
  if (length < 50) return EMPTY_REVIEW
  if (length < 400) return THIN_REVIEW
  return STRONG_REVIEW
}

export const mockCoachBrief: CoachBrief = {
  headline: "You've cited sources two submissions running — that habit is sticking.",
  strengths: [
    'Your evidence scores have climbed in each of your last three submissions.',
    'You have checked in eleven days straight. That consistency is doing more for you than any single session.',
  ],
  focusAreas: [
    'Recommendations that do not follow from your own analysis — flagged by your mentor twice now.',
    'Working with data has been sitting at 62% for nine days.',
  ],
  nextActions: [
    { label: 'Finish “Cleaning messy data” — 2 lessons left', href: '/learn/data-foundations' },
    { label: 'Resubmit Enrolment drop-off analysis', href: '/submissions/submission-1' },
    { label: 'Start “Storytelling with numbers” — optional, 1.5x XP', href: '/learn/storytelling-with-numbers' },
  ],
  nudge: 'Two lessons would finish Working with data and put you past 900 XP — Level 4.',
  generatedAt: '2026-08-21T06:30:00.000Z',
}

/** Good-to-have (feature 13). Kept here so the draftCourse contract has a mock too. */
export const mockCourseDraft = {
  title: 'Data Storytelling for Impact',
  subtitle: 'Turn an analysis into a decision someone actually makes',
  description:
    'A short, practical course on communicating quantitative findings to people who will ' +
    'not read your spreadsheet: structuring an argument, choosing the one chart that ' +
    'carries it, and writing a recommendation that survives a room full of questions.',
  coverEmoji: '📊',
  category: 'communication' as const,
  estimatedHours: 6,
  sections: [
    {
      title: 'The audience decides the story',
      summary: 'Who is reading, what decision they are making, and what they already believe.',
      xpAward: 50,
      lessons: [
        { title: 'Who is this for?', kind: 'reading' as const, durationMin: 8, xpAward: 10, contentBody: '## Who is this for?\n\nBefore a single chart...' },
        { title: 'The one-sentence takeaway', kind: 'reading' as const, durationMin: 10, xpAward: 10, contentBody: '## The one-sentence takeaway\n\nIf your reader remembers one thing...' },
      ],
    },
    {
      title: 'One chart, one claim',
      summary: 'Choosing the single visual that carries the argument.',
      xpAward: 50,
      lessons: [
        { title: 'Chart types and what they imply', kind: 'reading' as const, durationMin: 12, xpAward: 10, contentBody: '## Chart types\n\nA bar chart claims comparison...' },
        { title: 'Stripping a chart to its claim', kind: 'reading' as const, durationMin: 10, xpAward: 10, contentBody: '## Stripping a chart\n\nEvery element that is not...' },
      ],
    },
  ],
  assessment: {
    title: 'Rewrite an analysis for a decision-maker',
    kind: 'assignment' as const,
    prompt:
      'Take an analysis you have already written — yours or one provided — and rewrite it ' +
      'in under 400 words for a programme director who has ninety seconds. Include exactly ' +
      'one chart and one recommendation.',
    rubric: [
      'Takeaway (25 pts) — the single claim is stated in the first two sentences',
      'Chart (25 pts) — one chart, and it carries the claim rather than decorating it',
      'Concision (20 pts) — under 400 words with nothing load-bearing removed',
      'Recommendation (30 pts) — a specific action, its trigger, and the number expected to move',
    ].join('\n'),
    maxScore: 100,
    xpAward: 200,
  },
}
