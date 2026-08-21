# The AI Coach — design and implementation

**Owners: Yash (pipeline, `src/server/ai-coach.ts`) · Riya (prompts + rubric,
`src/lib/ai-prompts.ts`, and the review UI in `src/components/ai/`).**

This is the feature the whole project is judged on. Read this file end to end before
writing a line of it.

---

## 1. The claim

> The AI Coach **reads the student's work**, tells them what they did well, what they got
> wrong, what to fix, and **what score and XP to expect**. Then the **mentor decides**.

Two halves, and the second half is what makes the first half safe to ship. An AI that
silently awards XP is a liability. An AI that drafts an assessment for a human to approve
is a productivity multiplier. We build the second one, and we say so on stage.

### The invariant, stated once more

**`src/server/ai-coach.ts` has no import of `xpEvents` and no call to `awardXp()`.**
It writes `ai_reviews` and updates `submissions.status/aiScore/aiXpSuggested`. That is all.
XP for a submission is written in exactly one place: `src/server/mentor.ts` → `decide()`.

If a code review finds an AI code path that awards XP, it is a bug, not a shortcut.

---

## 2. The three endpoints

| Endpoint | Auth | Persists | Why it exists |
|---|---|---|---|
| `POST /api/ai-coach/preview` | student | **no** | The retention hook. A student pastes a draft and asks *"what would I get?"* before submitting. They iterate. Engagement goes up, and so does the quality of what the mentor eventually reads. |
| `POST /api/ai-coach/review` | student | yes | Runs automatically when a submission is created. Writes `ai_reviews`, moves the submission to `ai_reviewed`, puts it in the mentor's queue with the AI's homework already done. |
| `GET /api/ai-coach/brief` | student | cached | The personalised progress update. Looks across all the student's work: recurring strengths, recurring weaknesses, which course to pick up next, one nudge. Renders at the top of the dashboard. |

`preview` and `review` share one function with a `persist` flag. Do not write them twice.

---

## 3. The output schema — defined once, used three times

The zod object lives in `src/contracts/ai-coach.ts` and is used for (a) the contract's
`output`, (b) the mock, and (c) the `responseJsonSchema` sent to the model. One definition
means the model literally cannot return a shape the frontend does not expect.

```ts
export const RubricLine = z.object({
  criterion: z.string(),
  score: z.number().int(),
  maxScore: z.number().int(),
  comment: z.string(),
})

// What the MODEL returns. Note: no suggestedXp, no ids, no timestamps.
export const AiReviewPayload = z.object({
  summary: z.string(),                    // 2-3 sentences, addressed to the student
  strengths: z.array(z.string()).min(1),  // specific, quoting their work
  weaknesses: z.array(z.string()).min(1),
  actionItems: z.array(z.string()).min(1),// concrete next steps
  rubricBreakdown: z.array(RubricLine),
  suggestedScore: z.number().int(),       // out of assessment.maxScore
  confidence: z.enum(['low', 'medium', 'high']),
})

// What the API returns: the payload plus the computed XP and the card metadata.
export const AiReview = AiReviewPayload.extend({ /* suggestedXp, maxScore, track, model, ... */ })
```

**`suggestedXp` is computed in code, not by the model** — that is why it is absent from
`AiReviewPayload`:

```ts
// src/lib/xp.ts
export const suggestedXpFromScore = (score, maxScore, xpAward, track) =>
  maxScore <= 0 ? 0 : applyTrack(xpAward * (score / maxScore), track)
```

Letting the model pick the XP number invites it to be inconsistent with the score it just
gave. Let it grade; let arithmetic do the rest. The model still *sees* `xpAward` in the
prompt so its narrative ("this looks like about 120 XP") matches.

---

## 4. The model call

**Provider: Google Gemini, free tier.** Get a key at <https://aistudio.google.com/apikey>.
We are not on Anthropic — its API is pay-as-you-go with no free tier and we had no credits.

**Nothing outside `src/lib/ai.ts` imports an LLM SDK.** That is what made the provider
switch a one-file change with zero edits to any contract.

