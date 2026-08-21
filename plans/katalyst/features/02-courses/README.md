# 02 — Courses: catalog, authoring, sections, lessons

**Priority:** MUST · **Gate:** A (read path) / C (authoring UI) · **Backend:** Siddesh ·
**Frontend:** Samya · **Branch:** `feature/courses`
**Contract:** `src/contracts/courses.ts` · **Server:** `src/server/courses.ts` ·
**Routes:** `src/app/api/courses/*`

---

## What it does

The Udemy-shaped structure: a **course** contains ordered **sections**, each section
contains ordered **lessons**, and **assessments** (feature 04) sit between sections. A
mentor or admin authors a course once and the structure is identical for every course of
that type — so the player, the progress rollup and the XP rules are written once.

Two dimensions the whole product hangs off:

- **`track`** — `mandatory` (has a `dueAt`, appears in "due soon") or `optional` (no
  deadline, earns **1.5× XP**).
- **`certificateEligible`** — completing it awards a certificate badge and +200 XP.

---

## The contract

```ts
export const CourseTrack      = z.enum(['mandatory', 'optional'])
export const CourseCategory   = z.enum(['technical','business','communication','leadership','wellbeing'])
export const CourseDifficulty = z.enum(['beginner','intermediate','advanced'])
export const CourseStatus     = z.enum(['draft','published','archived'])

export const Course = z.object({
  id, slug, title, subtitle, description, coverEmoji,
  category: CourseCategory, track: CourseTrack, difficulty: CourseDifficulty,
  certificateEligible: z.boolean(),
  estimatedHours: z.number().int(),
  xpBonusOnComplete: z.number().int(),
  totalXp: z.number().int(),          // computed: sections + lessons + bonus, track-adjusted
  dueAt: z.string().nullable(),
  status: CourseStatus,
  mentorId: z.string(),
  mentorName: z.string(),
  sectionCount: z.number().int(),
  lessonCount: z.number().int(),
  enrolledCount: z.number().int(),
  createdAt: z.string(),
})

export const Lesson  = z.object({ id, sectionId, title, kind, contentUrl, contentBody, durationMin, orderIndex, xpAward })
export const Section = z.object({ id, courseId, title, summary, orderIndex, xpAward, lessons: z.array(Lesson) })
```

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `list` | GET | `/api/courses` | user | `?track=&category=&difficulty=&q=&status=&limit=` — students only ever see `published` |
| `get` | GET | `/api/courses/:slug` | user | returns `{ course, sections }` with nested lessons |
| `create` | POST | `/api/courses` | admin | |
| `update` | PATCH | `/api/courses/:id` | admin | includes `status` → publish |
| `createSection` | POST | `/api/courses/:id/sections` | admin | |
| `updateSection` | PATCH | `/api/courses/sections/:id` | admin | |
| `createLesson` | POST | `/api/courses/sections/:id/lessons` | admin | |
| `updateLesson` | PATCH | `/api/courses/lessons/:id` | admin | |
| `mine` | GET | `/api/courses/mine` | user | courses this mentor owns |

> **Auth note.** `auth: 'admin'` in `defineRoute` currently means `systemRole === 'admin'`.
> Mentors also need to author. Siddesh adds the mentor check **inside**
> `src/server/courses.ts` (`if (role !== 'admin' && course.mentorId !== user.id) throw
> new ApiError('FORBIDDEN', ...)`) and sets the contract's `auth` to `'user'` on the
> authoring ops. Do **not** change `defineRoute`'s auth levels — that file is frozen.

`totalXp` is computed, not stored: `sum(lesson.xpAward) + sum(section.xpAward) +
xpBonusOnComplete`, then `applyTrack()` from `src/lib/xp.ts`. It is what the catalog card
shows as the reward, so it must include the 1.5× for optional courses.

---

## Definition of done

- [ ] `/catalog` renders published courses from Postgres with `source: 'live'`
- [ ] Filters by track, category, difficulty and a text search all work
- [ ] Course detail shows sections with their lessons in `orderIndex` order
- [ ] Mandatory cards show a due-date chip; optional cards show a `1.5x XP` chip
- [ ] An admin can create a course → sections → lessons → publish, end to end
- [ ] A mentor can edit their own course and **not** someone else's (403, not 500)
- [ ] A draft course never appears in the student catalog
