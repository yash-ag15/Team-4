# 03 — Enrolment & progress · frontend tasks (Samya)

| # | Task | Files | Est |
|---|---|---|---|
| 1 | Enrol button on course detail — optimistic, disabled while pending, "Already enrolled → Continue" if `CONFLICT` | `app/(student)/learn/[slug]/enroll-button.tsx` | 15 m |
| 2 | `/my-courses` — enrolment cards with progress bars, sorted by most recent activity | `app/(student)/my-courses/page.tsx` | 20 m |
| 3 | Section accordion with per-lesson completion ticks and a per-section progress bar | `app/(student)/learn/[slug]/section-list.tsx` | 25 m |
| 4 | **"Mark complete"** — calls `api.progress.completeLesson`, then fires a toast per returned award | `.../lesson-view.tsx` | 20 m |
| 5 | `XpToast` + `LevelUpModal`, driven by the `awards[]` array | `components/game/XpToast.tsx` (Makarand's dir — **ask him first**) | 25 m |
| 6 | "Continue where you left off" — deep-links to `nextLesson` | `.../continue-card.tsx` | 10 m |

Task 5 lives in Makarand's `components/game/` directory. Agree at T+1:30 who writes it —
suggested: **Makarand writes `XpToast`/`LevelUpModal`, Samya just calls them.** One owner,
no conflict.

## The award sequence — this is the moment that sells the demo

`completeLesson` returns `awards: XpAward[]`. Play them in order, 600 ms apart:

```tsx
const { awards } = await api.progress.completeLesson({ lessonId })
for (const [i, a] of awards.entries()) {
  setTimeout(() => {
    toast(`+${a.amount} XP · ${a.label}`)
    if (a.leveledUp) openLevelUp(a.newLevel)
  }, i * 600)
}
```

A single click producing `+10 XP · Lesson` → `+75 XP · Section complete` → `Level 3 —
Contributor` is worth more on stage than any static dashboard.

## Definition of done

- [ ] Enrol → the button becomes "Continue", no page reload
- [ ] Marking a lesson complete ticks it, moves the progress bar (**animated, not snapped**)
      and toasts every award
- [ ] Double-clicking "Mark complete" shows one set of toasts, not two
- [ ] `/my-courses` empty state links to the catalog
- [ ] Progress bars match the numbers the API returns — never computed twice on the client
