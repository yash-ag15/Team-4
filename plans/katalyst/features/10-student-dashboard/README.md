# 10 — Student dashboard

**Priority:** MUST · **Gate:** C · **Backend:** Ayush (`progress.overview`) ·
**Frontend:** Methika · **Branch:** `feature/dashboard`
**Contract:** `src/contracts/progress.ts` → `overview` ·
**Page:** `src/app/(student)/dashboard`

---

## What it does

The screen a student opens every morning, and the second screen in the demo. It is an
**assembly job** — every number on it comes from an endpoint another feature already owns.
Methika composes; she does not compute.

| Widget | Data source | Owner |
|---|---|---|
| XP + level ring | `api.xp.summary` | Yash |
| Daily check-in + streak | `api.gamification.checkIn` / `.streak` | Makarand |
| AI Coach brief | `api.aiCoach.brief` | Yash / Riya |
| Continue learning | `api.progress.overview` → `continueWith` | Ayush |
| My courses + progress | `api.progress.overview` → `courses` | Ayush |
| Due soon / overdue | `api.progress.overview` → `dueSoon` | Ayush |
| Badges | `api.gamification.badges` | Makarand |
| Challenges | `api.gamification.challenges` | Makarand |
| Leaderboard peek | `api.xp.leaderboard` | Makarand |

---

## `progress.overview` — the one new endpoint

```ts
output: z.object({
  courses: z.array(z.object({
    enrollmentId: z.string(), courseId: z.string(), slug: z.string(),
    title: z.string(), coverEmoji: z.string(),
    track: CourseTrack, certificateEligible: z.boolean(),
    progressPct: z.number().int(),
    completedLessons: z.number().int(), totalLessons: z.number().int(),
    xpEarned: z.number().int(), totalXp: z.number().int(),
    dueAt: z.string().nullable(), status: z.string(),
    nextLesson: z.object({ id: z.string(), title: z.string(), sectionTitle: z.string() }).nullable(),
  })),
  continueWith: z.string().nullable(),        // enrollmentId of the most recent activity
  dueSoon: z.array(z.object({
    kind: z.enum(['course', 'assessment']), id: z.string(), title: z.string(),
    courseTitle: z.string(), dueAt: z.string(), overdue: z.boolean(), href: z.string(),
  })),
  totals: z.object({
    enrolled: z.number().int(), completed: z.number().int(),
    inProgress: z.number().int(), submissionsPending: z.number().int(),
  }),
})
```

One endpoint, one round trip, everything the middle of the page needs. Ayush builds it in
Wave 3 — until then Methika builds against the mock, which is why she is not blocked.

---

## Layout, in priority order

Build top to bottom and **stop wherever the clock runs out**. Everything below the fold is
optional; everything above it is the demo.

```
┌─────────────────────────────────────────────────────────────┐
│  Good morning, Priya          ⚡ 1,240 XP    Level 4 · Specialist│
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │ LEVEL    │  │  🔥 CHECK IN TODAY            +10 XP     │ │
│  │  RING 4  │  │  7-day streak · 🧊 2 freezes             │ │
│  │ 620/900  │  │  ● ● ● ● ● ● ● ○ ○ ○ ○ ○ ○ ○             │ │
│  └──────────┘  └──────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  🤖 YOUR COACH THIS WEEK                                    │
│  "You've cited sources in two submissions running — that     │
│   habit is sticking. Your weak spot is still recommendations │
│   that don't follow from the analysis."                      │
│   → Finish 'Working with data' (2 lessons)  → Retry Assess. 2│
├─────────────────────────────────────────────────────────────┤
│  CONTINUE   [📊 Data Foundations ▓▓▓▓▓▓░░░░ 62%  → Lesson 8] │
├─────────────────────────────────────────────────────────────┤
│  MY COURSES        │  DUE SOON                              │
│  3 cards w/ bars   │  ⚠ Assessment 2 — overdue 1d          │
│                    │  📅 Comms Essentials — due in 3d       │
├─────────────────────────────────────────────────────────────┤
│  BADGES (6/12)     │  CHALLENGES        │  LEADERBOARD      │
│  grid, greys       │  2 active + bars   │  peek, my rank    │
├─────────────────────────────────────────────────────────────┤
│  Total 1,240  ·  This year 1,240  ·  This month 340         │
└─────────────────────────────────────────────────────────────┘
```

**Yearly XP is required by the problem statement — do not forget it.** It is the last row.

---

## Definition of done

- [ ] Every widget renders from live data with no `MockBadge` by T+4:15
- [ ] Check-in card is above the fold on a 1366×768 laptop
- [ ] Course cards show mandatory due-date chips and optional `1.5x` chips
- [ ] Overdue items are visibly red
- [ ] Total, **yearly** and monthly XP all present
- [ ] A brand-new student with zero enrolments sees a useful empty state pointing at the
      catalog — **not a wall of zeroes.** Test this; a judge may sign up live.
- [ ] The page renders in under a second (one `overview` call, not nine)
- [ ] Works at 375px
