import { and, desc, eq, gt, ne } from 'drizzle-orm'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import type * as sessions from '@/contracts/sessions'
import { db } from '@/db'
import { session } from '@/db/schema'

/**
 * Business logic for `sessions.*` — the concurrent-login guard.
 *
 * Better Auth keeps one row per signed-in device, so two people sharing one email and
 * password produce two rows. Nothing stops that by default, and nothing should: it is
 * also how one legitimate person uses a laptop and a phone. What this gives the person
 * signing in is *visibility plus a kill switch* — see the other devices, end them.
 */

export type ActiveSession = z.infer<typeof sessions.ActiveSession>

/**
 * User-Agent -> "Chrome on Windows".
 *
 * Deliberately crude. This label exists so a human can recognise "that's my phone" vs
 * "that isn't me"; it is not analytics, and a UA-parsing dependency for it would be
 * absurd. Order matters — Edge and Chrome both claim "Chrome", Safari claims nothing.
 */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'

  const browser =
    /edg\//i.test(userAgent) ? 'Edge'
    : /opr\/|opera/i.test(userAgent) ? 'Opera'
    : /chrome|crios/i.test(userAgent) ? 'Chrome'
    : /firefox|fxios/i.test(userAgent) ? 'Firefox'
    : /safari/i.test(userAgent) ? 'Safari'
    : 'Unknown browser'

  const os =
    /windows/i.test(userAgent) ? 'Windows'
    : /iphone|ipad|ipod/i.test(userAgent) ? 'iOS'
    : /android/i.test(userAgent) ? 'Android'
    : /mac os|macintosh/i.test(userAgent) ? 'macOS'
    : /linux/i.test(userAgent) ? 'Linux'
    : 'an unknown OS'

  return `${browser} on ${os}`
}

/**
 * Row -> wire. `token` is the one field that must never cross this boundary: it IS the
 * session cookie, so leaking it into a JSON response would hand any reader of that
 * response a working login. The list is keyed by `id` for exactly that reason.
 */
const toActiveSession = (
  row: typeof session.$inferSelect,
  currentSessionId: string | null,
): ActiveSession => ({
  id: row.id,
  device: describeDevice(row.userAgent),
  ipAddress: row.ipAddress ?? null,
  current: row.id === currentSessionId,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
})

/**
 * Every unexpired session for this user, newest first.
 *
 * The `expiresAt > now` filter is load-bearing: Better Auth does not delete expired rows
 * eagerly, so without it the conflict screen would keep warning about a laptop somebody
 * closed last month.
 */
export async function listSessions(
  userId: string,
  currentSessionId: string | null,
): Promise<{ sessions: ActiveSession[]; otherCount: number }> {
  const rows = await db
    .select()
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.createdAt))

  const mapped = rows.map((row) => toActiveSession(row, currentSessionId))
  return { sessions: mapped, otherCount: mapped.filter((s) => !s.current).length }
}

/**
 * End every session for this user except the caller's own.
 *
 * Scoped by `userId` first and only then by `id != current` — the ownership check is
 * what makes this safe. Deleting the row is what invalidates the other browser: Better
 * Auth resolves the cookie by looking the token up here, so a missing row is a signed
 * out device on its very next request.
 */
export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string | null,
): Promise<{ revoked: number }> {
  if (!currentSessionId) {
    // Without knowing which row is ours, this would sign the caller out too.
    throw new ApiError('UNAUTHORIZED', 'No active session to keep')
  }

  const deleted = await db
    .delete(session)
    .where(and(eq(session.userId, userId), ne(session.id, currentSessionId)))
    .returning({ id: session.id })

  return { revoked: deleted.length }
}

/** End one specific device. Refuses to end the caller's own — that is what sign-out is for. */
export async function revokeSession(
  userId: string,
  currentSessionId: string | null,
  sessionId: string,
): Promise<{ revoked: number }> {
  if (sessionId === currentSessionId) {
    throw new ApiError('VALIDATION_ERROR', 'Use sign out to end the session you are using')
  }

  const deleted = await db
    .delete(session)
    // `userId` in the predicate, not just `id`: without it, any signed-in user could
    // delete any session in the table by guessing an id.
    .where(and(eq(session.id, sessionId), eq(session.userId, userId)))
    .returning({ id: session.id })

  if (!deleted.length) throw new ApiError('NOT_FOUND', 'That session no longer exists')
  return { revoked: deleted.length }
}
