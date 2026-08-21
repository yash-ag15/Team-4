# 11 — Mentor & admin backend tasks

Split: **Riya** owns `mentor.students`, **Siddesh** owns `admin.*`. Different files, no
conflict.

## Riya — `mentor.students` (T+3:00 → T+3:30)

| # | Task | Est |
|---|---|---|
| 1 | Base query: distinct students enrolled on courses where `mentorId = user.id` (admins skip the filter) | 15 m |
| 2 | Per-student aggregates: `totalXp`, `coursesEnrolled`, `coursesCompleted`, `avgProgressPct`, `pendingSubmissions` | 15 m |
| 3 | `lastActiveAt` = greatest of `lesson_progress.completedAt`, `submissions.submittedAt`, `daily_checkins.createdAt` | 10 m |
| 4 | `flags[]` — the four rules in `README.md`, computed in JS from the row | 15 m |

Compute `flags` in JS, not SQL. Four booleans over data you already have beats four
correlated subqueries, and it stays readable when someone changes a threshold at T+4:00.

## Siddesh — `admin.*` (T+3:15 → T+4:15)

| # | Task | Est |
|---|---|---|
| 5 | `report(input)` — one flat join `enrollments × courses × user`, filters applied as `and(...)` over an array of optional conditions | 30 m |
| 6 | `totals` — counts plus `completionRate = completed/enrollments`, `engagementRate = activeThisMonth/students` | 15 m |
| 7 | `setRole(adminId, userId, role)` — `auth: 'admin'`, refuse self-demotion | 10 m |
| 8 | `listUsers(input)` — for the admin users table | 15 m |
| 9 | Wire into `api/admin/*` | 5 m |

### The optional-filter pattern

```ts
const where = and(
  ...[
    input.cohortYear ? eq(user.cohortYear, input.cohortYear) : undefined,
    input.courseId   ? eq(courses.id, input.courseId)        : undefined,
    input.track      ? eq(courses.track, input.track)        : undefined,
    input.from       ? gte(enrollments.enrolledAt, new Date(input.from)) : undefined,
    input.to         ? lte(enrollments.enrolledAt, new Date(input.to))   : undefined,
  ].filter(Boolean),
)
```

Clean, and it makes adding a filter at T+4:00 a one-line change.

## Traps

- **`engagementRate` must be honest.** Define "active this month" once —
  *any* `xp_event` in the current calendar month — and use the same definition in the
  report and in the pitch. A judge will ask how it is calculated.
- `report` must cap at 500 rows with an explicit `total`. An unbounded query on a shared
  Neon instance is how the demo hangs.
- `setRole` must not let an admin demote themselves — one guard, saves a locked-out account
  at T+5:00.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] Report returns in ≤2 queries with all five filters applied
- [ ] `completionRate` and `engagementRate` are integers 0-100 and match a hand count on the seed
- [ ] A mentor calling `admin.report` gets `FORBIDDEN`
