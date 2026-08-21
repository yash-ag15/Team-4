# 01 — Auth · backend tasks (Samya)

| # | Task | Files | Est |
|---|---|---|---|
| 1 | Replace NGO `additionalFields` with the Katalyst profile (see README) | `src/lib/auth.ts` | 5 m |
| 2 | `npm run auth:generate`, verify `src/db/schema/auth.ts` regenerated, **hand off to Siddesh to migrate** | — | 5 m |
| 3 | Export `SYSTEM_ROLES` from `src/lib/auth.ts`; keep the `nextCookies()` plugin **last** | `src/lib/auth.ts` | 2 m |
| 4 | `toPublicUser(row)` mapper — coalesce every nullable `additionalFields` column, `createdAt.toISOString()` | `src/server/users.ts` | 10 m |
| 5 | `getMe(userId)` | `src/server/users.ts` | 5 m |
| 6 | `updateProfile(userId, input)` — `definedOnly()` so a partial patch never blanks a column | `src/server/users.ts` | 10 m |
| 7 | `completeOnboarding(userId, input)` — sets `onboardingComplete: true` server-side; if `input.mentorCode === process.env.MENTOR_SIGNUP_CODE && code !== ''` also sets `systemRole: 'mentor'`. **Strip `mentorCode` before the DB write.** | `src/server/users.ts` | 15 m |
| 8 | Wire the three handlers into `src/app/api/users/*/route.ts` | routes | 3 m |
| 9 | `middleware.ts` matcher for the new route groups | `src/middleware.ts` | 5 m |

## Notes

- The generated `additionalFields` columns are `.default(...)` but **not** `.notNull()`, so
  Drizzle types them nullable while the contract's `User` requires non-null. Coalesce every
  one of them in `toPublicUser`, or `defineRoute`'s dev-mode check correctly fires
  `CONTRACT_VIOLATION` on the first Google sign-up.
- An empty `MENTOR_SIGNUP_CODE` env var must **not** promote everyone who sends an empty
  string. Guard on both sides being non-empty.
- Never widen `updateProfile`'s input to include `systemRole` or `onboardingComplete`. That
  is the same privilege-escalation hole `input: false` closes on the sign-up route.

## Env vars to add to `.env.example`

```
MENTOR_SIGNUP_CODE=katalyst-mentor-2026
```
