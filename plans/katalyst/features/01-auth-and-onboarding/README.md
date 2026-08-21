# 01 — Auth, roles & onboarding

**Priority:** MUST · **Gate:** A (T+1:30) · **Backend:** Samya · **Frontend:** Samya
**Contract:** `src/contracts/users.ts` · **Server:** `src/server/users.ts` ·
**Routes:** `src/app/api/users/*`

Samya owns both halves because auth is one vertical slice and splitting it costs more than
it saves.

---

## What it does

Email/password and Google sign-in, then an onboarding gate that collects the Katalyst
profile and assigns a role. Three roles: `student` (default), `mentor`, `admin`.

**The security rule that shapes everything:** `systemRole` is `input: false` in
`additionalFields`. It can never be set from a request body. A mentor is created either by
an admin, or by presenting `MENTOR_SIGNUP_CODE` at onboarding — which is checked
**server-side** in `src/server/users.ts` against `process.env`. The code never reaches the
client and is never echoed back.

---

## The contract

```ts
export const SYSTEM_ROLES = ['student', 'mentor', 'admin'] as const

export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  systemRole: z.enum(SYSTEM_ROLES),
  cohortYear: z.string(),
  campus: z.string(),
  phone: z.string(),
  city: z.string(),
  onboardingComplete: z.boolean(),
  createdAt: z.string(),          // ISO
})
```

| Op | Method | Path | Auth | Input | Output |
|---|---|---|---|---|---|
| `me` | GET | `/api/users/me` | user | `{}` | `{ user }` |
| `updateProfile` | PATCH | `/api/users/me` | user | `{ name?, cohortYear?, campus?, phone?, city? }` | `{ user }` |
| `completeOnboarding` | POST | `/api/users/onboarding` | user | `{ cohortYear, campus?, phone?, city?, mentorCode? }` | `{ user }` |

`completeOnboarding` sets `onboardingComplete: true` **server-side** and, if `mentorCode`
matches `process.env.MENTOR_SIGNUP_CODE`, sets `systemRole: 'mentor'`. Neither field is in
the input schema as something the client can assert.

---

## Auth config changes (`src/lib/auth.ts`)

Replace the starter's NGO fields:

```ts
additionalFields: {
  systemRole:         { type: [...SYSTEM_ROLES], required: false, defaultValue: 'student', input: false },
  cohortYear:         { type: 'string',  required: false, defaultValue: '' },
  campus:             { type: 'string',  required: false, defaultValue: '' },
  phone:              { type: 'string',  required: false, defaultValue: '' },
  city:               { type: 'string',  required: false, defaultValue: '' },
  onboardingComplete: { type: 'boolean', required: false, defaultValue: false, input: false },
}
```

Then `npm run auth:generate` → tell **Siddesh**, who runs `db:generate` + `db:migrate`.
**Samya does not migrate.** This handoff happens in the first 20 minutes, once.

---

## Routing and the role gate

```
src/app/(auth)/sign-in/page.tsx
src/app/(auth)/sign-up/page.tsx
src/app/onboarding/page.tsx        + onboarding-form.tsx
src/app/(student)/...              student surfaces
src/app/(mentor)/...               mentor + admin surfaces
```

`middleware.ts` is an **optimistic cookie check only** — matcher
`['/dashboard/:path*', '/catalog/:path*', '/learn/:path*', '/leaderboard/:path*', '/mentor/:path*', '/admin/:path*', '/onboarding']`.

The real gate is in each layout:

```ts
const session = await auth.api.getSession({ headers: await headers() })
if (!session) redirect('/sign-in')
if (!session.user.onboardingComplete) redirect('/onboarding')
// (mentor) layout:
if (session.user.systemRole === 'student') redirect('/dashboard')
```

Never call `getSession` in middleware — it is a DB round-trip on every request.

---

## Definition of done

- [ ] Sign up with email/password → onboarding → `/dashboard`
- [ ] Google sign-in works locally **and** on the deployed URL
- [ ] Onboarding collects cohort year, campus, city, phone
- [ ] `MENTOR_SIGNUP_CODE` promotes to mentor; a wrong code silently stays `student`
- [ ] A student hitting `/mentor/*` is redirected, not shown a 500
- [ ] `POST /api/users/onboarding` with `systemRole: 'admin'` in the body does **nothing**
- [ ] Sign out works from the AppShell menu
