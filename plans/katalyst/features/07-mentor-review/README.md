# 07 — Mentor review & final XP award

**Priority:** MUST — the second half of the USP · **Gate:** B (T+3:00)
**Backend:** Riya · **Frontend:** Riya
**Contract:** `src/contracts/mentor.ts` · **Server:** `src/server/mentor.ts` ·
**Routes:** `src/app/api/mentor/*` · **Pages:** `src/app/(mentor)/review/*`

---

## What it does

The mentor opens a queue of submissions, each one **already reviewed by the AI**, and makes
the call. One click to accept the AI's suggestion, or override the score, the XP and the
note.

**This is the only place in the entire codebase where an assessment's XP is written.**

```ts
// src/server/mentor.ts — decide()
await awardXp({
  userId: submission.studentId,
  amount: clamp(input.finalXp, 0, assessment.xpAward),
  reason: 'assessment_award',
  sourceType: 'submission',
  sourceId: submission.id,
  courseId: assessment.courseId,
  awardedBy: mentor.id,
  note: `${assessment.title} — ${input.finalScore}/${assessment.maxScore}`,
  idempotencyKey: `submission:${submission.id}`,
})
```

The idempotency key means a mentor who clicks "Approve" twice awards once. Changing a
decision later does **not** create a second award — it is the same key. If we need
re-scoring after approval, that is a `manual_adjust` event for the difference, not a second
`assessment_award`. Out of scope for six hours.

---

## The contract

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `queue` | GET | `/api/mentor/queue` | user (mentor+) | `?status=&courseId=&limit=` — **only submissions on courses this mentor owns**; admins see all |
| `get` | GET | `/api/mentor/submissions/:id` | user (mentor+) | full submission + AI review + student context |
| `decide` | POST | `/api/mentor/submissions/:id/decide` | user (mentor+) | the final call |
| `students` | GET | `/api/mentor/students` | user (mentor+) | roster (feature 11) |

```ts
export const decideInput = z.object({
  id: z.string(),
  decision: z.enum(['approve', 'request_changes']),
  finalScore: z.number().int().min(0),
  finalXp: z.number().int().min(0),
  note: z.string().max(2000).default(''),
})
```

`approve` → `status: 'mentor_approved'`, writes the `xp_event`.
`request_changes` → `status: 'changes_requested'`, **writes no XP**, and the student can
edit and resubmit.

### Authorisation

`defineRoute`'s `auth: 'admin'` means `systemRole === 'admin'` only, so these contracts use
`auth: 'user'` and the mentor check lives in `src/server/mentor.ts`:

```ts
function assertMentor(user: SessionUser) {
  if (user.systemRole === 'student') throw new ApiError('FORBIDDEN', 'Mentors only')
}
// and, per submission:
if (user.systemRole !== 'admin' && assessment.course.mentorId !== user.id)
  throw new ApiError('FORBIDDEN', 'Not your course')
```

Do not modify `src/server/route.ts` to add a `mentor` auth level — that file is frozen and
seven people depend on it.

---

## The review screen

Two panes, side by side on desktop, stacked on mobile:

```
┌─────────────────────────────┬──────────────────────────────┐
│ THE STUDENT'S WORK          │ THE AI COACH SAYS            │
│                             │                              │
│ Priya Nair · Data Found.    │  ┌────┐                      │
│ Assessment 2 · submitted 2h │  │ 82 │  ≈ 120 XP            │
│                             │  └────┘  confidence: high    │
│ [ their answer, scrollable ]│                              │
│                             │ ✓ Strengths (3)              │
│ Rubric:                     │ ⚠ Weaknesses (2)             │
│  • Evidence (25)            │ → Action items (3)           │
│  • Analysis (35)            │ ▸ Rubric breakdown            │
│  • Clarity (20)             │                              │
│  • Recommendation (20)      │ ─────────────────────────────│
│                             │ [ ✓ Accept AI suggestion ]   │
│                             │   or override:               │
│                             │   Score [82] XP [120]        │
│                             │   Note [___________]         │
│                             │ [ Approve ] [ Request changes]│
└─────────────────────────────┴──────────────────────────────┘
```

**"Accept AI suggestion" is one click** and prefills `finalScore = suggestedScore`,
`finalXp = suggestedXp`. That single button is the demo's punchline: the mentor's job went
from twenty minutes of reading to five seconds of judgement, and they still hold the
authority.

The XP input must be visibly capped at `assessment.xpAward` — show `/ 150 max` next to it.

---

## Definition of done

- [ ] A mentor sees only their own courses' submissions; an admin sees all
- [ ] A student hitting `/api/mentor/queue` gets `FORBIDDEN`
- [ ] The AI review renders next to the student's work
- [ ] "Accept AI suggestion" prefills both fields in one click
- [ ] Approving writes exactly one `xp_event` with key `submission:<id>`
- [ ] **Approving twice writes one event**
- [ ] `finalXp` above `assessment.xpAward` is clamped server-side, not just in the UI
- [ ] "Request changes" writes no XP and lets the student resubmit
- [ ] The student sees the mentor's decision and note on their submission page
- [ ] A submission with **no** AI review (coach failed) is still gradable manually
