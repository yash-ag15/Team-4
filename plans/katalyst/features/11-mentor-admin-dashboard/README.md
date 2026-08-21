# 11 — Mentor & admin dashboard + reports

**Priority:** MUST · **Gate:** C · **Backend:** Siddesh (reports) + Riya (`mentor.students`)
· **Frontend:** Makarand · **Branch:** `feature/admin`
**Contracts:** `src/contracts/mentor.ts`, `src/contracts/admin.ts`
**Pages:** `src/app/(mentor)/dashboard`, `src/app/(mentor)/students`,
`src/app/(mentor)/admin/reports`

---

## What it does

The other side of the product. A mentor sees **who is enrolled in their courses**, how each
student is doing, and what is waiting for review. An admin additionally manages roles and
runs filtered reports.

This is the "management spends significant time on reminders and follow-ups" problem from
the brief. The answer we demo: **one screen that tells a mentor exactly who to chase**,
instead of a WhatsApp group and a spreadsheet.

---

## Mentor dashboard

| Widget | Source |
|---|---|
| Pending reviews (count + the 3 oldest) | `api.mentor.queue` |
| My courses (enrolled, average progress, completion rate) | `api.courses.mine` |
| Students needing attention | `api.mentor.students?flag=at_risk` |
| Cohort XP this month | `api.admin.report` (or `xp.leaderboard` scoped) |

**"Students needing attention" is the feature that justifies the whole mentor side.** A
student is flagged when any of these is true:

- an overdue mandatory course or assessment
- no activity in 7+ days
- `progressPct < 25` on a course enrolled more than 14 days ago
- a `changes_requested` submission untouched for 3+ days

Each flagged row shows the reason and a nudge action. That is the escalation story.

---

## `mentor.students` (Riya)

`GET /api/mentor/students?courseId=&flag=&q=&limit=`

```ts
export const StudentRow = z.object({
  userId: z.string(), name: z.string(), email: z.string(), image: z.string().nullable(),
  cohortYear: z.string(), campus: z.string(),
  totalXp: z.number().int(), level: z.number().int(),
  coursesEnrolled: z.number().int(), coursesCompleted: z.number().int(),
  avgProgressPct: z.number().int(),
  lastActiveAt: z.string().nullable(),
  pendingSubmissions: z.number().int(),
  flags: z.array(z.enum(['overdue', 'inactive', 'stalled', 'awaiting_resubmit'])),
})
```

Scoped to students enrolled on **this mentor's** courses; admins see everyone.

---

## `admin.report` (Siddesh)

`GET /api/admin/report?cohortYear=&courseId=&track=&category=&from=&to=&status=`

```ts
output: z.object({
  rows: z.array(z.object({
    studentId, studentName, cohortYear, campus,
    courseTitle, track, status,
    progressPct, xpEarned, enrolledAt, completedAt, lastActiveAt,
  })),
  totals: z.object({
    students: z.number().int(), enrollments: z.number().int(),
    completed: z.number().int(), completionRate: z.number().int(),
    totalXp: z.number().int(), avgXp: z.number().int(),
    activeThisMonth: z.number().int(), engagementRate: z.number().int(),
  }),
})
```

**`totals` is the slide.** `completionRate` and `engagementRate` map directly onto the
+20%-completion and 80%-monthly-engagement metrics — show them as big numbers above the
table, not as a column.

`admin.setRole` (`POST /api/admin/users/:id/role`, `auth: 'admin'`) promotes a student to
mentor. One dropdown on a users table; five minutes of work, and it is how a live judge
gets a mentor account.

---

## Definition of done

- [ ] A mentor sees only their own courses' students; an admin sees all
- [ ] Pending review count is correct and links to the queue
- [ ] "Needs attention" flags each show their reason
- [ ] Admin report filters by cohort, course, track and date range
- [ ] `totals` shows completion rate and engagement rate as headline numbers
- [ ] Admin can promote a user to mentor
- [ ] A student hitting any `/api/admin/*` route gets `FORBIDDEN`
- [ ] The report table is readable at 1366px without horizontal scroll on the page (the
      table itself may scroll inside its own container)
