# XP and gamification — the rules

**Owner: Yash (`src/lib/xp.ts`, `src/server/xp.ts`) · Makarand (`src/server/gamification.ts`,
`src/components/game/*`) · Methika (the dashboard and leaderboard surfaces).**

Every number in this document is a constant in `src/lib/xp.ts`. Import it. Never retype a
magic number in a component — the demo dies the moment the dashboard says 50 XP and the
ledger says 75.

---

## 1. Why each mechanic exists

We are demoing against three metrics. Every mechanic below has to point at one, or it gets
cut.

| Metric | Mechanics that move it |
|---|---|
| **+25% active participation** | Daily check-in, streaks, leaderboard, challenges |
| **+20% activity completion** | Section XP, course completion bonus, progress bars, due-soon nudges, AI Coach preview (students iterate instead of abandoning) |
| **80%+ monthly engagement** | Streak freezes, badges, the AI Coach brief, optional-track 1.5x multiplier |

---

## 2. The ledger is the only truth

XP lives in `xp_events`. Nothing else. `enrollments.xpEarned` and any number on a dashboard
are **caches**, recomputed from the ledger, never incremented in place.

```ts
// src/server/xp.ts — the ONLY function that writes XP
export async function awardXp(input: {
  userId: string
  amount: number
  reason: XpReason
  sourceType: string
  sourceId: string
  courseId?: string | null
  awardedBy?: string | null
  note?: string
  idempotencyKey: string      // required — no default, no optional
}): Promise<{ awarded: boolean; amount: number }>
```

The insert is always:

```ts
const [row] = await db.insert(xpEvents).values({ ...input })
  .onConflictDoNothing({ target: xpEvents.idempotencyKey })
  .returning()
return { awarded: Boolean(row), amount: row?.amount ?? 0 }
```

`awarded: false` means "already granted" — the caller shows nothing, and a double-clicked
button is a no-op. **This one line is the difference between a working demo and a student
with 4,000 XP from refreshing a page.**

---

## 3. The award table

| Event | Amount | `reason` | `idempotencyKey` |
|---|---|---|---|
| Lesson complete | `lesson.xpAward` (default **10**) | `lesson_complete` | `lesson:<enrollmentId>:<lessonId>` |
| Section complete | `section.xpAward` (default **50**) | `section_complete` | `section:<enrollmentId>:<sectionId>` |
| Course complete | `course.xpBonusOnComplete` (default **100**) | `course_complete` | `course:<enrollmentId>` |
| Certificate course complete | **200** | `certificate` | `certificate:<enrollmentId>` |
| Assessment — mentor award | mentor's `finalXp`, clamped to `[0, assessment.xpAward]` | `assessment_award` | `submission:<submissionId>` |
| Daily check-in | **10** | `daily_checkin` | `checkin:<userId>:<YYYY-MM-DD>` |
| Streak milestone (every 7 days) | **50** | `streak_bonus` | `streak:<userId>:<milestone>` |
| Challenge complete | `challenge.xpReward` | `challenge_complete` | `challenge:<challengeId>:<userId>` |
| Badge earned | `badge.xpReward` (default **25**) | `badge_award` | `badge:<userId>:<badgeId>` |
| Mentor manual adjustment | any (may be negative) | `manual_adjust` | `manual:<uuid>` |

### The optional-track multiplier — our answer to "why would anyone do optional work?"

```ts
export const OPTIONAL_TRACK_MULTIPLIER = 1.5

export const applyTrack = (base: number, track: 'mandatory' | 'optional') =>
  track === 'optional' ? Math.round(base * OPTIONAL_TRACK_MULTIPLIER) : base
```

Applies to the **five course-derived rows** only: lesson, section, course, certificate,
assessment. It does **not** apply to check-in, streak, challenge or badge XP — those are
platform-wide, and multiplying them would let a student farm XP by touching an optional
course once.

**The UI must show it.** A catalog card for an optional course carries a `1.5x XP` chip; a
mandatory card carries a due-date chip. Never both. That contrast, on one screen, is the
whole "optional courses attract students" argument, and it takes ten minutes to build.

---

## 4. Levels

```ts
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
export const xpForLevel   = (level: number) => (level - 1) ** 2 * 100
export const xpToNextLevel = (xp: number) => xpForLevel(levelFromXp(xp) + 1) - xp
```

| Level | XP needed | Feels like |
|---|---|---|
| 1 | 0 | signed up |
| 2 | 100 | first section done |
| 3 | 400 | first course done |
| 4 | 900 | two courses + a graded assessment |
| 5 | 1,600 | a real term of work |
| 6 | 2,500 | |
| 7 | 3,600 | |

A square curve, so early levels come fast (the first three are reachable inside the demo)
and later ones take real work. Level names for the UI: **Explorer · Builder · Contributor ·
Specialist · Catalyst · Mentor-in-Training · Luminary**.

---

## 5. Streaks and the daily check-in

**Check-in is deliberately trivial.** One button, once per calendar day, 10 XP. It exists
for one reason: to make a student open the app on a day they were not going to. That is the
80%-monthly-engagement number.

```
checkIn(userId):
  today = <server date, IST>
  if daily_checkins has (userId, today) -> return { alreadyCheckedIn: true, streak }
  gap = today - streak.lastCheckinDate
  gap == 1 day  -> current += 1
  gap == 0      -> unreachable (unique index)
  gap  > 1 day  -> if freezesLeft > 0 and gap == 2: freezesLeft -= 1, current += 1
                   else: current = 1
  longest = max(longest, current)
  awardXp(10, key: checkin:<userId>:<today>)
  if current % 7 == 0: awardXp(50, key: streak:<userId>:<current>)
  insert daily_checkins(userId, today, streakAfter: current, xpAwarded)
```

