# 06 — XP engine & ledger

**Priority:** MUST · **Gate:** A · **Backend:** Yash · **Frontend:** Methika · **Branch:** `feature/xp`
**Contract:** `src/contracts/xp.ts` · **Server:** `src/server/xp.ts` ·
**Constants:** `src/lib/xp.ts` · **Routes:** `src/app/api/xp/*`

> Rules, numbers and the level curve: [`../../xp-and-gamification.md`](../../xp-and-gamification.md).

---

## What it does

One function writes XP. Everything else reads a `sum()`.

```ts
export async function awardXp(input: {
  userId: string
  amount: number
  reason: XpReason
  sourceType: string
  sourceId: string
  courseId?: string | null
  awardedBy?: string | null
  note?: string
  idempotencyKey: string        // required. no default. no optional.
}): Promise<XpAward>
```

```ts
const [row] = await db.insert(xpEvents).values({ id: crypto.randomUUID(), ...input })
  .onConflictDoNothing({ target: xpEvents.idempotencyKey })
  .returning()

// awarded:false means "already granted" — the caller renders nothing and a
// double-clicked button is a no-op. This line is the whole correctness story.
```

`awardXp` returns the new total, the new level and `leveledUp`, so a caller can build the
`awards[]` array the UI toasts from a single request.

**`src/lib/xp.ts` is the shared constants module and is imported by client components.**
It must contain no database import, no `server-only`, and no secrets — pure numbers and
pure functions.

---

## The contract

| Op | Method | Path | Auth | Notes |
|---|---|---|---|---|
| `summary` | GET | `/api/xp/summary` | user | `?userId=` (mentors only) |
| `ledger` | GET | `/api/xp/ledger` | user | `?limit=&courseId=&since=` |
| `leaderboard` | GET | `/api/xp/leaderboard` | user | `?scope=month\|all&courseId=&limit=` (feature 09) |

```ts
export const XpSummary = z.object({
  totalXp: z.number().int(),
  yearXp: z.number().int(),          // sum since Jan 1 — the problem statement asks for it
  monthXp: z.number().int(),
  level: z.number().int(),
  levelName: z.string(),
  xpIntoLevel: z.number().int(),
  xpToNextLevel: z.number().int(),
  nextLevelAt: z.number().int(),
  rank: z.number().int().nullable(),      // monthly rank
  byReason: z.array(z.object({ reason: z.string(), amount: z.number().int() })),
  byCourse: z.array(z.object({ courseId: z.string(), courseTitle: z.string(), amount: z.number().int() })),
})
```

`byReason` and `byCourse` cost one extra `group by` each and give Methika a real
"where my XP came from" breakdown for free. Worth it.

---

## `src/lib/xp.ts` — the exports everyone imports

```ts
export const XP = {
  LESSON_DEFAULT: 10, SECTION_DEFAULT: 50, COURSE_BONUS_DEFAULT: 100,
  CERTIFICATE_BONUS: 200, DAILY_CHECKIN: 10, STREAK_MILESTONE: 50,
  STREAK_MILESTONE_EVERY: 7, BADGE_DEFAULT: 25,
} as const

export const OPTIONAL_TRACK_MULTIPLIER = 1.5
export const applyTrack = (base: number, track: 'mandatory' | 'optional') =>
  track === 'optional' ? Math.round(base * OPTIONAL_TRACK_MULTIPLIER) : base

export const levelFromXp    = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
export const xpForLevel     = (level: number) => (level - 1) ** 2 * 100
export const xpToNextLevel  = (xp: number) => xpForLevel(levelFromXp(xp) + 1) - xp
export const LEVEL_NAMES = ['Explorer','Builder','Contributor','Specialist','Catalyst','Mentor-in-Training','Luminary'] as const
export const levelName = (level: number) => LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1]
```

---

## Definition of done

- [ ] `awardXp` is the only place in `src/` that inserts into `xp_events` —
      `grep -rn "insert(xpEvents" src/ | grep -v "server/xp.ts"` returns nothing
- [ ] Calling `awardXp` twice with the same key inserts once and returns `awarded: false`
- [ ] `summary` matches `sum(amount)` from the ledger, always
- [ ] `yearXp` counts only events since 1 January
- [ ] Level maths matches the table in `xp-and-gamification.md` §4
- [ ] `src/lib/xp.ts` imports nothing from `@/db` and is safe in a client component
- [ ] The optional multiplier applies to course XP and **not** to check-in/streak/badge XP
