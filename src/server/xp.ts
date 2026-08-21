import { randomUUID } from 'node:crypto'
import { eq, inArray, sum } from 'drizzle-orm'

import { ApiError } from '@/contracts/_kit'
import { db } from '@/db'
import { xpEvents } from '@/db/schema'
import { levelFromXp } from '@/lib/xp'

/**
 * Feature 06 — the XP engine. Did not exist yet on this branch (only the pure calculators in
 * `src/lib/xp.ts` had landed), but Feature 07 (Mentor Review) cannot award XP without it, and
 * the whole codebase's docs — `plans/katalyst/features/06-xp-engine/backend.md` — already
 * specify this exact shape. Implemented here verbatim from that spec rather than improvised,
 * so it is the one canonical writer, not a second one.
 *
 * `awardXp` is the ONLY function in `src/` that inserts into `xpEvents`. Nothing else —
 * including `src/server/mentor.ts` — may import the `xpEvents` table directly.
 */

export type AwardXpInput = Omit<typeof xpEvents.$inferInsert, 'id' | 'createdAt' | 'note'> & {
  note?: string
}

export type XpAward = {
  awarded: boolean
  amount: number
  reason: string
  label: string
  newTotalXp: number
  newLevel: number
  leveledUp: boolean
}

export async function getTotalXp(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(xpEvents.amount) })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
  return Number(row?.total ?? 0)
}

/** Bulk form of `getTotalXp`, for list views (student rosters) — one query, not N. */
export async function getTotalXpForUsers(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {}
  const rows = await db
    .select({ userId: xpEvents.userId, total: sum(xpEvents.amount) })
    .from(xpEvents)
    .where(inArray(xpEvents.userId, userIds))
    .groupBy(xpEvents.userId)
  return Object.fromEntries(rows.map((r) => [r.userId, Number(r.total ?? 0)]))
}

export async function awardXp(input: AwardXpInput): Promise<XpAward> {
  if (!Number.isInteger(input.amount)) throw new ApiError('INTERNAL', 'XP must be an integer')

  const [row] = await db
    .insert(xpEvents)
    .values({ id: randomUUID(), ...input, note: input.note ?? '' })
    .onConflictDoNothing({ target: xpEvents.idempotencyKey })
    .returning()

  const totalXp = await getTotalXp(input.userId)
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
