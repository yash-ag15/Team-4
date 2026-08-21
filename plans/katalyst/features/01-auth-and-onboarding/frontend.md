# 01 — Auth · frontend tasks (Samya)

Depends on Methika's UI kit for `Button`/`Input`/`Card`. Until it lands (~T+1:00), use plain
Tailwind and swap the primitives in afterwards — do not wait.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `/sign-in` — email + password, Google button, error state from `ApiClientError.fields` | `app/(auth)/sign-in/page.tsx` | 15 m |
| 2 | `/sign-up` — same, plus name | `app/(auth)/sign-up/page.tsx` | 10 m |
| 3 | `/onboarding` — cohort year (select 2024-2027), campus, city, phone, and a collapsed **"I'm a mentor"** section revealing the code field | `app/onboarding/onboarding-form.tsx` | 20 m |
| 4 | `AppShell` — sidebar/topbar, role-aware nav, XP + level chip, avatar menu with sign out | `components/app/AppShell.tsx` | 25 m |
| 5 | Route groups `(student)` and `(mentor)` with their `layout.tsx` session gates | `app/(student)/layout.tsx`, `app/(mentor)/layout.tsx` | 10 m |
| 6 | Landing page `/` — one screen: what Katalyst is, the AI Coach line, sign-in CTA | `app/page.tsx` | 15 m |

## Nav, by role

| Student | Mentor / Admin |
|---|---|
| Dashboard · Catalog · My Courses · Leaderboard · Badges | Dashboard · Review Queue (**with a pending count badge**) · My Courses · Students · (admin) Authoring · Reports |

The pending-review count in the mentor nav is a 30-second addition that makes the mentor
side feel like a real tool. Get it from `api.mentor.queue({ limit: 1 })`'s `total`.

## Form wiring

`error.fields` from the envelope maps straight onto react-hook-form:

```tsx
catch (e) {
  if (e instanceof ApiClientError && e.fields)
    for (const [k, msgs] of Object.entries(e.fields)) setError(k, { message: msgs[0] })
}
```

## Definition of done

- [ ] Both sign-in paths work locally and on the deployed URL
- [ ] Field-level validation errors render under the right inputs
- [ ] Loading state on every submit button; double-submit is impossible
- [ ] Onboarding cannot be skipped by typing `/dashboard`
- [ ] AppShell nav differs for student vs mentor
- [ ] Works at 375px wide — a judge will pick up a phone