**Streak freezes** (2 per user) forgive exactly one missed day. They are the difference
between a streak system that motivates and one that punishes — a student who misses a
Sunday and loses a 12-day streak stops coming back. Show them in the UI as
`🧊 2 freezes left`.

**Timezone:** use one fixed timezone for `today` (IST). A server computing UTC dates rolls
the streak over at 5:30 AM local, which will happen during the demo.

---

## 6. Badges

Seeded definitions, awarded by a single `checkBadges(userId)` function that runs after any
XP award. It is cheap: a handful of counts, then `awardXp` for anything newly earned (the
idempotency key makes re-running harmless).

| Badge | Emoji | Criteria | XP | Rarity |
|---|---|---|---|---|
| First Steps | 🌱 | complete your first lesson | 25 | common |
| First Submission | 📝 | submit your first assessment | 25 | common |
| Section Sweeper | 🧹 | complete 5 sections | 50 | common |
| Week Warrior | 🔥 | 7-day check-in streak | 50 | rare |
| Fortnight | ⚡ | 14-day check-in streak | 100 | epic |
| Course Complete | 🎓 | finish any course | 75 | rare |
| Certified | 🏅 | finish a certificate course | 150 | epic |
| Self-Driven | 🚀 | complete 3 optional courses | 150 | epic |
| Perfect Score | 💯 | a mentor awards full marks | 100 | epic |
| Top Ten | 🏆 | reach the top 10 of the monthly leaderboard | 100 | rare |
| Early Bird | 🌅 | submit an assessment 3+ days before its due date | 50 | rare |
| Comeback | 💪 | check in after a 7+ day absence | 50 | common |

Twelve is the right number: enough that a seeded student has a full-looking badge grid,
few enough to seed by hand in ten minutes.

---

## 7. Challenges

Short, visible, time-boxed goals. Four seeded, two global and two course-scoped.

| Challenge | `targetType` | Target | XP |
|---|---|---|---|
| Finish 10 lessons this week | `lessons_completed` | 10 | 150 |
| Earn 500 XP this month | `xp_earned` | 500 | 200 |
| Submit both Data Foundations assessments | `submissions` | 2 | 200 |
| Keep a 5-day streak | `checkin_streak` | 5 | 100 |

**Progress is computed on read**, from `xp_events` / `lesson_progress` / `submissions`
within `[startsAt, endsAt]` — never incremented on write. Slower and completely
drift-proof, which at our data volume is free. `challenge_progress` stores only
`completedAt`, so the completion award fires once.

---

## 8. Leaderboard

`GET /api/xp/leaderboard?scope=month|all&courseId=&limit=20`

```sql
select user_id, sum(amount) as xp
from xp_events
where created_at >= :since            -- month scope
  and (:courseId is null or course_id = :courseId)
group by user_id
order by xp desc
limit :limit
```

Return `{ rows: [{ rank, userId, name, image, xp, level }], me: { rank, xp, level } }` —
**`me` always, even when the student is not in the top 20.** A leaderboard that does not
show you your own rank demotivates everyone outside the top 20, which is most people.

Default scope is `month`, not all-time. A monthly reset means a student who joins in week
three can still get to the top, and it maps directly to the "80% monthly engagement"
metric.

Ship **global monthly** first. Per-course tab second. Team leaderboard only if Gate C is
green early.

---

## 9. What the student dashboard shows (Methika's surface)

Top to bottom, in priority order — build them in this order and stop wherever the clock
runs out:

1. **XP + level ring** — total XP, level name, progress to next level. The hero number.
2. **Daily check-in card** — one button, streak flame, freezes left. Above the fold.
3. **Continue learning** — the course with the most recent activity, its progress bar, and
   the exact next lesson.
4. **AI Coach brief** — `GET /api/ai-coach/brief`. Headline, focus areas, next actions.
5. **My courses** — a card per enrolment: cover emoji, title, progress bar, XP earned from
   it, mandatory due-date chip or optional `1.5x` chip.
6. **Due soon / overdue** — mandatory courses and assessments inside 7 days. Red if past.
7. **Badges** — earned in colour, unearned as grey silhouettes with their criteria. The
   grey ones do more motivational work than the earned ones.
8. **Challenges** — active, with a progress bar to target.
9. **Leaderboard peek** — my rank + the three people around me, linking to the full page.
10. **Yearly XP** — a small stat, `sum(amount) where createdAt >= Jan 1`. The problem
    statement asks for it by name; do not forget it.

---

## 10. Feedback moments — the cheap polish that reads as "gamified"

Worth ~30 minutes total, and they are most of what a judge registers as production quality:

- **XP toast on award** — `+50 XP · Section complete` sliding in from the corner.
- **Level-up modal** — full-width, the new level name, a single confetti burst. Fires once,
  keyed on the level changing between two renders.
- **Progress bar animates** from its old value to the new one, never snaps.
- **Streak flame grows** with the streak count (small / medium / large at 3 / 7 / 14).
- **Badge unlock** — the grey silhouette flips to colour.
- **Optional-course `1.5x` chip pulses** on the catalog card. One CSS animation.

All CSS and a `useState`. No animation library — see `AGENTS.md` rule 8.
