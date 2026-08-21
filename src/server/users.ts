import { eq } from 'drizzle-orm'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import type * as users from '@/contracts/users'
import { db } from '@/db'
import { user } from '@/db/schema'
import { decryptEmailSafe } from '@/lib/crypto'

/**
 * Business logic for the `users.*` contracts.
 *
 * Reads and writes the Better Auth `user` table from the GENERATED
 * `src/db/schema/auth.ts`. Regenerate with `npm run auth:generate` after changing
 * `additionalFields` in `src/lib/auth.ts` — never hand-edit that file.
 */

/**
 * Types come from the contract, never from a hand-written duplicate — that is what
 * keeps the handler and the wire format from drifting. `defineRoute` re-validates the
 * output against the same schema in dev.
 */
export type PublicUser = z.infer<typeof users.User>
export type UpdateProfileInput = z.infer<(typeof users.updateProfile)['input']>
export type CompleteOnboardingInput = z.infer<(typeof users.completeOnboarding)['input']>

/**
 * Row → wire mapper.
 *
 * Two mismatches to absorb, both real:
 *  1. `createdAt` is a Date in the row and MUST become an ISO string — the contract says
 *     `z.string()`, and a Date would not survive JSON intact.
 *  1b. `email` is stored encrypted (see `@/lib/crypto`). These queries go through Drizzle
 *     directly rather than the Better Auth adapter, so the adapter's decryption does not
 *     apply and it has to happen here — otherwise every profile response would ship
 *     `enc:v1:…` to the client.
 *  2. The `additionalFields` columns are generated as `.default(...)` but NOT `.notNull()`,
 *     so Drizzle types them nullable, while the contract's `User` requires non-null. Every
 *     one of them is coalesced here. Without this the route would return null for a fresh
 *     Google sign-up and `defineRoute`'s dev-mode check would (correctly) fire
 *     CONTRACT_VIOLATION.
 *
 * Nothing outside the contract's `User` shape may leak out — note `password` and the
 * OAuth tokens live on other tables, but keep this an explicit allow-list regardless.
 */
const toPublicUser = (row: typeof user.$inferSelect): PublicUser => ({
  id: row.id,
  name: row.name,
  email: decryptEmailSafe(row.email),
  image: row.image ?? null,
  systemRole: (row.systemRole as PublicUser['systemRole']) ?? 'student',
  cohortYear: row.cohortYear ?? '',
  campus: row.campus ?? '',
  phone: row.phone ?? '',
  city: row.city ?? '',
  onboardingComplete: row.onboardingComplete ?? false,
  createdAt: row.createdAt.toISOString(),
})

/** Drop `undefined` keys so a partial update never blanks a column it didn't mention. */
const definedOnly = <T extends object>(input: T) =>
  Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))

export async function getMe(userId: string): Promise<{ user: PublicUser }> {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (!row) throw new ApiError('NOT_FOUND', 'User not found')
  return { user: toPublicUser(row) }
}

/**
 * `input` is already narrowed by the contract to name/cohortYear/campus/phone/city.
 * Never widen it — `systemRole` and `onboardingComplete` must not be settable from a
 * request body. That is the same privilege-escalation hole that `input: false` closes on
 * the Better Auth sign-up route.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<{ user: PublicUser }> {
  const [row] = await db
    .update(user)
    .set({ ...definedOnly(input), updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning()
  if (!row) throw new ApiError('NOT_FOUND', 'User not found')
  return { user: toPublicUser(row) }
}

/**
 * The onboarding gate's write.
 *
 * `onboardingComplete: true` is set HERE, server-side, and is deliberately absent from the
 * contract's input — a client must never be able to mark itself onboarded (or un-onboarded)
 * by POSTing a flag.
 */
export async function completeOnboarding(
  userId: string,
  input: CompleteOnboardingInput,
): Promise<{ user: PublicUser }> {
  const { mentorCode, ...profileFields } = input

  // Read the role this account ALREADY has. Without this the write below is a demotion:
  // `systemRole` used to be re-derived from scratch on every submit, so an existing
  // mentor who re-ran onboarding without retyping the code — or any admin finishing
  // onboarding for the first time — was silently reset to 'student' and started landing
  // on /dashboard instead of /mentor/dashboard.
  const [existing] = await db
    .select({ systemRole: user.systemRole })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!existing) throw new ApiError('NOT_FOUND', 'User not found')

  // Older rows carry a legacy 'user' value from the starter schema; it means student.
  const currentRole: 'student' | 'mentor' | 'admin' =
    existing.systemRole === 'mentor' || existing.systemRole === 'admin'
      ? existing.systemRole
      : 'student'

  const codeAccepted =
    !!mentorCode && !!process.env.MENTOR_SIGNUP_CODE && mentorCode === process.env.MENTOR_SIGNUP_CODE

  // A valid code PROMOTES a student to mentor. It never changes an admin (that would be a
  // downgrade), and a missing or wrong code leaves the existing role untouched.
  const systemRole: 'student' | 'mentor' | 'admin' =
    codeAccepted && currentRole === 'student' ? 'mentor' : currentRole

  const [row] = await db
    .update(user)
    .set({
      ...definedOnly(profileFields),
      systemRole,
      onboardingComplete: true, // ← server-owned, never from `input`
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()
  if (!row) throw new ApiError('NOT_FOUND', 'User not found')
  return { user: toPublicUser(row) }
}
