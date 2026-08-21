# 05 — AI Coach · backend tasks (Yash)

**Protect this time.** Yash also owns the XP engine (feature 06), which must land by T+0:50
because Ayush and Makarand are blocked on it. Order: XP engine first, then this, all day.

## T+0:00 → T+0:20 — foundation commit

| # | Task | Est |
|---|---|---|
| 1 | Delete the starter's placeholder domain (contracts, schema, routes, `dashboard/projects-list.tsx`) | 5 m |
| 2 | Land all 11 contracts + `src/mocks/factories.ts` + every route stub + `src/lib/xp.ts` | 5 m |
| 3 | `npm run typecheck`, push `main`, announce | 3 m |

## T+0:20 → T+0:50 — XP engine (feature 06)

Land `awardXp()`, `xpSummary()`, `ledger()`. **Push and tell Ayush and Makarand.** They are
stubbing against it.

## T+0:50 → T+1:30 — prove the model call works

| # | Task | Files | Est |
|---|---|---|---|
| 4 | `npm i @google/genai`; `src/lib/ai.ts` with `getAI()` (LAZY), `AI_MODEL`, `aiEnabled()`, `generateJson()` | `src/lib/ai.ts` | 5 m |
| 5 | **One real `generateJson({ schema: AiReviewPayload })` call returning a valid object.** Use `npm run ai:smoke` — it is already written and hits no database. | scratch | 25 m |
| 6 | If it fails: `npm run ai:smoke -- --list` to check the model name, check .env.local for a stray `=`, check the free-tier quota. Do not proceed until it works. | — | — |

**This is the single most important 40 minutes in the six hours.** Everything downstream is
plumbing. Find out at minute 90 that the key is wrong, not at minute 200.

## T+1:30 → T+2:15 — `review()` and `preview()`

| # | Task | Est |
|---|---|---|
| 7 | `loadReviewContext(submissionId \| { assessmentId, userId })` — assessment, course, submission, last 5 review summaries | 20 m |
| 8 | `runReview(ctx, { persist })` — the model call, the `suggestedXp` arithmetic, latency + token capture | 25 m |
| 9 | `persist: true` path — insert `ai_reviews`, update `submissions.status/aiScore/aiXpSuggested` in one transaction | 15 m |
| 10 | `preview()` = `runReview(ctx, { persist: false })`, `isPreview: true` | 5 m |
| 11 | Wire into `api/ai-coach/preview` and `api/ai-coach/review`, `maxDuration = 60` on both | 5 m |
| 12 | Hand `review()` to Ayush for `submissions.create` | 5 m |

## T+2:15 → T+3:00 — `brief()`

| # | Task | Est |
|---|---|---|
| 13 | `buildBriefContext(userId)` — XP summary, per-course progress, streak, overdue, last 5 review summaries | 20 m |
| 14 | `brief()` with `generateJson({ schema: CoachBrief })` | 15 m |
| 15 | Cache: a module-level `Map<userId, { at, brief }>` with a 1-hour TTL. **Vercel Functions are stateless — a cold start loses it, and that is fine.** Do not build a cache table. | 10 m |

## T+3:00 → T+4:15 — harden

| # | Task | Est |
|---|---|---|
| 16 | The failure ladder from `ai-coach.md` §7 — every branch returns a friendly message, never a 500 | 20 m |
| 17 | Rate limit: 5 previews per user per 10 minutes, in-memory, `RATE_LIMITED` | 15 m |
| 18 | `content` cap at 8,000 chars with a `VALIDATION_ERROR` | 5 m |
| 19 | Log `model`, `latencyMs`, `tokensIn`, `tokensOut` on every review row | 5 m |

---

## The call, verbatim

```ts
import { generateJson } from '@/lib/ai'
import { AiReviewPayload } from '@/contracts/ai-coach'

const res = await generateJson({
  system: COACH_SYSTEM_PROMPT,
  prompt: buildReviewPrompt(ctx),
  schema: AiReviewPayload,   // the SAME zod object the contract exports
})

// res.data is ALREADY validated against AiReviewPayload — generateJson throws AiError
// rather than ever returning unvalidated model output.
const payload = res.data
```

Provider specifics (Gemini, , , 429 handling) all live
inside . Do NOT import  here — that is the boundary that let
us swap provider in one file with zero contract changes.

If reviews are timing out, in this order: drop  from the prompt → lower
 → try a faster . Do **not** drop the rubric.