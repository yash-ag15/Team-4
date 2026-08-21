# Plan — Katalyst Gamified Learning Platform, 6 hours, 7 people

**Read `AGENTS.md` first.** This file is the build order and the clock.

---

## Part 0 — The one thing we are demoing

> Student submits work → **AI Coach reviews it**, names strengths and weaknesses, and says
> *"this is worth about 82/100, roughly 120 XP"* → **mentor sees the AI review in their
> queue and makes the final XP call** → the student's XP, level and leaderboard rank move.

Everything in this plan is scheduled around making that round-trip work by **T+3:00**.
Gamification, dashboards and the leaderboard are what make it *feel* like a product, but
they are built after the spine works, not before.

---

## Part 1 — The team

| Person | Primary role | Owns |
|---|---|---|
| **Yash** | Backend lead — AI Coach + XP engine | `ai-coach`, `xp`, `lib/ai.ts`, `lib/xp.ts` |
| **Riya** | AI Coach — prompts, rubric, mentor review | `mentor`, `lib/ai-prompts.ts`, `components/ai/*`, mentor review page |
| **Siddesh** | Database developer + course authoring | `db/schema/*`, migrations, seed, `courses`, `admin` |
| **Ayush** | Backend — enrolment, progress, submissions | `enrollments`, `progress`, `submissions` |
| **Makarand** | Backend gamification → frontend gamification → QA | `gamification`, `notifications`, `components/game/*` |
| **Methika** | Frontend — design system + student dashboard | `globals.css`, `components/ui/*`, dashboard, leaderboard |
| **Samya** | Frontend — auth, catalog, course player, mentor dashboard | `components/app/*`, auth pages, catalog, learn, mentor dashboard, **Vercel** |

Product-analyst duties (demo script, metric story, judge Q&A) sit with **Riya**.
QA duties (demo-path sweep, bug triage) sit with **Makarand** from T+4:15.

---

## Part 2 — Feature map and priority

| # | Feature | Priority | Backend | Frontend | Gate |
|---|---|---|---|---|---|
| 01 | Auth, roles & onboarding | **MUST** | Samya | Samya | A |
| 02 | Courses: catalog, authoring, sections, lessons | **MUST** | Siddesh | Samya | A |
| 03 | Enrolment & progress | **MUST** | Ayush | Samya | A |
| 04 | Assessments & submissions | **MUST** | Ayush | Samya | B |
| 05 | **AI Coach** | **MUST — the USP** | Yash | Riya | B |
| 06 | XP engine & ledger | **MUST** | Yash | Methika | A |
| 07 | Mentor review & final XP award | **MUST** | Riya | Riya | B |
| 08 | Gamification: check-in, streak, badges, challenges | **MUST** | Makarand | Makarand | C |
| 09 | Leaderboard | **MUST** | Makarand | Methika | C |
| 10 | Student dashboard | **MUST** | Ayush | Methika | C |
| 11 | Mentor & admin dashboard + reports | **MUST** | Siddesh | Samya | C |
| 12 | Notifications & escalations | good-to-have | Makarand | Makarand | post-C |
| 13 | Mentor AI assist (course authoring copilot) | good-to-have | Riya | Riya | post-C |
| 14 | Teams & team contribution | good-to-have | Siddesh | Methika | post-C |

Each has a folder: `plans/katalyst/features/<id>-<name>/` with `README.md` (the contract in
prose), `backend.md` and `frontend.md`.

---

## Part 3 — The clock

### T+0:00 → T+0:20 — FOUNDATION. Nobody else writes code yet.

Two people drive; the other five set up and watch.

**Yash** (10 min)
1. Delete the starter's placeholder domain: `src/contracts/projects.ts`, `tasks.ts`,
   `src/db/schema/projects.ts`, `tasks.ts`, `src/app/api/projects/`, `src/app/api/tasks/`,
   `src/app/dashboard/projects-list.tsx`. **None of the NGO fixture data ships.**
2. Land `src/contracts/*.ts` (all 11 must-have contracts), `src/mocks/factories.ts`
   (Katalyst fixtures), every `src/app/api/**/route.ts` stub, `src/lib/xp.ts`.
3. `npm run typecheck` → push `main`.

