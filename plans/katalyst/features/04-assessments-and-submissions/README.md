# 04 — Assessments & submissions

**Priority:** MUST · **Gate:** B · **Backend:** Ayush · **Frontend:** Samya
**Contract:** `src/contracts/submissions.ts` (assessments read-ops live in
`src/contracts/courses.ts` alongside sections and lessons)
**Server:** `src/server/submissions.ts` · **Routes:** `src/app/api/submissions/*`

---

## What it does

An **assessment** sits between sections (or at the end of a course). A student writes an
answer and submits. Submitting triggers the **AI Coach** (feature 05), which attaches a
review. The submission then waits in the **mentor's queue** (feature 07) for the final XP
decision.

This feature is the pipe. It owns the `submissions` row and its status ladder, and nothing
else.

```
draft ──submit──> submitted ──AI Coach──> ai_reviewed ──mentor──> mentor_approved
                                                             └──> changes_requested ──> (resubmit)
```

Only the `mentor_approved` transition writes an `xp_event`, and that write lives in
feature 07, not here.

---

## The ordering rule that must not be broken

**Insert and commit the `submissions` row before calling the AI Coach.**

```ts
const submission = await db.insert(submissions).values({ ...input, status: 'submitted' }).returning()

try {
  await aiCoach.review({ submissionId: submission.id })   // may take 25 s, may fail
} catch (e) {
  console.error('[submissions] AI review failed, submission is safe', e)
  // status stays 'submitted'; the mentor grades it manually
}

return { submission }
```

A student's work is never lost because the coach was slow, rate-limited or refused. A
submission with no AI review still reaches the mentor — it just arrives without the
homework done.

---

## The contract

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `create` | POST | `/api/submissions` | user | `{ assessmentId, content, attachmentUrl? }` → runs the AI review inline |
| `mine` | GET | `/api/submissions` | user | `?status=&courseId=&limit=` |
| `get` | GET | `/api/submissions/:id` | user | own only (mentors use `mentor.queue` / `mentor.get`) |
| `update` | PATCH | `/api/submissions/:id` | user | only while `draft` or `changes_requested` |

`assessments.listByCourse` and `assessments.get` are ops on `src/contracts/courses.ts`
(Siddesh), because an assessment is part of the course structure. Ayush consumes them.

```ts
export const Submission = z.object({
  id, assessmentId, studentId, enrollmentId,
  assessmentTitle: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  studentName: z.string(),
  content: z.string(),
  attachmentUrl: z.string(),
  status: SubmissionStatus,
  maxScore: z.number().int(),
  xpAward: z.number().int(),          // the ceiling on finalXp
  aiScore: z.number().int().nullable(),
  aiXpSuggested: z.number().int().nullable(),
  finalScore: z.number().int().nullable(),
  finalXp: z.number().int().nullable(),
  mentorName: z.string().nullable(),
  mentorNote: z.string(),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
  review: AiReview.nullable(),        // the full review, from feature 05
})
```

The denormalised `aiScore` / `aiXpSuggested` exist so the mentor's queue list renders
without joining `ai_reviews` for every row. The nested `review` is only populated on `get`.

---

## Definition of done

- [ ] A student can submit against an assessment and sees the AI review appear
- [ ] `content` over 8,000 characters returns a friendly `VALIDATION_ERROR`
- [ ] Submitting when not enrolled returns `FORBIDDEN`
- [ ] Submitting twice for the same assessment updates the existing submission rather than
      creating a duplicate (or returns `CONFLICT` — pick one and make the UI match)
- [ ] **Killing the AI (unset the key) still saves the submission** and it still reaches the
      mentor queue
- [ ] A `changes_requested` submission can be edited and resubmitted
- [ ] Nothing in this feature writes to `xp_events`
