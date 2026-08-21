# 03 — Enrolment & progress

**Priority:** MUST · **Gate:** A · **Backend:** Ayush · **Frontend:** Methika · **Branch:** `feature/progress`
**Contracts:** `src/contracts/enrollments.ts`, `src/contracts/progress.ts`
**Server:** `src/server/enrollments.ts`, `src/server/progress.ts`
**Routes:** `src/app/api/enrollments/*`, `src/app/api/progress/*`

---

## What it does

A student enrols on a course, works through lessons, and each completion rolls up:
lesson → section → course, awarding XP at each level exactly once.

**This feature owns the most important correctness property in the app:** completing a
lesson twice must never award XP twice. It gets that for free by calling `awardXp()` with
an idempotency key (feature 06) — but only if it never writes `xp_events` directly.

---

## The rollup, precisely

```
completeLesson(userId, lessonId):
  enrollment = find(studentId, lesson.section.courseId)   -> 404 if not enrolled
  insert lesson_progress(enrollmentId, lessonId) ON CONFLICT DO NOTHING
  awardXp(lesson.xpAward, key: lesson:<enrollmentId>:<lessonId>, courseId)

  # section rollup
  if every lesson in this section has lesson_progress:
      insert section_progress(...) ON CONFLICT DO NOTHING
      awardXp(section.xpAward, key: section:<enrollmentId>:<sectionId>, courseId)

  # course rollup
  if every section in this course has section_progress:
      enrollment.status = 'completed'; completedAt = now
      awardXp(course.xpBonusOnComplete, key: course:<enrollmentId>, courseId)
      if course.certificateEligible:
          awardXp(200, key: certificate:<enrollmentId>, courseId)

  recomputeEnrollmentCache(enrollmentId)   # progressPct, xpEarned
  checkBadges(userId)                      # feature 08

  return { progress, awards: XpAward[] }   # so the UI can toast every award at once
```

**Every `xpAward` above passes through `applyTrack()`** — an optional course multiplies all
five by 1.5. That happens inside `awardXp`'s caller, not inside `awardXp`.

Returning `awards[]` from one call is what lets the UI fire
`+10 XP · Lesson` then `+75 XP · Section complete` then `Level up!` in sequence off a
single request. Do not make the frontend poll for it.

---

## The contracts

### `enrollments`

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `enroll` | POST | `/api/enrollments` | user | `{ courseId }` → 409 `CONFLICT` if already enrolled |
| `mine` | GET | `/api/enrollments` | user | `?status=` — each row carries the nested `course`, `progressPct`, `xpEarned`, `nextLesson` |
| `get` | GET | `/api/enrollments/:id` | user | own only |
| `drop` | DELETE | `/api/enrollments/:id` | user | sets `status: 'dropped'`; **never deletes the row** — XP already awarded stays awarded |

### `progress`

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `completeLesson` | POST | `/api/progress/lesson` | user | `{ lessonId }` → `{ progress, awards }` |
| `course` | GET | `/api/progress/course/:courseId` | user | per-section completion, `completedLessons/totalLessons`, `nextLesson`, `progressPct` |
| `overview` | GET | `/api/progress/overview` | user | across all enrolments — powers the dashboard (feature 10) |

```ts
export const XpAward = z.object({
  amount: z.number().int(),
  reason: z.string(),
  label: z.string(),          // "Section complete — Working with data"
  newTotalXp: z.number().int(),
  newLevel: z.number().int(),
  leveledUp: z.boolean(),
})
```

---

## Definition of done

- [ ] Enrolling writes one row; enrolling twice returns `CONFLICT` and no second row
- [ ] Completing a lesson writes `lesson_progress` and one `xp_event`
- [ ] **Double-clicking "Mark complete" awards XP once.** Test this explicitly.
- [ ] Finishing the last lesson of a section fires the section award in the same response
- [ ] Finishing the last section completes the course and fires the bonus (+ certificate)
- [ ] An optional course awards 1.5× at every level
- [ ] `progressPct` on the enrolment row matches the ledger after every write
- [ ] `nextLesson` points at the first incomplete lesson in `orderIndex` order
