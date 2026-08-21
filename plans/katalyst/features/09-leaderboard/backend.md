# 09 — Leaderboard · backend tasks (Makarand, or Yash if he has room)

T+2:00 → T+2:30. Small feature; do not let it grow.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `leaderboard(user, input)` — the grouped `sum()` with `since` and `courseId` filters | `src/server/xp.ts` | 20 m |
| 2 | Join `user` for name / image / cohortYear; compute `level` + `levelName` in JS via `@/lib/xp` | same | 10 m |
| 3 | `me` — the rank-count query, run even when the user is in `rows` (then just reuse the row) | same | 10 m |
| 4 | Deterministic tie-break: `order by xp desc, user_id asc` | same | 2 m |
| 5 | Wire into `api/xp/leaderboard/route.ts` | route | 3 m |

## `since` for `scope: 'month'`

First day of the **current calendar month** at 00:00 IST — not "last 30 days". A calendar
month is what a student understands and what "monthly engagement" means in the metric.

```ts
const since = scope === 'month'
  ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  : null
```

## Traps

- **Do not add a `user.totalXp` column to make this faster.** It will drift from the ledger
  and the leaderboard will disagree with the dashboard on stage. The `group by` is fast
  enough at any volume this demo will see.
- `me` must be computed even when the user has zero XP — return rank = `total + 1`, xp 0,
  level 1. A brand-new student seeing "unranked" is fine; seeing `null` and a crashed
  component is not.
- Seeded XP must be **spread over the last 60 days** or the monthly board and the all-time
  board are identical and the toggle looks broken. Tell Siddesh.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] Monthly and all-time return visibly different orderings against the seed
- [ ] `me` correct for a rank-40 user
- [ ] Two users with identical XP keep a stable order across refreshes
