# 10 — Student dashboard · backend tasks (Ayush)

Only one endpoint: `progress.overview`. T+3:00 → T+3:40.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `courses[]` — enrolments joined to courses, with `completedLessons` / `totalLessons` per course in **one** grouped query, not one query per enrolment | `src/server/progress.ts` | 20 m |
| 2 | `nextLesson` per course — first lesson without `lesson_progress`, ordered by `(section.orderIndex, lesson.orderIndex)` | same | 15 m |
| 3 | `continueWith` — the enrolment with the most recent `lesson_progress.completedAt` | same | 5 m |
| 4 | `dueSoon` — mandatory courses and assessments with `dueAt` inside 7 days or already past; `overdue` boolean; sorted soonest-first | same | 15 m |
| 5 | `totals` — enrolled / completed / inProgress / submissionsPending counts | same | 5 m |
| 6 | Wire into `api/progress/overview/route.ts` | route | 3 m |

## The one-query rollup

Do not loop over enrolments issuing queries. One grouped join gives every course's counts:

```ts
const rows = await db
  .select({
    enrollmentId: enrollments.id,
    courseId: courses.id,
    totalLessons: countDistinct(lessons.id),
    completedLessons: countDistinct(lessonProgress.id),
  })
  .from(enrollments)
  .innerJoin(courses, eq(courses.id, enrollments.courseId))
  .innerJoin(courseSections, eq(courseSections.courseId, courses.id))
  .innerJoin(lessons, eq(lessons.sectionId, courseSections.id))
  .leftJoin(lessonProgress, and(
    eq(lessonProgress.lessonId, lessons.id),
    eq(lessonProgress.enrollmentId, enrollments.id),
  ))
  .where(eq(enrollments.studentId, userId))
  .groupBy(enrollments.id, courses.id)
```

`nextLesson` needs a second query; that is fine. Two queries total, not 2N.

## Traps

- **`countDistinct`, not `count`.** The join fans out rows; a plain `count` will report
  inflated lesson totals and every progress bar will be wrong.
- A course with zero lessons must give `progressPct: 0`, not `NaN`. Guard the division.
- `dueSoon` must include **overdue** items, not just future ones — that is where the
  escalation story lives.
- A student with no enrolments must return empty arrays and zero totals, not throw. Methika
  is building an empty state against exactly that.

## Definition of done

- [ ] `overview` returns in ≤2 queries
- [ ] Percentages match the per-course progress endpoint exactly
- [ ] Zero-enrolment student returns a valid empty payload
- [ ] Overdue items flagged and sorted first
- [ ] `npm run typecheck` clean, contract validated (no `CONTRACT_VIOLATION` in dev)