**Siddesh** (20 min, starts the moment Yash pushes)
1. Land `src/db/schema/*.ts` (courses, learning, engagement, ai).
2. Update `additionalFields` in `src/lib/auth.ts` → `npm run auth:generate`.
3. `npm run db:generate` → commit `drizzle/` → `npm run db:migrate` **once**.
4. Push. **From here on, only Siddesh runs `db:migrate`.**

**Samya** (parallel)
1. `npm i @google/genai`.
2. Vercel project, env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
   `GOOGLE_*`, `GEMINI_API_KEY`, `MENTOR_SIGNUP_CODE`), production Google callback URL.
3. **Deploy hello-world.** Post the URL in the channel.

**Everyone else**: clone, `npm i`, copy `.env.example` → `.env.local`, `npm run dev`, open
`http://localhost:3000/dev/api` and confirm every endpoint returns mock data. If `/dev/api`
is green, you are unblocked for the next 5 hours 40 minutes.

> **Exit condition:** `/dev/api` lists all 11 features, every endpoint returns schema-valid
> mock data, one migration has run, hello-world is deployed. **Do not start Wave 1 until
> this is true.** It is 20 minutes that buys 5 parallel hours.

---

### T+0:20 → T+1:30 — WAVE 1: the spine

Everything is mocked, so frontend and backend genuinely run in parallel.

| Person | Task |
|---|---|
| **Methika** | Design tokens in `globals.css` (dark-first, one accent, XP/level colour ramp, real type scale). shadcn install in one shot. `AppShell` is Samya's — build `StatCard`, `ProgressBar`, `XpBadge`, `LevelRing`, `EmptyState`, `LoadingState`, `ErrorState`, `MockBadge`, `DataTable`. **Push the kit by T+1:00** — three people are waiting on it. |
| **Samya** | `src/lib/auth.ts` additionalFields are Siddesh's; you own `/sign-in`, `/sign-up`, `/onboarding` (role + cohort + campus + optional mentor code), `middleware.ts` matchers for `(student)`/`(mentor)`, `AppShell` + role-aware nav, `src/server/users.ts` live. |
| **Siddesh** | `src/server/courses.ts` live: list/get catalog with `track` + `category` filters, course detail with sections + lessons, mentor/admin create + publish. |
| **Ayush** | `src/server/enrollments.ts` + `src/server/progress.ts` live: enrol (unique per student+course), my-enrolments, mark lesson complete → section rollup → calls `awardXp()`. |
| **Yash** | `src/lib/xp.ts` + `src/server/xp.ts` live: `awardXp()` with idempotency, `summary()` (total, yearly, level, next-level), `ledger()`. Then `src/lib/ai.ts` and `npm run ai:smoke` to prove a real call returns a valid `AiReview`. |
| **Riya** | `src/lib/ai-prompts.ts`: system prompt + rubric-aware review prompt + brief prompt. Then `components/ai/ReviewCard.tsx`, `StrengthsWeaknesses.tsx`, `PredictedScore.tsx` against the **mock** — no backend needed. |
| **Makarand** | `src/server/gamification.ts` live: daily check-in (one per calendar day, writes `xp_event`), streak roll-forward, badge award check, challenge progress. |

#### ✅ GATE A — T+1:30

Stop and verify together, on one machine, in five minutes:

- [ ] Sign up → onboarding → land on `/dashboard` as a student
- [ ] `/catalog` renders courses **from Postgres** (`source: 'live'`)
- [ ] Enrol on a course → row in `enrollments`
- [ ] Complete a lesson → row in `xp_events`, XP total goes up, refreshing does **not**
      double it
- [ ] `npm run typecheck` and `npm run build` both pass on `main`

**If a box is unchecked at T+1:30**, its owner drops everything else until it is checked.
Nothing in Wave 2 works without Wave 1.

---

### T+1:30 → T+3:00 — WAVE 2: the USP

