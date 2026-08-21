# 05 — AI Coach · prompts + UI tasks (Riya)

You own two things: **what the coach says** (`src/lib/ai-prompts.ts`) and **how it looks**
(`src/components/ai/*`). Both can be built from minute 20 against the contract mock — you
are never blocked on Yash.

## T+0:20 → T+1:00 — the prompts (highest leverage work in the repo)

| # | Task | Est |
|---|---|---|
| 1 | `COACH_SYSTEM_PROMPT` — the voice, the advisor-not-grader framing, the rules from `ai-coach.md` §5 | 20 m |
| 2 | `buildReviewPrompt({ course, assessment, submission, history })` — course → assessment (**rubric verbatim**) → submission → last 5 reviews | 20 m |

**A weak rubric produces a vague review, and a vague review kills the demo.** Before you
write a line of prompt, write four real rubrics for the seeded assessments and give them to
Siddesh for the seed. A rubric line looks like:

```
Evidence (25 pts) — Every claim is supported by a specific number, source or example
from the dataset. Generic assertions score below 10.
```

Not: `Evidence — is there evidence?`

## T+1:00 → T+2:15 — the review UI, against the mock

| # | Component | What it shows | Est |
|---|---|---|---|
| 3 | `ReviewCard` | Container. Header: `gemini-2.5-flash · 6.2s · confidence: high`, and the line **"This is the AI Coach's assessment. Your mentor makes the final call."** | 20 m |
| 4 | `PredictedScore` | The hero. `82 / 100` as a ring, and below it **`≈ 120 XP`** with a `1.5x` chip on optional courses. **This is the pitch-deck screenshot.** | 25 m |
| 5 | `StrengthsWeaknesses` | Two columns, green ✓ and amber ⚠, one sentence each | 15 m |
| 6 | `ActionItems` | A checklist. Ticking is local-only — a nudge, not state. | 10 m |
| 7 | `RubricTable` | criterion / score / comment, collapsible, open by default | 15 m |
| 8 | `CoachBrief` | The dashboard widget: headline, focus areas, next actions as links, nudge | 20 m |

`import type { AiReview } from '@/contracts/ai-coach'` — never redefine the shape.

## T+2:15 → T+3:00 — mentor review (feature 07)

Switch to `../07-mentor-review/`. That is where Gate B is won or lost.

## T+3:00 → T+4:15 — brief on the dashboard + the demo script

| # | Task | Est |
|---|---|---|
| 9 | Mount `CoachBrief` at the top of the student dashboard (coordinate with Methika — she owns the page, you own the component) | 15 m |
| 10 | Nudge copy: due-soon, streak-at-risk, "you haven't touched X in a week" | 15 m |
| 11 | **Write the four-minute demo script** (`plan.md` Part 3, T+5:00) and time it | 30 m |

---

## The trust line — do not cut it

Every surface that shows an AI number also shows who decides:

> *"This is the AI Coach's assessment. Your mentor makes the final call."*

It is one line of copy. It is also the entire answer to the first question a judge will ask
("what if the AI is wrong?"), and it is the reason a real programme could deploy this. Put
it in `ReviewCard`'s header, not buried in a footer.

## Definition of done

- [ ] All six components render from `contract.mock` with no API key
- [ ] `PredictedScore` shows the XP estimate and the 1.5× chip on optional courses
- [ ] The trust line is visible on every AI surface
- [ ] `confidence: 'low'` visibly changes the card (muted, an explanatory note)
- [ ] Long strength/weakness lists do not overflow at 375px
- [ ] Every string the coach can return is renderable — no assumption of exactly 3 items
