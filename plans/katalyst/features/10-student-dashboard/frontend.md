# 10 — Student dashboard · frontend tasks (Methika)

This is your main deliverable. Build it in the layout order from `README.md` and stop
wherever the clock runs out — the top of the page is the demo.

## T+1:00 → T+1:30 — shell

| # | Task | Est |
|---|---|---|
| 1 | Page scaffold with all nine widget slots, each showing a `LoadingState` | 20 m |
| 2 | Greeting + XP header (`api.xp.summary`) | 10 m |

## T+1:30 → T+3:00 — the top half (the demo)

| # | Task | Est |
|---|---|---|
| 3 | `LevelRing` wired to real `summary` data | 15 m |
| 4 | Mount Makarand's `CheckInCard` (import, don't rebuild) | 10 m |
| 5 | Mount Riya's `CoachBrief` | 10 m |
| 6 | `ContinueCard` — cover emoji, title, progress bar, next lesson, deep link | 20 m |
| 7 | `MyCourses` grid — reuse `CourseCard` from Samya with a progress variant | 25 m |
| 8 | `DueSoon` list — overdue in red, due-in-N-days in amber | 20 m |

## T+3:00 → T+4:15 — the bottom half + polish

| # | Task | Est |
|---|---|---|
| 9 | Mount `BadgeGrid`, `ChallengeCard` (Makarand's) | 15 m |
| 10 | `LeaderboardPeek` (feature 09) | 20 m |
| 11 | Totals row: **total · this year · this month** | 10 m |
| 12 | Empty state for a zero-enrolment student | 20 m |
| 13 | Responsive pass at 375 / 768 / 1366 | 25 m |

---

## Composition rule

**You do not compute anything on this page.** Every number comes from an endpoint. If you
find yourself writing `const pct = completed / total * 100`, stop — that belongs in
`progress.overview` and Ayush owns it. Ask him for the field.

The one exception is `levelFromXp` and friends from `@/lib/xp`, which are pure and shared
by design.

## The empty state matters more than you think

A judge may sign up live. A brand-new account must not show a wall of zeroes:

```
👋 Welcome to Katalyst

You're Level 1 — Explorer. Here's how to get moving:

  [ ✓ Check in today            +10 XP ]   <- make this work immediately
  [ → Browse the catalog                ]
  [ 🚀 Optional courses earn 1.5x XP     ]
```

Check-in works with zero enrolments, so a brand-new user can earn XP within five seconds of
signing up. That is a good first impression and it costs nothing.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] One `overview` call, not nine per-course calls
- [ ] No `MockBadge` anywhere by T+4:15
- [ ] Skeletons for every widget; nothing pops in
- [ ] Zero-enrolment state tested by signing up a fresh account
- [ ] 375px: widgets stack, nothing overflows horizontally
- [ ] No hardcoded XP or level numbers — all from `@/lib/xp`
