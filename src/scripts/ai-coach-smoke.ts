/**
 * AI Coach smoke test — the T+1:30 checkpoint from features/05-ai-coach/backend.md.
 *
 *   npm run ai:smoke            run the two-draft review test
 *   npm run ai:smoke -- --list  list the models this key can actually reach
 *
 * Proves ONE thing, which is the thing everything else depends on:
 *   a real model call returns a schema-valid AiReviewPayload.
 *
 * Deliberately touches NO database — it imports only `@/lib/ai`, `@/lib/ai-prompts` and
 * `@/contracts/ai-coach`, none of which import `@/db`. So it runs before Neon is
 * provisioned and before Siddesh has migrated anything.
 *
 * It never prints the API key, or any part of it.
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

import { AiReviewPayload } from '@/contracts/ai-coach'
import { mockAssessmentContext } from '@/mocks/ai-coach'
import { AI_TEMPERATURE, aiEnabled, generateJson, getModel, listModels } from '@/lib/ai'
import { COACH_SYSTEM_PROMPT, buildReviewPrompt } from '@/lib/ai-prompts'
import { applyTrack, suggestedXpFromScore } from '@/lib/xp'

const A = mockAssessmentContext

const COURSE = {
  title: A.courseTitle,
  category: 'technical',
  difficulty: 'beginner',
  track: A.track,
}

const ASSESSMENT = {
  title: A.title,
  kind: 'assignment',
  prompt:
    'Using the enrolment dataset, identify where students are dropping out of the ' +
    'programme and recommend one intervention.',
  rubric: A.rubric,
  maxScore: A.maxScore,
  xpAward: A.xpAward,
}

/** A deliberately WEAK draft — no figures, no explanation, one-line recommendation. */
const WEAK_DRAFT = `Students seem to drop out somewhere in the middle of the course. It is
probably because it gets harder. I think we should send them reminder emails to keep them
engaged and motivated throughout the programme.`

/** A deliberately STRONG draft — specific figures, an explanation, a real recommendation. */
const STRONG_DRAFT = `Looking at the enrolment data across the 2025 cohort (n = 412), the
drop-off is not evenly distributed. Weekly active rates hold above 80% through weeks 1 and
2, then fall to 61% in week 3 and 38% by week 4. That single week-3-to-week-4 transition
accounts for 62% of all disengagement in the dataset.

Week 4 is the first week with a graded assessment. Two things point at the assessment
rather than difficulty in general: lesson-completion rates inside week 4 stay high (74% of
students who open week 4 finish its lessons), but only 31% of those students start the
assessment. If content difficulty were the cause, I would expect lesson completion to fall
first. It does not.

I should be careful here: this is correlational. A confounder I cannot rule out with this
dataset is that week 4 falls during the mid-term exam period for most campuses.

Recommendation: trigger a mentor check-in automatically when a student completes week 3's
lessons but has not opened the week-4 assessment within 72 hours. That targets the exact
412-student transition where 62% of the loss happens, it fires before the student
disengages rather than after, and success is measurable as the week-3-to-week-4 active-rate
gap narrowing from 23 points.`

async function runOne(label: string, content: string) {
  console.log(`\n${'─'.repeat(72)}\n▶ ${label} (${content.trim().length} chars)\n${'─'.repeat(72)}`)

  // Exactly the call src/server/ai-coach.ts makes. If this passes, the pipeline works.
  const res = await generateJson({
    system: COACH_SYSTEM_PROMPT,
    prompt: buildReviewPrompt({
      course: COURSE,
      assessment: ASSESSMENT,
      submission: { content },
      history: [],
      isPreview: true,
    }),
    schema: AiReviewPayload,
  })

  const payload = res.data

  // Mirrors src/server/ai-coach.ts -> xpCeiling()/xpFor(). The optional-track multiplier
  // has to move the CEILING too, not just the suggestion — otherwise a perfect score on
  // an optional course suggests more XP than mentor.decide() is allowed to award, and the
  // mentor accepts one number while the student receives another.
  const ceiling = applyTrack(ASSESSMENT.xpAward, COURSE.track)
  const xp = Math.min(
    suggestedXpFromScore(payload.suggestedScore, ASSESSMENT.maxScore, ASSESSMENT.xpAward, COURSE.track),
    ceiling,
  )
  const rubricSum = payload.rubricBreakdown.reduce((n, r) => n + r.score, 0)

  console.log(
    `✓ schema-valid · ${(res.latencyMs / 1000).toFixed(1)}s · ${res.tokensIn} in / ${res.tokensOut} out`,
  )
  console.log(`  score      ${payload.suggestedScore}/${ASSESSMENT.maxScore}   confidence: ${payload.confidence}`)
  console.log(
    `  XP         ≈${xp} / ${ceiling} ceiling${COURSE.track === 'optional' ? ` (authored ${ASSESSMENT.xpAward} x1.5 optional)` : ''} ${xp <= ceiling ? '✓ within ceiling' : '✗ EXCEEDS CEILING — mentor.decide() would silently reduce it'}`,
  )
  console.log(
    `  content    ${payload.strengths.length} strengths · ${payload.weaknesses.length} weaknesses · ${payload.actionItems.length} actions · ${payload.rubricBreakdown.length} rubric lines`,
  )
  console.log(
    `  rubric sum ${rubricSum} vs suggestedScore ${payload.suggestedScore} ${
      rubricSum === payload.suggestedScore ? '✓ consistent' : '⚠ INCONSISTENT — tighten the system prompt'
    }`,
  )
  console.log(`\n  summary:   ${payload.summary}`)
  console.log(`  strength:  ${payload.strengths[0]}`)
  console.log(`  weakness:  ${payload.weaknesses[0]}`)
  console.log(`  action:    ${payload.actionItems[0]}`)

  return payload.suggestedScore
}

