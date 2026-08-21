# 08 — Gamification: check-in, streaks, badges, challenges

**Priority:** MUST · **Gate:** C · **Backend:** Makarand · **Frontend:** Makarand · **Branch:** `feature/gamification`
**Contract:** `src/contracts/gamification.ts` · **Server:** `src/server/gamification.ts` ·
**Routes:** `src/app/api/gamification/*` · **Components:** `src/components/game/*`

> Numbers, badge list and challenge list:
> [`../../xp-and-gamification.md`](../../xp-and-gamification.md) §5-7.

Makarand owns both halves: backend first (T+0:20 → T+2:00), then frontend (T+2:00 → T+4:15),
then QA from T+4:15.

---

## What it does

The four mechanics that make a student open the app on a day they were not going to.

| Mechanic | The behaviour it buys |
|---|---|
| **Daily check-in** | One button, 10 XP, once per day. Pure habit formation. |
| **Streaks** | Loss aversion, with 2 freezes so one missed day does not end the run. |
| **Badges** | Twelve of them, with the unearned ones shown as grey silhouettes — those do more motivational work than the earned ones. |
| **Challenges** | Short, time-boxed goals with a visible progress bar. |

---

## The contract

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `checkIn` | POST | `/api/gamification/checkin` | user | `{}` → `{ streak, award, alreadyCheckedIn }` |
| `streak` | GET | `/api/gamification/streak` | user | current, longest, freezes, `checkedInToday`, last 14 days as booleans |
| `badges` | GET | `/api/gamification/badges` | user | **all 12**, each with `earned: boolean` and `earnedAt` |
| `challenges` | GET | `/api/gamification/challenges` | user | active, each with `current` / `targetValue` / `completedAt` |

```ts
export const Streak = z.object({
  current: z.number().int(), longest: z.number().int(),
  freezesLeft: z.number().int(), checkedInToday: z.boolean(),
  lastCheckinDate: z.string().nullable(),
  last14: z.array(z.boolean()),      // oldest -> newest, for the little dot row
})
```

`badges` returning **all twelve** (not just the earned ones) is deliberate. The grey
silhouettes with their criteria underneath are what make a student go and earn one.

---

## The check-in algorithm

```
today = server date in IST                     # one fixed timezone, always
if (userId, today) exists in daily_checkins -> return { alreadyCheckedIn: true }

gap = today - streak.lastCheckinDate
  gap == 1        -> current += 1
  gap == 2 and freezesLeft > 0 -> freezesLeft -= 1, current += 1     # forgive one day
  gap  > 2 or no freezes       -> current = 1
  no lastCheckinDate           -> current = 1

longest = max(longest, current)
awardXp(10, key: `checkin:${userId}:${today}`)
if current % 7 == 0: awardXp(50, key: `streak:${userId}:${current}`)
insert daily_checkins(userId, today, streakAfter: current, xpAwarded)
checkBadges(userId)
```

**Use one fixed timezone (IST) for `today`.** A server computing UTC dates rolls the streak
over at 5:30 AM local — which will happen during the demo if the demo is in the morning.

---

## `checkBadges(userId)` — one function, called after every XP award

Runs a handful of counts and calls `awardXp` for anything newly earned. The idempotency key
(`badge:<userId>:<badgeId>`) makes re-running it on every award completely harmless, which
is why it can be called liberally instead of carefully.

Exported from `src/server/gamification.ts` and imported by `progress.ts`, `mentor.ts` and
`gamification.ts`. **That is the only cross-feature import in the codebase** — keep its
signature `(userId: string) => Promise<Badge[]>` and never widen it.

---

## Challenge progress is computed on read

Never incremented on write. `current` comes from counting `xp_events` /
`lesson_progress` / `submissions` inside `[startsAt, endsAt]`. Slower, completely
drift-proof, and free at our data volume. `challenge_progress` stores only `completedAt`,
so the completion award fires once.

---

## Definition of done

- [ ] Check-in awards 10 XP once per day; the second click says "already checked in"
- [ ] A 7th consecutive day awards the 50 XP bonus
- [ ] Missing one day with a freeze available keeps the streak and decrements freezes
- [ ] Missing two days resets the streak to 1
- [ ] All 12 badges render, earned in colour and unearned as grey silhouettes with criteria
- [ ] Earning a badge awards its XP once
- [ ] Challenge progress bars match reality and completing one awards XP once
- [ ] Nothing here writes `xp_events` directly