| Person | Task |
|---|---|
| **Yash** | `src/server/ai-coach.ts` complete: `review()` (persists `ai_reviews`, denormalises onto `submissions`, moves status to `ai_reviewed`), `preview()` (no persist), `brief()`. `maxDuration = 60`, refusal guard, missing-key fallback to mock. **This is the highest-value code in the repo — protect Yash's time.** |
| **Riya** | `src/server/mentor.ts`: review queue (mentor's courses only), `decide()` → writes the `xp_event` with key `submission:<id>`, `finalXp` capped at `assessment.xpAward`. Then `/mentor/review` page: submission + AI review side by side, "Accept AI suggestion" one-click, override field, note. |
| **Ayush** | `src/server/submissions.ts` live: create (fires `ai-coach.review()` inline), list mine, get with review. |
| **Siddesh** | Course authoring backend: sections CRUD, lessons CRUD, assessments CRUD with `xpAward` + rubric. Then `src/db/seed.ts` rewritten for Katalyst fixtures. |
| **Samya** | `/learn/[slug]` course player: section accordion, lesson viewer, "Mark complete", assessment submit form with the **"Ask the AI Coach first"** button wired to `preview`. |
| **Methika** | `/dashboard` on live data: XP total + yearly XP, level ring, per-course progress bars, "continue where you left off", next deadline. |
| **Makarand** | Leaderboard backend (`xp.leaderboard` — all-time, this-month, per-course, rank of me). Then `components/game/*`: `CheckInCard`, `StreakFlame`, `BadgeGrid`, `ChallengeCard`. |

#### 🔴 GATE B — T+3:00 — THE ONE THAT MATTERS

Walk the whole path on the deployed URL:

- [ ] Student opens an assessment, drafts an answer, clicks **"Ask the AI Coach"** → gets
      strengths, weaknesses, action items and a **predicted score + predicted XP**
- [ ] Student submits → an `ai_reviews` row exists, submission status is `ai_reviewed`
- [ ] Mentor signs in, opens `/mentor/review`, sees the submission with the AI review
- [ ] Mentor accepts or overrides → `finalXp` written, exactly one `xp_event` created
- [ ] Student's dashboard XP, level and leaderboard rank all move

**If this is red at T+3:00, all seven people stop and fix it.** A polished dashboard with
no working AI Coach is a losing demo. A rough dashboard with a working AI Coach wins.

---

### T+3:00 → T+4:15 — WAVE 3: make it feel like a game

| Person | Task |
|---|---|
| **Makarand** | Wire check-in, streak, badges, challenges into the student dashboard and course pages. Daily check-in must be one click and visibly rewarding. |
| **Methika** | `/leaderboard`: top 20, my rank card, month/all-time toggle, per-course tab. Level-up toast. XP-gain animation on award. |
| **Samya** | `/mentor/dashboard`: their courses, roster with per-student progress, pending review count. `/admin/courses/new` authoring wizard. |
| **Siddesh** | Admin reports: filter by cohort, course, track, date range, status; totals + CSV-shaped table. Seed the demo data set. |
| **Ayush** | Progress aggregation endpoint for the dashboard (per-course % , completed/total lessons, next item). Fix whatever Gate B surfaced. |
| **Riya** | AI Coach brief on the dashboard ("Here's your week"). Nudge copy. Start the demo script. |
| **Yash** | Harden: rate-limit AI Coach per user, cache `brief` per user per hour, make every AI failure degrade to a friendly message rather than a 500. |

#### 🟡 GATE C — T+4:15 — **FEATURE FREEZE**

- [ ] Student dashboard: XP, yearly XP, level, streak, badges, per-course progress, AI brief
- [ ] Leaderboard live with real ranks
- [ ] Mentor dashboard: roster + review queue
- [ ] Admin: create a course end to end, run one filtered report
- [ ] Mandatory vs optional visibly different (due date badge vs **1.5x XP** badge)
- [ ] Certificate course shows a certificate badge on completion

**After T+4:15 nothing new merges.** Only bug fixes, seed data, and copy.

---

### T+4:15 → T+5:00 — INTEGRATION

- **Siddesh**: seed the demo data — 6 courses (3 mandatory, 3 optional, 1 certificate),
  ~20 sections, ~50 lessons, 6 assessments, 3 students with believable history, 2 mentors,
  1 admin. Believable history is what makes the dashboard and leaderboard look real.
- **Makarand (QA)**: walk the demo path three times on the deployed URL, on a phone too.
  File bugs as `P0 demo-path` / `P1 visible` / `P2 ignore`. Only P0 and P1 get fixed.
- **Everyone**: delete every `MockBadge` from the demo path. `?__mock` must not appear in
  any committed URL.
- **Samya**: final Vercel deploy, verify Google sign-in works on the production domain.
- **Yash**: `npm run build` clean, no console errors on the demo path.

---

### T+5:00 → T+5:30 — DEMO REHEARSAL

**Riya** owns the script. Four minutes, in this order:

1. **(20 s) The problem.** Activity scattered across platforms; engagement runs on manual
   WhatsApp follow-ups; existing progress data does not motivate anyone.
2. **(40 s) Student lands on the dashboard.** XP, level, streak, badges, next deadline,
   AI Coach brief. "This is what a student sees every morning — and the daily check-in is
   why they open it."
3. **(90 s) THE USP.** Open an assessment. Draft an answer. **"Ask the AI Coach."** Show
   the strengths, the weaknesses, the predicted score and predicted XP. Improve the answer.
   Ask again — the score moves. Submit.
4. **(60 s) Mentor side.** Review queue, AI review already attached, one click to accept,
   or override. "The AI does the reading. The mentor keeps the authority."
5. **(30 s) The loop closes.** Back on the student: XP jumped, level ring moved, rank
   climbed, badge unlocked.
6. **(20 s) The metrics.** Map each mechanic to +25% participation / +20% completion /
   80% monthly engagement.

Two full dry runs. Time them. Cut whatever makes it run over four minutes.

---

### T+5:30 → T+6:00 — BUFFER

Only if everything above is green, in this order:
1. **Notifications** (feature 12) — in-app bell, overdue + nudge rows. Highest demo value
   of the three.
2. **Mentor AI assist** (feature 13) — "draft a course outline for X" in the authoring
   wizard. Second-highest, and it is a second AI moment for the judges.
3. **Teams** (feature 14) — team leaderboard only. Skip team scoring rules.

If anything is red, this half hour is for fixing it. Ship a working demo, not a longer one.

---

## Part 4 — Cut list, decided in advance

When we fall behind (we will), cut in this order. Deciding now beats arguing at T+4:00.

1. Teams (14)
2. Mentor AI assist (13)
3. Notifications (12)
4. Admin report filters → just show the unfiltered table
5. Challenges → keep badges and streak
6. Per-course leaderboard tab → keep global
7. Google OAuth → email/password only (keep the button, hide it)
8. Course authoring UI → author via seed, keep the read path

**Never cut:** auth, catalog, enrolment, lesson completion, XP ledger, submissions,
**AI Coach**, mentor decision, student dashboard. That list is the demo.

---

## Part 5 — Risks and their defusals

| Risk | Defusal |
|---|---|
| Anthropic API key missing or rate-limited | `ai-coach.ts` falls back to `contract.mock()`. The demo still runs; it just is not live. Get the key in the first 20 minutes and test one real call before T+1:30. |
| AI review takes >25 s and the function times out | `maxDuration = 60`, `effort: 'medium'`, and the submission form shows a real progress state. If it is still slow, drop the history section from the prompt. |
| Two people run `db:migrate` and the shared DB diverges | Only Siddesh migrates. Everyone else uses a Neon branch if they need to experiment. |
| Merge conflict in `globals.css` or `AppShell` | Methika owns `globals.css` + `components/ui/*`; Samya owns `components/app/*`. Nobody else edits either. |
| Double XP on refresh | Every award goes through `awardXp()` with a unique `idempotencyKey`; the column has a unique index and the insert is `onConflictDoNothing`. |
| Contract drift | `defineRoute` re-validates handler output against the contract in dev and returns `CONTRACT_VIOLATION`. That error means the handler is wrong, not the framework. |
| Frontend blocked on backend | It is not. Every route serves mock data from minute 20. |
| Demo runs on mock data by accident | `<MockBadge>` on every data page during the build, and a `?__mock`/MockBadge sweep in the integration hour. |

---

## Part 6 — What already exists in this repo

The starter (`plans/hackathon-starter/`) gives us, unchanged:

- `src/contracts/_kit.ts` — `defineContract`, the envelope, `ApiError`
- `src/server/route.ts` — `defineRoute`: mock/live switch, input validation, auth gate,
  dev-mode output validation
- `src/lib/api-client.ts` — the typed `api.<feature>.<op>()` proxy
- `src/app/dev/api/page.tsx` — living API docs
- Better Auth + Drizzle + Neon wiring, `middleware.ts`, `/onboarding` gate

**We keep all of that and none of its data.** The NGO `projects`/`tasks` domain, the
`mockProjects`/`mockTasks`/`mockUsers` fixtures and the NGO `additionalFields` are deleted
in the first ten minutes and replaced with the Katalyst domain. Nothing from the starter's
fixtures is ever written to our database.
