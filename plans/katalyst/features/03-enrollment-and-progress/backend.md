# 03 — Enrolment & progress · backend tasks (Ayush)

**Blocked on:** Yash's `awardXp()` (feature 06). He lands it by T+0:50. Until then, stub it
locally as `async () => ({ awarded: true, amount: 0 })` and swap the import — do **not**
write to `xp_events` yourself, not even temporarily. That is exactly the shortcut that
becomes a double-XP bug at T+4:00.

## Wave 1 (T+0:20 → T+1:30) — Gate A

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `enroll(userId, courseId)` — course must exist and be `published`; catch the unique violation and rethrow as `ApiError('CONFLICT')` | `src/server/enrollments.ts` | 15 m |
| 2 | `myEnrollments(userId, input)` — join `courses`, compute `progressPct`, `xpEarned` (from the ledger), `nextLesson` | `src/server/enrollments.ts` | 25 m |
| 3 | `getEnrollment` / `drop` — ownership check on both | `src/server/enrollments.ts` | 10 m |
| 4 | `completeLesson()` — the rollup in the README, in order | `src/server/progress.ts` | 40 m |
| 5 | `recomputeEnrollmentCache(enrollmentId)` — `progressPct` from `lesson_progress`, `xpEarned` from `sum(xp_events where courseId)` | `src/server/progress.ts` | 15 m |
| 6 | Wire all handlers into their route files | routes | 5 m |

## Wave 2 (T+1:30 → T+3:00)

| # | Task | Est |
|---|---|---|
| 7 | `courseProgress(userId, courseId)` — per-section completion + `nextLesson` | 20 m |
| 8 | Feature 04 — submissions (see that folder). **Start it at T+1:30 regardless of task 7.** | — |

## Wave 3 (T+3:00 → T+4:15)

| # | Task | Est |
|---|---|---|
| 9 | `progressOverview(userId)` — the dashboard aggregate (feature 10): per-course rows, totals, due-soon list, next action | 30 m |
| 10 | Whatever Gate B surfaced | — |

---

## The two traps in this feature

**1. The N+1 in the rollup.** The naive `completeLesson` runs one query per lesson to check
whether the section is done. Do it in one:

```ts
const [{ total, done }] = await db
  .select({
    total: count(lessons.id),
    done:  count(lessonProgress.id),
  })
  .from(lessons)
  .leftJoin(lessonProgress, and(
    eq(lessonProgress.lessonId, lessons.id),
    eq(lessonProgress.enrollmentId, enrollmentId),
  ))
  .where(eq(lessons.sectionId, sectionId))

if (total > 0 && total === done) { /* section complete */ }
```

Same shape one level up for the course rollup.

**2. Awarding before inserting progress.** Always insert `lesson_progress` **first**, then
award. If the award throws, the student has progress and no XP — recoverable. The other
order gives them XP with no progress, which the rollup will then award again.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] `completeLesson` is ≤4 queries per call, not one per lesson
- [ ] Zero direct writes to `xp_events` in your files — `grep -n "insert(xpEvents)" src/server/progress.ts src/server/enrollments.ts` returns nothing
- [ ] `npm run typecheck` clean
