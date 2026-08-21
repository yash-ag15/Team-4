import { z } from 'zod'
import { defineContract } from './_kit'

/**
 * Active-session management — the "someone else is already signed in as you" flow.
 *
 * Better Auth allows an unlimited number of concurrent sessions per user, which is what
 * lets two people who share an email and password both be signed in at once. These
 * endpoints surface those sessions and let the person who just signed in end the others.
 */

/** One row of the `session` table, reduced to what is safe to show a browser. */
export const ActiveSession = z.object({
  id: z.string(),
  /** Human label built from the user agent — "Chrome on Windows", not the raw string. */
  device: z.string(),
  ipAddress: z.string().nullable(),
  /** True for the session making this request. Never revocable from the list. */
  current: z.boolean(),
  createdAt: z.string(), // ISO string
  expiresAt: z.string(), // ISO string
})
export type ActiveSession = z.infer<typeof ActiveSession>

const MOCK_NOW = '2026-02-10T10:00:00.000Z'
const MOCK_EXPIRES = '2026-02-17T10:00:00.000Z'

const mockSessions: ActiveSession[] = [
  {
    id: 'session-current',
    device: 'Chrome on Windows',
    ipAddress: '203.0.113.10',
    current: true,
    createdAt: MOCK_NOW,
    expiresAt: MOCK_EXPIRES,
  },
  {
    id: 'session-other',
    device: 'Safari on iPhone',
    ipAddress: '198.51.100.24',
    current: false,
    createdAt: '2026-02-09T18:24:00.000Z',
    expiresAt: '2026-02-16T18:24:00.000Z',
  },
]

export const list = defineContract({
  method: 'GET',
  path: '/api/sessions',
  auth: 'user',
  summary: 'Every unexpired session for the signed-in user, current one flagged',
  input: z.object({}),
  output: z.object({
    sessions: z.array(ActiveSession),
    /** Count of sessions that are NOT this one — the number the conflict screen reacts to. */
    otherCount: z.number().int().nonnegative(),
  }),
  mock: () => ({ sessions: mockSessions, otherCount: 1 }),
})

export const revokeOthers = defineContract({
  method: 'POST',
  path: '/api/sessions/revoke-others',
  auth: 'user',
  summary: 'Sign out every OTHER device — the current session survives',
  input: z.object({}),
  output: z.object({ revoked: z.number().int().nonnegative() }),
  mock: () => ({ revoked: 1 }),
})

export const revoke = defineContract({
  method: 'DELETE',
  path: '/api/sessions/:id',
  auth: 'user',
  summary: 'Sign out one specific device',
  input: z.object({ id: z.string().min(1) }),
  output: z.object({ revoked: z.number().int().nonnegative() }),
  mock: () => ({ revoked: 1 }),
})