```ts
// src/lib/ai.ts — the only place @google/genai is imported
import { GoogleGenAI } from '@google/genai'

export const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
export const aiEnabled = () => Boolean(process.env.GEMINI_API_KEY)

// LAZY — an eager module-scope client reads process.env before loadEnvConfig() runs in
// scripts, captures an empty key, and then fails while aiEnabled() still returns true.
export const getAI = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }))

export async function generateJson<T extends z.ZodTypeAny>(opts: {
  system: string; prompt: string; schema: T
}): Promise<{ data: z.infer<T>; model: string; latencyMs: number; tokensIn: number; tokensOut: number }>
```

Callers are provider-agnostic:

```ts
// src/server/ai-coach.ts
const res = await generateJson({
  system: COACH_SYSTEM_PROMPT,
  prompt: buildReviewPrompt({ course, assessment, content, history, isPreview }),
  schema: AiReviewPayload,   // the SAME zod object the contract exports
})
const payload = res.data     // already validated — generateJson never returns raw output
```

Internally `generateJson` sets `responseMimeType: 'application/json'` and
`responseJsonSchema: z.toJSONSchema(schema)` (sanitised — `$schema` and zod's ±2^53 integer
bounds are stripped, because a bloated schema measurably degrades adherence), then
`JSON.parse` + `schema.safeParse`.

### Rules that will otherwise cost an hour

- **`export const maxDuration = 60`** on every `api/ai-coach/*` route file. The default
  Vercel Function timeout will kill a slow review.
- **Structured output is not a guarantee.** It reduces malformed responses; it does not
  eliminate them. The `safeParse` inside `generateJson` is the actual contract enforcement.
  Never hand a caller unvalidated model output.
- **Safety filters and truncation arrive as a `finishReason`, not an exception.** Check
  `candidates[0].finishReason !== 'STOP'` before reading the text. `MAX_TOKENS` means the
  JSON was cut off mid-object and will not parse.
- **The free tier is rate-limited per minute AND per day.** A 429 must degrade to "the
  coach is busy", never a 500 — by then the submission is already saved.
- Record `latencyMs`, `tokensIn`, `tokensOut` on the `ai_reviews` row. Showing
  "reviewed by gemini-2.5-flash in 6.2 s" on the card is a free credibility point.
- `GEMINI_MODEL` overrides the model without a code change.
  `npm run ai:smoke -- --list` shows what your key can actually reach.

### The no-key fallback — this is what keeps six people unblocked

```ts
if (!aiEnabled()) {
  console.warn('[ai-coach] GEMINI_API_KEY missing — serving the contract mock')
  return contract.mock(input)
}
```

Riya builds the entire review UI against this before any key exists. The frontend never
knows the difference; `source` on the envelope and `model` on the card tell the truth.

---

## 5. The prompts — Riya owns these

`src/lib/ai-prompts.ts`. Three exports: `COACH_SYSTEM_PROMPT`, `buildReviewPrompt`,
`buildBriefPrompt`.

### System prompt — the shape that matters

```
You are the Katalyst AI Coach. You review student submissions for a mentoring
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
  score it accordingly, and set confidence to "low".
```

### Review prompt — everything the model needs and nothing else

```
buildReviewPrompt({ course, assessment, submission, history })
```