async function main() {
  if (!aiEnabled()) {
    console.error(
      '\n✗ GEMINI_API_KEY is not set.\n' +
        '  Get a free key at https://aistudio.google.com/apikey\n' +
        '  Then add it to .env.local (gitignored):  GEMINI_API_KEY=...\n' +
        '\n' +
        '  Without it every /api/ai-coach/* endpoint serves the contract mock, which is\n' +
        '  fine for Riya but does not prove the model call works.\n',
    )
    process.exit(1)
  }

  if (process.argv.includes('--list')) {
    console.log('\nModels reachable with this key:\n')
    const models = await listModels()
    for (const name of models.filter((n) => n.includes('gemini'))) console.log('  ' + name)
    console.log(`\ncurrent GEMINI_MODEL: ${getModel()}`)
    console.log('override in .env.local with GEMINI_MODEL=<name>\n')
    return
  }

  console.log(`\nAI Coach smoke test`)
  console.log(`model ${getModel()} · temperature ${AI_TEMPERATURE} · key present (value not shown)`)
  console.log(
    `assessment "${ASSESSMENT.title}" · ${ASSESSMENT.maxScore} pts · ${ASSESSMENT.xpAward} XP · ${COURSE.track} track`,
  )

  const weak = await runOne('WEAK draft', WEAK_DRAFT)
  const strong = await runOne('STRONG draft', STRONG_DRAFT)

  // The product claim: a student improves the draft and the predicted score moves.
  // If it does not, the preview loop has nothing to show and the demo is flat.
  console.log(`\n${'═'.repeat(72)}`)
  console.log(`weak ${weak}/${ASSESSMENT.maxScore}  ->  strong ${strong}/${ASSESSMENT.maxScore}   (delta ${strong - weak})`)
  if (strong > weak) {
    console.log('✓ the coach discriminates — the preview loop will visibly reward improvement')
  } else {
    console.warn('⚠ the strong draft did NOT score higher. The rubric or the system prompt')
    console.warn('  needs work — tell Riya. This is the loop the demo is built on.')
  }
  console.log(`${'═'.repeat(72)}\n`)
}

main().catch((error) => {
  // Turn the failures we actually hit into one actionable line each, instead of forty
  // lines of stack trace.
  const message = String(error?.message ?? error)

  if (/rate|RESOURCE_EXHAUSTED|quota/i.test(message)) {
    console.error(
      '\n✗ RATE LIMITED or QUOTA EXHAUSTED.\n' +
        '  The free tier limits requests per minute AND per day.\n' +
        '  Per-minute: wait 60s and re-run. Per-day: wait for the reset, or try a\n' +
        '  cheaper model — npm run ai:smoke -- --list to see what your key can reach,\n' +
        '  then set GEMINI_MODEL=<name> in .env.local.\n' +
        '\n' +
        '  NOT BLOCKING THE TEAM: leave GEMINI_API_KEY unset and every /api/ai-coach/*\n' +
        '  endpoint serves the contract mock. The review UI, the mentor queue and the\n' +
        '  whole submit -> review -> award loop still demo end to end.\n',
    )
  } else if (/API key not valid|API_KEY_INVALID|401|403/i.test(message)) {
    console.error(
      '\n✗ The API key was rejected.\n' +
        '  Check .env.local for a stray character — a doubled "=" or a quote will do it.\n' +
        '  Get a fresh free key at https://aistudio.google.com/apikey\n',
    )
  } else if (/not found|NOT_FOUND|is not supported/i.test(message)) {
    console.error(
      `\n✗ The model "${getModel()}" is not available to this key.\n` +
        '  Run: npm run ai:smoke -- --list\n' +
        '  Then set GEMINI_MODEL=<one of those> in .env.local\n',
    )
  } else if (/wrong shape|malformed JSON|unreadable/i.test(message)) {
    console.error(
      '\n✗ The model responded, but not in the contract shape.\n' +
        '  The call works — this is a prompt/schema problem, which is Riya\'s lane.\n' +
        '  The logged zod issues above say exactly which field was wrong.\n',
    )
  } else {
    console.error('\n✗ smoke test threw:', error)
  }
  process.exit(1)
})
