# 04 — Submissions · backend tasks (Ayush)

Start at T+1:30, immediately after Gate A. Feature 07 (mentor review) and the whole Gate B
round-trip are blocked on task 3.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `assertEnrolled(userId, courseId)` helper → `FORBIDDEN` with a useful message | `src/server/submissions.ts` | 5 m |
| 2 | `createSubmission(userId, input)` — validate, resolve `enrollmentId`, cap `content` at 8,000 chars, insert with `status: 'submitted'` | `src/server/submissions.ts` | 20 m |
| 3 | **Call `aiCoach.review({ submissionId })` in a try/catch after the insert commits.** Never inside the same transaction as the insert. | `src/server/submissions.ts` | 15 m |
| 4 | `mySubmissions(userId, input)` — joins for `assessmentTitle`, `courseTitle`, `mentorName` | `src/server/submissions.ts` | 20 m |
| 5 | `getSubmission(userId, id)` — ownership check, nested `review` from `ai_reviews` (latest non-preview) | `src/server/submissions.ts` | 15 m |
| 6 | `updateSubmission` — allowed only while `draft` or `changes_requested`; resubmitting re-runs the AI review | `src/server/submissions.ts` | 15 m |
| 7 | Wire the handlers into `api/submissions/*` | routes | 5 m |
| 8 | `export const maxDuration = 60` on `api/submissions/route.ts` — it calls the coach inline | routes | 1 m |

## The re-submit decision — agree it with Samya at T+1:30

Two workable options; pick one and make both halves match:

- **A (recommended):** one submission per `(assessmentId, studentId)`. Resubmitting
  `PATCH`es it, bumps `updatedAt`, resets status to `submitted`, and re-runs the review. The
  mentor sees the current version. Simple, and it matches the "iterate with the coach"
  story.
- **B:** many submissions, latest wins. More faithful to real life, more UI to build, more
  ways for the mentor's queue to show stale rows.

If you take A, add `unique(assessmentId, studentId)` — tell Siddesh, he migrates.

## The AI Coach handshake (with Yash)

```ts
// src/server/ai-coach.ts exports:
export async function review(args: { submissionId: string }): Promise<{ review: AiReview }>
```

It reads the submission, the assessment, the course and the student's history itself.
Ayush passes an id, not a payload — that keeps the prompt-building entirely inside Yash's
file.

`review()` is responsible for setting `status: 'ai_reviewed'` and the denormalised
`aiScore` / `aiXpSuggested`. Ayush does **not** set those.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] `ANTHROPIC_API_KEY=` (empty) → submission still saves, review is the mock, no 500
- [ ] A 30-second AI call does not time out the route (`maxDuration = 60`)
- [ ] `grep -n "xpEvents" src/server/submissions.ts` returns nothing
