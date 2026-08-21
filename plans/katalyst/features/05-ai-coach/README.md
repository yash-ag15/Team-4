# 05 — AI Coach ⭐ THE USP

**Priority:** MUST — this is the project · **Gate:** B (T+3:00)
**Backend:** Yash · **Frontend + prompts:** Riya
**Contract:** `src/contracts/ai-coach.ts` · **Server:** `src/server/ai-coach.ts` ·
**Prompts:** `src/lib/ai-prompts.ts` · **Routes:** `src/app/api/ai-coach/*`

> **The full design lives in [`../../ai-coach.md`](../../ai-coach.md). Read it before
> anything else.** This folder is the task list.

---

## The one-line spec

The AI Coach reads a student's work, names their **strengths** and **weaknesses**, gives
**action items**, and predicts **the score and the XP**. Then the **mentor decides**.

## The invariant

**`src/server/ai-coach.ts` never imports `xpEvents` and never calls `awardXp()`.**
It writes `ai_reviews` and updates `submissions.status / aiScore / aiXpSuggested`. XP for a
submission is written in exactly one place: `src/server/mentor.ts` → `decide()`.

---

## The contract

```ts
export const RubricLine = z.object({
  criterion: z.string(), score: z.number().int(),
  maxScore: z.number().int(), comment: z.string(),
})

// This exact object is passed to zodOutputFormat() in the model call.
// One definition -> the model cannot return a shape the UI does not expect.
export const AiReviewPayload = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  actionItems: z.array(z.string()).min(1),
  rubricBreakdown: z.array(RubricLine),
  suggestedScore: z.number().int(),
  suggestedXp: z.number().int(),
  confidence: z.enum(['low', 'medium', 'high']),
})

export const AiReview = AiReviewPayload.extend({
  id: z.string(), submissionId: z.string().nullable(),
  model: z.string(), maxScore: z.number().int(),
  isPreview: z.boolean(), latencyMs: z.number().int(), createdAt: z.string(),
})
```

| Op | Method | Path | Auth | Persists | Notes |
|---|---|---|---|---|---|
| `preview` | POST | `/api/ai-coach/preview` | user | no | `{ assessmentId, content }` — the draft loop |
| `review` | POST | `/api/ai-coach/review` | user | yes | `{ submissionId }` — called by `submissions.create` |
| `brief` | GET | `/api/ai-coach/brief` | user | cached 1 h | the dashboard's personalised update |

```ts
export const CoachBrief = z.object({
  headline: z.string(),
  strengths: z.array(z.string()),
  focusAreas: z.array(z.string()),
  nextActions: z.array(z.object({ label: z.string(), href: z.string() })),
  nudge: z.string(),
  generatedAt: z.string(),
})
```

---

## `suggestedXp` is arithmetic, not a model output

The model grades; code converts the grade to XP. Letting the model pick both invites them
to disagree.

```ts
const suggestedXp = Math.round(
  assessment.xpAward * (payload.suggestedScore / assessment.maxScore) * trackMultiplier,
)
```

The model still *sees* `xpAward` in the prompt so its prose matches the number.

---

## Definition of done

- [ ] One real `messages.parse` call returns a schema-valid `AiReviewPayload` — **by T+1:30**
- [ ] `preview` returns a review for a pasted draft in under 25 s
- [ ] `review` persists `ai_reviews`, sets `submissions.status = 'ai_reviewed'` and the two
      denormalised columns
- [ ] `brief` renders on the dashboard and is cached per user per hour
- [ ] With no `ANTHROPIC_API_KEY` every endpoint returns the mock, `source: 'mock'`, no throw
- [ ] `stop_reason === 'refusal'` and `parsed_output === null` are both handled
- [ ] `export const maxDuration = 60` on all three route files
- [ ] `grep -rn "awardXp\|xpEvents" src/server/ai-coach.ts` returns **nothing**
