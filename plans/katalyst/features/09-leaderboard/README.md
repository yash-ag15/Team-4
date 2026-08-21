# 09 — Leaderboard

**Priority:** MUST · **Gate:** C · **Backend:** Makarand (or Yash) ·
**Frontend:** Methika
**Contract:** `src/contracts/xp.ts` → `leaderboard` · **Server:** `src/server/xp.ts` ·
**Route:** `src/app/api/xp/leaderboard` · **Page:** `src/app/(student)/leaderboard`

---

## The contract

`GET /api/xp/leaderboard?scope=month|all&courseId=&limit=20`

```ts
export const LeaderboardRow = z.object({
  rank: z.number().int(),
  userId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  cohortYear: z.string(),
  xp: z.number().int(),
  level: z.number().int(),
  levelName: z.string(),
  isMe: z.boolean(),
})

output: z.object({
  rows: z.array(LeaderboardRow),
  me: LeaderboardRow.nullable(),     // ALWAYS present, even outside the top N
  scope: z.enum(['month', 'all']),
  total: z.number().int(),
})
```

**`me` is returned even when the student is not in the top 20.** A leaderboard that does not
show you your own rank demotivates everyone outside the top 20, which is most people. This
is the single most important design decision in the feature.

**Default scope is `month`, not all-time.** A monthly reset means a student who joins in
week three can still reach the top, and it maps directly to the 80%-monthly-engagement
metric. All-time is a toggle, not the default.

---

## The query

```sql
select user_id, sum(amount) as xp
from xp_events
where (:since is null or created_at >= :since)
  and (:courseId is null or course_id = :courseId)
group by user_id
order by xp desc
limit :limit
```

Then join `user` for name, image and cohort, and compute `level` with `levelFromXp()` in
JS — not in SQL. `rank` is the array index + 1 for the top N; `me.rank` needs a second
count query:

```sql
select count(*) + 1 from (
  select user_id, sum(amount) as xp from xp_events where ... group by user_id
) t where t.xp > :myXp
```

Both queries hit the `xp_events (user_id, created_at desc)` index. At hackathon volume this
is instant; do not cache it.

---

## Build order

1. **Global monthly** — the only one that must exist. (backend 20 m, frontend 30 m)
2. **All-time toggle** — one query param. (5 m)
3. **Per-course tab** — `courseId` filter, shown on the course detail page. (15 m)
4. **Team leaderboard** — feature 14, good-to-have. Only after Gate C.

---

## The page (Methika)

```
This month  |  All time                    [ course filter ▾ ]

┌──────────────────────────────────────────┐
│ 🥇  1   Priya Nair      Catalyst   2,340 │
│ 🥈  2   Arjun Mehta     Specialist 1,980 │
│ 🥉  3   Sana Qureshi    Specialist 1,755 │
│     4   …                                │
│  ...                                     │
├──────────────────────────────────────────┤
│ ▸  14   YOU              Contributor  620│   <- sticky, accent border
└──────────────────────────────────────────┘
```

- Top 3 get medals; everyone else gets a number.
- **The "me" row is sticky at the bottom** and highlighted, always visible while scrolling.
- Level name next to XP, using the level colour ramp from `globals.css`.
- Rows link to nothing — no public profiles in six hours.
- A dashboard **leaderboard peek** shows my rank plus the two people above and below me,
  linking to the full page. That "you are 40 XP behind Arjun" framing does more for
  engagement than the top-10 list does.

---

## Definition of done

- [ ] Monthly scope is the default and returns real ranks
- [ ] `me` is present and correct when the student is rank 40 of 60
- [ ] The "me" row is sticky and visually distinct
- [ ] All-time toggle works and changes the ranks
- [ ] Ties are broken deterministically (by `userId`) so ranks do not jump between renders
- [ ] Empty state — under 3 people with XP, show an encouraging message, not an empty table
- [ ] Dashboard peek shows my rank and neighbours