Includes, in this order:
1. **Course** — title, category, difficulty, `track` (and, if optional, "this is a
   self-driven course; students choose it, so hold the bar").
2. **Assessment** — `title`, `kind`, `prompt`, `maxScore`, `xpAward`, and the **`rubric`
   verbatim**. The rubric is the single biggest quality lever in the whole feature.
3. **The submission** — `content`, plus `attachmentUrl` if present.
4. **History** — a compact line per previous review for this student:
   `"2026-08-14 · Data Foundations · 74/100 · recurring weakness: no evidence for claims"`.
   Cap it at the last 5. This is what makes the coach say *"you have now cited sources in
   two submissions running — that habit is sticking"*, which is the moment judges notice.

If the review is timing out, **history is the first thing to drop**, not the rubric.

### Brief prompt

Takes the student's XP summary, per-course progress, streak, overdue items and their last
5 review summaries. Returns a short structured brief: `headline`, `strengths[]`,
`focusAreas[]`, `nextActions[]` (each with a `href`), `nudge`. Cache it per user for an
hour — a dashboard that costs an API call on every render will run us out of budget and
patience.

---

## 6. Cost and latency budget

| | Target |
|---|---|
| Review latency | 10-25 s (`effort: 'medium'`) |
| Preview latency | same — show a real progress state, not a spinner with no copy |
| Brief latency | cached; ≤1 live call per user per hour |
| Reviews during the build | ~60 |
| Reviews during the demo | ~10 |

Guard rails Yash adds in Wave 3: a per-user rate limit (5 previews / 10 minutes) and a
`content.length` cap of ~8000 characters with a friendly `VALIDATION_ERROR` above it.

---

## 7. The failure ladder — no AI failure may 500 the page

| Failure | What the user sees |
|---|---|
| No API key | The mock review, `source: 'mock'`, MockBadge visible |
| `RateLimitError` | "The coach is busy — try again in a minute." Submission still saved. |
| Timeout / `APIConnectionError` | Same message. **The submission is saved first, reviewed second** — never lose a student's work because the coach was slow. |
| `finishReason !== 'STOP'` (safety block) | "The coach could not review this submission." Goes to the mentor queue **without** an AI review; the mentor grades manually. |
| response is not valid JSON, or fails `safeParse` | Same as a block. The raw text is logged. |

**Ordering rule:** `submissions` row is inserted and committed **before** the model call.
The review is an enrichment, not a precondition. Ayush owns that ordering in
`src/server/submissions.ts`.

---

## 8. What the student actually sees (Riya's components)

`src/components/ai/`:

- **`ReviewCard`** — the container. Header: model name, latency, `confidence` chip, and a
  clear line: *"This is the AI Coach's assessment. Your mentor makes the final call."*
- **`PredictedScore`** — the big number. `suggestedScore` / `maxScore` as a ring, and below
  it **`≈ 120 XP`** with the `1.5x` chip if the course is optional. This is the screenshot
  that ends up in the pitch deck.
- **`StrengthsWeaknesses`** — two columns, green and amber. Each item is one sentence.
- **`ActionItems`** — a checklist. Ticking one is local-only; it is a nudge, not state.
- **`RubricTable`** — criterion / score / comment. Collapsible, open by default.
- **`CoachBrief`** — the dashboard widget for `GET /api/ai-coach/brief`.

Every one of these is built against `contract.mock` in Wave 1, before the pipeline exists.

---

## 9. Build order for this feature

| When | Yash | Riya |
|---|---|---|
| T+0:20 | contract + mock already landed | read `assessments.rubric`, write the system prompt |
| T+0:20-1:30 | `lib/ai.ts`, one real `generateJson()` returning a valid payload — **prove the call works before building around it** | `buildReviewPrompt`, then `ReviewCard` + `PredictedScore` against the mock |
| T+1:30-2:15 | `review()` with persist, `preview()` without | `StrengthsWeaknesses`, `RubricTable`, `ActionItems` |
| T+2:15-3:00 | `brief()` + cache; wire `review()` into `submissions.create()` with Ayush | `src/server/mentor.ts` → queue + `decide()`; `/mentor/review` page |
| **Gate B — T+3:00** | **the full round-trip runs on the deployed URL** | |
| T+3:00-4:15 | rate limit, caps, failure ladder | `CoachBrief` on the dashboard, nudge copy, demo script |

**The single most important checkpoint in the whole six hours is Yash getting one real
`generateJson()` call to return a schema-valid `AiReviewPayload` before T+1:30.** Everything
downstream is plumbing. If the key is missing or the SDK call is wrong, we need to know at
minute 90, not at minute 200.
