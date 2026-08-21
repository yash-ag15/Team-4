# 07 — Mentor review · backend tasks (Riya)

Start at **T+2:15**, after the AI review components are done. Everything here must be
working by Gate B at T+3:00 — this is the back half of the round-trip.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `assertMentor(user)` + `assertOwnsCourse(user, courseId)` helpers | `src/server/mentor.ts` | 10 m |
| 2 | `queue(user, input)` — submissions joined to assessment → course, filtered to `course.mentorId = user.id` unless admin. Default `status: 'ai_reviewed'`, ordered oldest-first. Include `aiScore`, `aiXpSuggested`, `studentName`, `courseTitle`. | `src/server/mentor.ts` | 25 m |
| 3 | `getForReview(user, id)` — full submission + the latest non-preview `ai_review` + student context (their XP, their progress on this course, their last 2 scores) | `src/server/mentor.ts` | 20 m |
| 4 | `decide(user, input)` — clamp `finalXp` to `[0, assessment.xpAward]`, set status/finalScore/finalXp/mentorId/mentorNote/reviewedAt, then **`awardXp()` only on `approve`** | `src/server/mentor.ts` | 25 m |
| 5 | Wire into `api/mentor/*` route files | routes | 5 m |
| 6 | `students(user, input)` — the roster for feature 11 | `src/server/mentor.ts` | 20 m |

## `decide()`, in order

```ts
const { submission, assessment } = await loadForDecision(id)
assertOwnsCourse(user, assessment.courseId)

const finalXp    = clamp(input.finalXp, 0, assessment.xpAward)
const finalScore = clamp(input.finalScore, 0, assessment.maxScore)

await db.update(submissions).set({
  status: input.decision === 'approve' ? 'mentor_approved' : 'changes_requested',
  finalScore, finalXp: input.decision === 'approve' ? finalXp : null,
  mentorId: user.id, mentorNote: input.note, reviewedAt: new Date(),
}).where(eq(submissions.id, id))

let award = null
if (input.decision === 'approve') {
  award = await awardXp({ /* ... key: `submission:${id}` ... */ })
  await checkBadges(submission.studentId)      // 'perfect-score', 'first-submission'
}

return { submission: await getForReview(user, id), award }
```

**Clamp on the server.** A mentor with dev tools open must not be able to award 10,000 XP,
and more importantly a typo (`1200` instead of `120`) must not wreck the leaderboard
thirty seconds before the demo.

## Traps

- **Do not import `xpEvents` here.** Call `awardXp()`. The idempotency key is
  `submission:<submissionId>` — no timestamp, no random suffix, or double-approve doubles.
- The `queue` filter must be on `course.mentorId`, not `submission.mentorId` (which is null
  until someone decides). Getting this wrong makes every mentor's queue empty and costs
  fifteen confused minutes at T+2:45.
- `getForReview` should pick the **latest `isPreview: false`** review. A student who ran
  five previews has six rows; only one is the real review.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] `grep -n "insert(xpEvents" src/server/mentor.ts` returns nothing
- [ ] Approve twice → one `xp_event`
- [ ] A mentor cannot decide on another mentor's course (403)
