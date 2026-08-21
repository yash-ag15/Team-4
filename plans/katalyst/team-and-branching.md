# Team pairing & branch workflow

**Who does the frontend, who does the backend, on which branch, and when they sync.**

This is the file to open when you are about to `git switch -c`. Everyone reads it once at
T+0:00 and refers back to it before every new feature.

---

## 1. The pairing table

Every feature has **exactly one backend owner and exactly one frontend owner.** They are a
pair. They agree on nothing except the contract, and the contract is already written.

| # | Feature | Integration branch | **Backend** | **Frontend** | Gate |
|---|---|---|---|---|---|
| 00 | Foundation (contracts, schema, routes, migration) | `feature/foundation` | **Yash** + **Siddesh** | — | T+0:20 |
| 01 | Auth, roles & onboarding | `feature/auth` | **Samya** | **Samya** | A |
| 02 | Courses — catalog & player | `feature/courses` | **Siddesh** | **Samya** | A |
| 03 | Enrolment & progress | `feature/progress` | **Ayush** | **Methika** | A |
| 04 | Assessments & submissions | `feature/submissions` | **Ayush** | **Samya** | B |
| 05 | **AI Coach** ⭐ | `feature/ai-coach` | **Yash** | **Riya** | B |
| 06 | XP engine & ledger | `feature/xp` | **Yash** | **Methika** | A |
| 07 | Mentor review & final XP | `feature/mentor-review` | **Riya** | **Riya** | B |
| 08 | Gamification (check-in, streak, badges) | `feature/gamification` | **Makarand** | **Makarand** | C |
| 09 | Leaderboard | `feature/leaderboard` | **Makarand** | **Methika** | C |
| 10 | Student dashboard | `feature/dashboard` | **Ayush** | **Methika** | C |
| 11 | Mentor & admin dashboard, authoring UI, reports | `feature/admin` | **Siddesh** | **Makarand** | C |
| 12 | Notifications *(good-to-have)* | `feature/notifications` | **Makarand** | **Makarand** | post-C |
| 13 | Mentor AI assist *(good-to-have)* | `feature/ai-assist` | **Riya** | **Riya** | post-C |
| 14 | Teams *(good-to-have)* | `feature/teams` | **Siddesh** | **Methika** | post-C |

### Three features are solo verticals

`feature/auth`, `feature/gamification` and `feature/mentor-review` have the same person on
both halves. They still get **two branches** — `-front` and `-back` — because the front
half can be built against mocks while the back half is unfinished, and two small PRs are
easier to review than one big one. Same person, same workflow.

---

## 2. Everyone's load, at a glance

| Person | Backend branches | Frontend branches | Also |
|---|---|---|---|
| **Yash** | `foundation-back`, `xp-back`, `ai-coach-back` | — | Platform owner. Approves new dependencies. |
| **Riya** | `mentor-review-back`, `ai-assist-back` | `ai-coach-front`, `mentor-review-front`, `ai-assist-front` | Prompts & rubrics. Demo script. |
| **Siddesh** | `foundation-back`, `courses-back`, `admin-back`, `teams-back` | — | **Schema owner — the only person who runs `db:migrate`.** Seed data. |
| **Ayush** | `progress-back`, `submissions-back`, `dashboard-back` | — | |
| **Makarand** | `gamification-back`, `leaderboard-back`, `notifications-back` | `gamification-front`, `admin-front`, `notifications-front` | QA lead from T+4:15. |
| **Methika** | — | `xp-front`, `progress-front`, `leaderboard-front`, `dashboard-front`, `teams-front` | **Design system owner** — `globals.css`, `components/ui/*`. |
| **Samya** | `auth-back` | `auth-front`, `courses-front`, `submissions-front` | **Vercel & deploy owner.** AppShell + nav. |

> **Known imbalance, stated up front:** we have ~2.5 frontend people and ~4.5 backend
> people. That is why Makarand flips to frontend at T+2:30 and why Methika's design system
> is hard-timeboxed to 45 minutes. If frontend falls behind at Gate B, the cut list in
> `plan.md` Part 4 starts from the bottom — cut features, not quality.

---

## 3. Branch structure

```
main
 │
 ├── feature/foundation
 │      └── feature/foundation-back          (Yash + Siddesh — merged to main FIRST)
 │
 ├── feature/auth
 │      ├── feature/auth-front               Samya
 │      └── feature/auth-back                Samya
 │
 ├── feature/courses
 │      ├── feature/courses-front            Samya
 │      └── feature/courses-back             Siddesh
 │
 ├── feature/progress
 │      ├── feature/progress-front           Methika
 │      └── feature/progress-back            Ayush
 │
 ├── feature/submissions
 │      ├── feature/submissions-front        Samya
 │      └── feature/submissions-back         Ayush
 │
 ├── feature/ai-coach
 │      ├── feature/ai-coach-front           Riya
 │      └── feature/ai-coach-back            Yash
 │
 ├── feature/xp
 │      ├── feature/xp-front                 Methika
 │      └── feature/xp-back                  Yash
 │
 ├── feature/mentor-review
 │      ├── feature/mentor-review-front      Riya
 │      └── feature/mentor-review-back       Riya
 │
 ├── feature/gamification
 │      ├── feature/gamification-front       Makarand
 │      └── feature/gamification-back        Makarand
 │
 ├── feature/leaderboard
 │      ├── feature/leaderboard-front        Methika
 │      └── feature/leaderboard-back         Makarand
 │
 ├── feature/dashboard
 │      ├── feature/dashboard-front          Methika
 │      └── feature/dashboard-back           Ayush
 │
 └── feature/admin
        ├── feature/admin-front              Makarand
        └── feature/admin-back               Siddesh
```

