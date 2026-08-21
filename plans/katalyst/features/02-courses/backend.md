# 02 — Courses · backend tasks (Siddesh)

Siddesh is also the **schema owner**. Tasks 1-4 block the entire team — do them first, do
them fast, and push.

## Phase 0 — foundation (T+0:00 → T+0:20). Everyone is waiting.

| # | Task | Est |
|---|---|---|
| 1 | Delete `src/db/schema/projects.ts` and `tasks.ts`; remove their two lines from `schema/index.ts` | 2 m |
| 2 | Land `src/db/schema/courses.ts`, `learning.ts`, `engagement.ts` (already written — review against `plans/katalyst/schema.md`) | 5 m |
| 3 | Wait for Samya's `auth:generate`, then `npm run db:generate` → **commit `drizzle/`** → `npm run db:migrate` **once** | 8 m |
| 4 | Push. Announce in the channel: "schema is live, pull main." | 2 m |

**From here on you are the only person who runs `db:migrate`.** If someone needs a column,
they ask you, you add it, you generate, you migrate, you push. One migration chain.

## Phase 1 — read path (T+0:20 → T+1:30). Gate A depends on this.

| # | Task | Files | Est |
|---|---|---|---|
| 5 | `listCourses(user, input)` — filters, `status='published'` unless mentor/admin, joined `enrolledCount`, `sectionCount`, `lessonCount` | `src/server/courses.ts` | 25 m |
| 6 | `computeTotalXp(sections, course)` using `applyTrack()` from `src/lib/xp.ts` | `src/server/courses.ts` | 10 m |
| 7 | `getCourse(slug)` — course + sections + nested lessons, both ordered by `orderIndex` | `src/server/courses.ts` | 20 m |
| 8 | Wire handlers into `api/courses/route.ts` and `api/courses/[slug]/route.ts` | routes | 5 m |

**Do the read path before the write path.** Six people are blocked on the catalog; nobody
is blocked on the authoring API.

## Phase 2 — write path (T+1:30 → T+3:00)

| # | Task | Est |
|---|---|---|
| 9 | `canEditCourse(user, course)` — admin, or the owning mentor. One helper, used by all six write ops. | 10 m |
| 10 | `createCourse` — slugify the title, collision-suffix, default `status: 'draft'`, `mentorId = user.id` | 15 m |
| 11 | `updateCourse` — includes the publish transition | 10 m |
| 12 | Sections + lessons CRUD. `orderIndex` = `max(orderIndex) + 1` on create; **do not build drag-reorder**, an integer input is enough. | 30 m |
| 13 | Rewrite `src/db/seed.ts` for the Katalyst fixtures (see `schema.md` §7) | 30 m |

## Phase 3 — indexes and seed (T+3:00 → T+4:15)

| # | Task | Est |
|---|---|---|
| 14 | Add the indexes from `schema.md` §6, generate, migrate | 10 m |
| 15 | Seed the full demo dataset; verify the catalog, dashboard and leaderboard all look populated | 25 m |
| 16 | Feature 11 (admin reports) — see that folder | — |

## Notes

- **`text` ids with `$defaultFn(() => crypto.randomUUID())`.** The seed writes literal ids
  (`course-1`, `sec-1`) so a URL that works against mocks works against the database.
- `slug` is unique. The seed's slugs must match the mock fixtures' slugs exactly, or
  `/learn/data-foundations` breaks the moment the route goes live.
- Cascade deletes: `sections` → `lessons` → `assessments`. Set `onDelete: 'cascade'` once in
  the schema rather than writing cleanup code.
- `enrolledCount` via a `leftJoin` + `count`, not N+1 queries. At 6 courses it does not
  matter for speed, but the mentor roster reuses the same shape at higher volume.
