# 08 — Gamification · frontend tasks (Makarand)

T+2:00 → T+4:15. You own `src/components/game/*` — nobody else writes in that directory, so
Samya and Methika import from you.

| # | Component | What it shows | Est |
|---|---|---|---|
| 1 | `CheckInCard` | **Above the fold on the dashboard.** One big button, the streak flame, `🧊 2 freezes left`, and the last-14-days dot row. After checking in it becomes a satisfied state, not a disabled button. | 30 m |
| 2 | `StreakFlame` | Flame that grows at 3 / 7 / 14 days, with the count. Pure CSS. | 15 m |
| 3 | `BadgeGrid` | All 12. Earned in colour with `earnedAt`; unearned as **grey silhouettes with their criteria underneath**. | 25 m |
| 4 | `BadgeUnlockModal` | Silhouette flips to colour, one confetti burst, the XP awarded | 20 m |
| 5 | `ChallengeCard` | Title, description, progress bar to target, XP reward, time remaining | 20 m |
| 6 | `XpToast` | `+50 XP · Section complete`, slides in, stacks, auto-dismisses. **Samya calls this from `completeLesson`** — agree the API with her. | 25 m |
| 7 | `LevelUpModal` | Full-width, new level name, one confetti burst. Fires once per level change. | 20 m |

## `XpToast` API — agree this with Samya at T+1:30

```tsx
// components/game/toast-provider.tsx
export function useXpToast() {
  return (awards: XpAward[]) => void   // plays them 600ms apart, opens LevelUpModal on leveledUp
}
```

Samya's `completeLesson` handler and Riya's `decide` handler both call it with the
`awards[]` array they already get back. One provider mounted in the student layout.

## The check-in card is the most important 30 minutes here

It is the mechanic that maps directly to the 80%-monthly-engagement metric, and it is the
first thing a judge sees on the dashboard. Make it feel good:

- Big, warm, unmissable button before check-in
- On success: the flame grows, `+10 XP` toasts, the dot row gains today's dot, the button
  becomes `✓ Checked in — see you tomorrow`
- If a 7-day milestone just fired, a second toast: `+50 XP · 7-day streak!`

## Design constraints

- **No animation library** (`AGENTS.md` rule 8). CSS transitions and one keyframe for
  confetti. A dozen absolutely-positioned divs with staggered `animation-delay` is plenty.
- Import colours from Methika's tokens in `globals.css`. Do not invent new ones.
- Rarity colours: common grey · rare blue · epic purple · legendary gold.

## Definition of done

- [ ] All seven render from mock data with no backend
- [ ] Check-in works end to end and the second click is handled gracefully
- [ ] Unearned badges are visibly aspirational, not just missing
- [ ] `XpToast` plays a 3-award sequence in order without overlapping
- [ ] `LevelUpModal` fires exactly once, not on every re-render
- [ ] Everything works at 375px
- [ ] No `console.log` left in `components/game/`