### Flow

```
Frontend ──┐
           ├──→ feature/<feature> ──→ TEST ──→ main
Backend ───┘
```

### Rules

1. Nobody works directly on `main`. Nobody pushes directly to `main`.
2. Frontend and backend of a feature are developed on **separate branches**.
3. Both are merged into the feature's **integration branch** by PR.
4. The complete feature is **tested on the integration branch**.
5. Only after testing does `feature/<feature>` go to `main`.
6. Before starting a new feature, always get the latest `main`.

---

## 4. The commands

### First time

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_NAME>
git branch -a
```

### Start a new feature (one person per feature creates the integration branch)

```bash
git switch main
git pull origin main

git switch -c feature/courses
git push -u origin feature/courses
```

**Who creates the integration branch:** the **backend owner**, because they land first in
most features. Then they tell the frontend owner it exists.

### Frontend branch

```bash
git switch feature/courses
git pull origin feature/courses
git switch -c feature/courses-front

# work

git status
git add .
git commit -m "feat: catalog grid and course card"
git push -u origin feature/courses-front
```

PR: `feature/courses-front` → `feature/courses`

### Backend branch

```bash
git switch feature/courses
git pull origin feature/courses
git switch -c feature/courses-back

# work

git status
git add .
git commit -m "feat: course list and detail handlers"
git push -u origin feature/courses-back
```

PR: `feature/courses-back` → `feature/courses`

### Integration → main

```bash
git switch feature/courses
git pull origin feature/courses
npm run typecheck
npm run build
# walk the feature's Definition of Done in its README.md
```

PR: `feature/courses` → `main`

### Staying current

Both `-front` and `-back` rebase on their integration branch, **not** on main:

```bash
git switch feature/courses-front
git pull --rebase origin feature/courses
```

Once a day is not enough here — **rebase every 30 minutes.** In a six-hour build, a branch
that has not been rebased for an hour is already painful.

---

## 5. The foundation exception

`feature/foundation` is the one branch that goes to `main` **before** any other branch
exists, because every other branch is cut from `main` after it.

```
T+0:00  Yash + Siddesh -> feature/foundation-back
T+0:20  PR -> feature/foundation -> PR -> main       (fast-tracked, reviewed live on a call)
T+0:20  EVERYONE: git switch main && git pull origin main
T+0:20  Backend owners create their integration branches
```

**Nobody creates a feature branch before the foundation is on `main`.** If you do, you are
branching off a tree without contracts, and your first rebase will be a mess.

What foundation contains: all 11 contracts, `src/mocks/factories.ts`, every route stub,
`src/lib/xp.ts`, the four schema files, the regenerated `auth.ts`, one migration, and the
deleted NGO placeholder domain. After it merges, `/dev/api` is green and every endpoint
returns realistic mock data.

---

## 6. The sync contract — what each pair agrees on, and when

The pair does **not** design together. The contract is already written. What they do agree
on is a short, specific list, at a specific moment.

### The universal rule

> **Neither `-front` nor `-back` may edit `src/contracts/<feature>.ts`.**
>
> The contract is landed in `feature/foundation`. If it genuinely must change, the change
> is made on the **integration branch** by the backend owner, both sides rebase, and the
> pair posts `CONTRACT CHANGE: <feature>.<op> — <what> — <why>` in the channel.
>
> Adding an **optional output field** is the only free change. Renaming a field, changing a
> type, or making a field required is a breaking change and needs both owners' agreement.

### Per-pair handshakes

| Feature | Pair | Agree at | On what |
|---|---|---|---|
| 02 courses | Siddesh ↔ Samya | T+0:30 | Does `totalXp` include the 1.5× optional multiplier? (**Yes.**) Slug format for `/learn/[slug]`. |
| 03 progress | Ayush ↔ Methika | T+0:30 | The prop signature of `<SectionList>` — see §7. And that `completeLesson` returns `awards[]` so the UI can toast a whole chain from one request. |
| 04 submissions | Ayush ↔ Samya | T+1:30 | **One submission per assessment (PATCH to resubmit), or many?** Pick one, both sides match. Recommended: one. |
| 05 ai-coach | Yash ↔ Riya | T+0:30 | The `AiReviewPayload` fields Riya renders are exactly the fields Yash asks the model for. Riya's rubrics go to Siddesh for the seed by T+1:00. |
| 06 xp | Yash ↔ Methika | T+0:30 | Everything comes from `@/lib/xp` — no hardcoded level thresholds anywhere in `components/`. |
| 09 leaderboard | Makarand ↔ Methika | T+2:00 | `me` is returned even when the user is outside the top 20. Tie-break is `xp desc, userId asc`. |
| 10 dashboard | Ayush ↔ Methika | T+2:45 | Methika computes **nothing** — every number is a field on `progress.overview`. If she needs one, she asks Ayush to add it. |
| 11 admin | Siddesh ↔ Makarand | T+3:00 | The definition of "active this month" (any `xp_event` in the calendar month). Same number in the report and in the pitch. |

### The daily handshake, for every pair

At **T+1:30, T+3:00 and T+4:15** (the three gates), each pair spends 3 minutes together:

1. Backend: "my handler is live / still mock."
2. Frontend: "my page renders / here's what's missing."
3. Both: open the feature's `README.md` and tick the Definition of Done boxes out loud.

---

## 7. File boundaries — how the two branches avoid touching the same file

This is what makes a `-front` / `-back` merge into the integration branch a fast-forward
instead of a fight.

| Layer | Owned by | Directory |
|---|---|---|
| Contract | **foundation** (frozen) | `src/contracts/<feature>.ts` |
| Route stub | **foundation** (frozen shape) | `src/app/api/<feature>/**/route.ts` — the `-back` branch adds only the second argument |
| Business logic | `-back` | `src/server/<feature>.ts` |
| DB schema | **Siddesh only** | `src/db/schema/*` |
| Pages | `-front` | `src/app/(student)/**`, `src/app/(mentor)/**` |
| Components | `-front` | `src/components/**` |

### The one file boundary that needs saying out loud

`feature/courses-front` (Samya) owns the course player **page shell**.
`feature/progress-front` (Methika) owns the **progress components inside it**.

```
Samya   app/(student)/learn/[slug]/page.tsx      <- the shell, fetches, lays out
Methika components/learn/SectionList.tsx         <- the accordion
Methika components/learn/LessonItem.tsx          <- one lesson row, with the tick
Methika components/learn/MarkCompleteButton.tsx  <- calls progress.completeLesson
```

The page does:

```tsx
<SectionList sections={sections} enrollmentId={enrollment.id} />
```

**Agree that prop signature at T+0:30 and neither of you touches the other's file.** That
one conversation is worth more than any merge tool.

The same pattern applies to `components/game/*` (Makarand) and `components/ai/*` (Riya) —
they publish components, other people's pages mount them.

### Append-only files — never restructured, only added to

`src/contracts/index.ts` and `src/db/schema/index.ts`. Both are fully populated by
foundation, so in practice nobody touches them at all during the build. If you need a new
one, append **one line at the bottom**.

---

## 8. Merge schedule against the gates

| Time | What must be merged to `main` |
|---|---|
| **T+0:20** | `feature/foundation` |
| **T+1:30 — Gate A** | `feature/auth`, `feature/xp`, `feature/courses`, `feature/progress` |
| **T+3:00 — Gate B** | `feature/ai-coach`, `feature/submissions`, `feature/mentor-review` |
| **T+4:15 — Gate C** | `feature/gamification`, `feature/leaderboard`, `feature/dashboard`, `feature/admin` — **then FEATURE FREEZE** |
| **T+4:15 → T+5:00** | Only `fix/*` branches, straight to `main` by PR, one reviewer, no integration branch |
| **post-C** | `feature/notifications`, `feature/ai-assist`, `feature/teams` — only if the freeze checklist is green |

### PR review rules for six hours

- **One reviewer, five minutes, two questions:** does `npm run typecheck` pass, and does the
  handler output match the contract? Nothing else.
- **Do not review for style.** There is no time and it does not affect the demo.
- **Squash-merge**, always. A clean `main` history is worth the ten seconds.
- **A PR that has been open for more than 30 minutes is a blocker** — say so in the channel
  rather than waiting politely.

### Bug fixes after the freeze

```bash
git switch main
git pull origin main
git switch -c fix/leaderboard-me-row-null
# fix, commit, push
```

PR: `fix/*` → `main` directly. No integration branch, no ceremony. Makarand (QA) triages
everything as `P0 demo-path` / `P1 visible` / `P2 ignore`; only P0 and P1 get fixed.

---

## 9. The four rules that will actually save you

1. **Push every 30 minutes.** A branch that has not been pushed does not exist. If your
   laptop dies at T+4:00 with three hours of unpushed work, the team loses those hours too.
2. **`npm run typecheck` before every push.** A red `main` costs seven people at once, and
   at T+3:00 that is twenty-one person-minutes for one missing semicolon.
3. **Rebase on your integration branch every 30 minutes**, not on `main`.
4. **Never edit a file outside your row in §7 without pinging its owner.** Six hours does
   not survive a merge conflict in `globals.css`.
