# 08 — Gamification · backend tasks (Makarand)

T+0:20 → T+2:00. Blocked on Yash's `awardXp()` (lands T+0:50) — stub it until then, and
never write `xp_events` yourself.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `todayIST()` helper — one fixed timezone, returns `YYYY-MM-DD` | `src/server/gamification.ts` | 10 m |
| 2 | `checkIn(userId)` — the algorithm in `README.md`, in that order | `src/server/gamification.ts` | 30 m |
| 3 | `getStreak(userId)` — including `last14` as a boolean array from `daily_checkins` | `src/server/gamification.ts` | 15 m |
| 4 | Seed the 12 badge definitions (idempotent upsert, runs on first call or in the seed) | `src/db/seed.ts` (ask Siddesh) | 15 m |
| 5 | `checkBadges(userId)` — the twelve criteria, `awardXp` per newly earned | `src/server/gamification.ts` | 40 m |
| 6 | `listBadges(userId)` — **all 12**, left-joined to `user_badges` | `src/server/gamification.ts` | 10 m |
| 7 | `listChallenges(userId)` — compute `current` per `targetType` on read | `src/server/gamification.ts` | 30 m |
| 8 | Wire into `api/gamification/*` | routes | 5 m |
| 9 | `leaderboard()` (feature 09) — take it from Yash at T+2:00 if he is deep in the coach | `src/server/xp.ts` | 20 m |

## `checkBadges` — keep it dumb

Twelve `if`s over a handful of counts. Do not build a rules engine.

```ts
const [counts] = await db.select({
  lessons:    count(lessonProgress.id),
  sections:   count(sectionProgress.id),
  submissions: count(submissions.id),
  courses:    count(/* enrollments where status='completed' */),
}).from(/* ... */)

const earned: string[] = []
if (counts.lessons >= 1) earned.push('first-steps')
if (counts.submissions >= 1) earned.push('first-submission')
if (counts.sections >= 5) earned.push('section-sweeper')
if (streak.current >= 7) earned.push('week-warrior')
if (streak.current >= 14) earned.push('fortnight')
if (counts.courses >= 1) earned.push('course-complete')
// ...

for (const badgeId of earned) {
  const [row] = await db.insert(userBadges)
    .values({ id: crypto.randomUUID(), userId, badgeId })
    .onConflictDoNothing({ target: [userBadges.userId, userBadges.badgeId] })
    .returning()
  if (row) await awardXp({ /* ... key: `badge:${userId}:${badgeId}` ... */ })
}
```

The `onConflictDoNothing` + the idempotency key mean calling this after **every** XP award
is free. That is the design — cheap and repeatable beats clever and conditional.

## Traps

- **Timezone.** `new Date().toISOString().slice(0,10)` is UTC. Use a fixed IST offset or
  `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })`. Getting this wrong makes
  the streak roll over mid-morning during the demo.
- **The freeze must only forgive `gap === 2`** (exactly one missed day). Forgiving any gap
  makes the streak meaningless.
- `daily_checkins` has `unique(userId, checkinDate)` — rely on it, catch the conflict,
  return `alreadyCheckedIn: true` rather than pre-checking and racing.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] `grep -n "insert(xpEvents" src/server/gamification.ts` returns nothing
- [ ] Manually set `lastCheckinDate` back 1, 2 and 3 days and verify all three branches
- [ ] Pushed by T+2:00 so you can move to the frontend
