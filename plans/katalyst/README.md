# Katalyst Gamified Learning Platform — plan

**6 hours · 7 people · one repo.**
**Status:** ready to implement · **Created:** 2026-08-21

> Student submits work → the **AI Coach reviews it**, names strengths and weaknesses, and
> predicts the score and XP → the **mentor makes the final call**.
> The AI advises. The mentor decides. That is the demo.

---

## Reading order

| File | What's in it | Who must read it |
|---|---|---|
| **[`../../AGENTS.md`](../../AGENTS.md)** | **Start here, every session.** Rules, ownership, conventions, XP numbers, the AI Coach contract. | Everyone, first |
| **[`plan.md`](./plan.md)** | The clock: hour-by-hour build order, the three gates, the cut list. | Everyone |
| [`schema.md`](./schema.md) | Every table, column, index and the seed plan. | Siddesh, then all backend |
| [`ai-coach.md`](./ai-coach.md) | The USP: prompts, model call, output schema, failure ladder. | Yash, Riya |
| [`xp-and-gamification.md`](./xp-and-gamification.md) | XP award table, levels, streaks, badges, challenges, leaderboard. | Yash, Makarand, Methika |
| [`features/`](./features/) | One folder per feature: `README.md` (the contract in prose) + `backend.md` + `frontend.md`. | Its two owners |

The starter's own docs (`../hackathon-starter/`) explain the contract layer, `defineRoute`
and the mock/live switch. Read `02-api-contract-layer.md` once if you have never seen this
pattern; the rest is history.

---

## The features

| # | Feature | Priority | Backend | Frontend | Gate |
|---|---|---|---|---|---|
| [01](./features/01-auth-and-onboarding/) | Auth, roles & onboarding | MUST | Samya | Samya | A |
| [02](./features/02-courses/) | Courses: catalog, authoring, sections, lessons | MUST | Siddesh | Samya | A |
| [03](./features/03-enrollment-and-progress/) | Enrolment & progress | MUST | Ayush | Samya | A |
| [04](./features/04-assessments-and-submissions/) | Assessments & submissions | MUST | Ayush | Samya | B |
| [05](./features/05-ai-coach/) | **AI Coach** | **MUST — the USP** | Yash | Riya | B |
| [06](./features/06-xp-engine/) | XP engine & ledger | MUST | Yash | Methika | A |
| [07](./features/07-mentor-review/) | Mentor review & final XP award | MUST | Riya | Riya | B |
| [08](./features/08-gamification/) | Check-in, streak, badges, challenges | MUST | Makarand | Makarand | C |
| [09](./features/09-leaderboard/) | Leaderboard | MUST | Makarand | Methika | C |
| [10](./features/10-student-dashboard/) | Student dashboard | MUST | Ayush | Methika | C |
| [11](./features/11-mentor-admin-dashboard/) | Mentor & admin dashboard + reports | MUST | Siddesh | Samya | C |
| [12](./features/12-notifications/) | Notifications & escalations | good-to-have | Makarand | Makarand | post-C |
| [13](./features/13-mentor-ai-assist/) | Mentor AI assist (authoring copilot) | good-to-have | Riya | Riya | post-C |
| [14](./features/14-teams/) | Teams & team contribution | good-to-have | Siddesh | Methika | post-C |

---

## The three gates

| Gate | Time | Must be true |
|---|---|---|
| **A** | T+1:30 | Sign in works · catalog renders live · enrolling writes a row · completing a lesson writes an `xp_event` and does not double on refresh |
| **B** | T+3:00 | **The USP round-trip.** Submit → AI review with strengths/weaknesses/predicted XP → mentor queue → mentor awards final XP → student XP rises. **If this is red, all seven people stop and fix it.** |
| **C** | T+4:15 | **FEATURE FREEZE.** Dashboards, leaderboard, streak, badges, challenges live. Nothing new merges after this. |

---

## The five decisions everything else follows from

1. **Contract-first.** One zod contract per endpoint produces the types, the validation, the
   mock, the client and the docs. Frontend and backend cannot drift, because there is one
   definition. Every must-have contract is already committed — that is why all 7 people
   start in parallel at minute 20.
2. **The AI advises, the mentor decides.** `ai_reviews` and `xp_events` are separate tables
   written by separate files. The AI Coach has no path to XP. This is the product's claim
   and its safety story at the same time.
3. **XP is a ledger, never a counter.** Every award goes through `awardXp()` with a unique
   `idempotencyKey` and `onConflictDoNothing`. Totals are always a `sum()`. A refresh, a
   double-click and a retry are all no-ops.
4. **Optional courses earn 1.5×.** Mandatory courses carry deadlines; optional courses
   carry a multiplier. One rule, visible on every catalog card, that makes self-driven
   learning the attractive choice.
5. **Ownership by column, not by consensus.** Each person owns one contract file, one
   server file, one route directory and their own pages. The two shared files
   (`contracts/index.ts`, `db/schema/index.ts`) are append-only. Seven people, effectively
   no merge conflicts.

---

## What we inherit from the starter, and what we throw away

**Keep:** `contracts/_kit.ts`, `server/route.ts` (mock/live switch, auth gate, dev-mode
output validation), `lib/api-client.ts`, `/dev/api`, the Better Auth + Drizzle + Neon
wiring, `middleware.ts`, the `/onboarding` gate, and the whole feature workflow.

**Delete in the first ten minutes:** the NGO placeholder domain — `contracts/projects.ts`,
`contracts/tasks.ts`, `db/schema/projects.ts`, `db/schema/tasks.ts`, `api/projects/`,
`api/tasks/`, `dashboard/projects-list.tsx`, and every fixture in `mocks/factories.ts`.
The NGO `additionalFields` (`ngoRole`, `organization`) are replaced by the Katalyst profile.

**None of the starter's fixture data is ever written to our database.** We keep the
structure and start the data from zero.
