import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { nextCookies } from 'better-auth/next-js'
import type { DBAdapterInstance } from 'better-auth/types'

import { db } from '@/db'
import * as schema from '@/db/schema'
import { withEmailEncryption } from '@/lib/auth-adapter'
import { sendEmail } from '@/lib/email'

/**
 * Self-declared profile role. This is NOT authorization — see `systemRole` below.
 * Adding a role here is a one-line change, then re-run `npx auth@latest generate`.
 */
export const SYSTEM_ROLES = ['student', 'mentor', 'admin'] as const
export type SystemRole = (typeof SYSTEM_ROLES)[number]

/**
 * The Drizzle adapter, wrapped so `user.email` is ciphertext at rest.
 *
 * Better Auth still hands the adapter a plaintext address and still gets one back —
 * every translation lives in `@/lib/auth-adapter`, which is why no other file in the app
 * (or any teammate's feature) has to know the column is encrypted.
 */
const baseAdapter = drizzleAdapter(db, { provider: 'pg', schema })
const encryptedDatabaseAdapter: DBAdapterInstance = (options) =>
  withEmailEncryption(baseAdapter(options))

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL, // required, or Google → redirect_uri_mismatch
  secret: process.env.BETTER_AUTH_SECRET,
  database: encryptedDatabaseAdapter,

  emailAndPassword: {
    enabled: true,
    // Leave off for the hackathon: with no verified Resend domain, requiring
    // verification locks out every teammate and every judge.
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  user: {
    additionalFields: {
      // authorization — server-owned. input:false is load-bearing (see AGENTS.md rule 6).
      systemRole: { type: [...SYSTEM_ROLES], required: false, defaultValue: 'student', input: false },

      // Katalyst profile — all optional, or Google sign-up breaks (AGENTS.md rule 5)
      cohortYear: { type: 'string', required: false, defaultValue: '' },
      campus: { type: 'string', required: false, defaultValue: '' },
      phone: { type: 'string', required: false, defaultValue: '' },
      city: { type: 'string', required: false, defaultValue: '' },

      // the onboarding gate — server-owned so it cannot be faked
      onboardingComplete: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },

  // Wired but inert until RESEND_API_KEY exists — sendEmail() falls back to console.
  emailVerification: {
    // Block body, not a concise arrow: sendEmail() returns an EmailResult, but Better Auth
    // types this callback as returning Promise<void>. Returning the result made the whole
    // config object literal fail to typecheck, which silently collapsed betterAuth()'s
    // generic inference — every `additionalFields` entry then vanished from
    // auth.$Infer.Session['user'] and from the client's signUp input.
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, subject: 'Verify your email', text: `Verify: ${url}` })
    },
  },

  plugins: [nextCookies()], // MUST be last
})

export type Session = typeof auth.$Infer.Session
export type User = (typeof auth.$Infer.Session)['user']
