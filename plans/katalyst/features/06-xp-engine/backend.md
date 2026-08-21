# 06 — XP engine · backend tasks (Yash)

**This lands by T+0:50.** Ayush (feature 03), Riya (feature 07) and Makarand (feature 08)
are all stubbing against `awardXp()`. It is the smallest, most-blocking piece of code in the
repo — write it, push it, announce it, then go back to the AI Coach.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `src/lib/xp.ts` — constants, `applyTrack`, `levelFromXp`, `xpForLevel`, `xpToNextLevel`, `LEVEL_NAMES`, `levelName`. **No DB import.** | `src/lib/xp.ts` | 10 m |
| 2 | `awardXp()` with `onConflictDoNothing({ target: xpEvents.idempotencyKey })` | `src/server/xp.ts` | 15 m |
| 3 | `getTotals(userId)` — one query returning `totalXp`, `yearXp`, `monthXp` via `filter`/`case` aggregates | `src/server/xp.ts` | 15 m |
| 4 | `xpSummary(userId)` — totals + level maths + `byReason` + `byCourse` + monthly `rank` | `src/server/xp.ts` | 20 m |
| 5 | `ledger(userId, input)` — paged, newest first, joined `courseTitle` and `awardedByName` | `src/server/xp.ts` | 15 m |
| 6 | Wire into `api/xp/summary` and `api/xp/ledger`; **push and announce** | routes | 5 m |
| 7 | `leaderboard()` — feature 09, at T+2:00. Makarand may take it if you are deep in the coach. | `src/server/xp.ts` | 20 m |

## `awardXp`, in full

```ts
export async function awardXp(input: AwardInput): Promise<XpAward> {
  if (!Number.isInteger(input.amount)) throw new ApiError('INTERNAL', 'XP must be an integer')

  const [row] = await db.insert(xpEvents)
    .values({ id: crypto.randomUUID(), ...input, note: input.note ?? '' })
    .onConflictDoNothing({ target: xpEvents.idempotencyKey })
    .returning()

  const { totalXp } = await getTotals(input.userId)
  const level = levelFromXp(totalXp)

  return {
    awarded: Boolean(row),
    amount: row?.amount ?? 0,
    reason: input.reason,
    label: input.note || input.reason,
    newTotalXp: totalXp,
    newLevel: level,
    // Compare against the total BEFORE this award, so a no-op award never claims a level-up.
    leveledUp: Boolean(row) && levelFromXp(totalXp - (row?.amount ?? 0)) < level,
  }
}
```

## Traps

- **`onConflictDoNothing` needs the unique index to exist.** `idempotencyKey` is
  `text('idempotency_key').notNull().unique()`. If Siddesh's migration missed it, every
  duplicate insert silently succeeds and students get double XP. **Verify the index exists
  before Gate A** — `\d xp_events` in `db:studio`.
- **`amount` must be an integer.** `applyTrack` uses `Math.round`; a float reaching the
  column makes every subsequent `sum()` ugly.
- **Never add a `user.totalXp` counter column.** The moment two code paths can increment it,
  it drifts from the ledger and the leaderboard disagrees with the dashboard on stage.
- `leveledUp` must compare against the pre-award total, not just check `level > 1`.

## Definition of done

- [ ] Every checkbox in `README.md`
- [ ] A manual double-call test: `awardXp(same key)` twice → one row, second returns
      `awarded: false`
- [ ] `src/lib/xp.ts` imported in a client component compiles and does not pull in the DB driver
- [ ] Pushed and announced before T+0:50
