# 06 — XP · frontend tasks (Methika)

These are the primitives every other page uses. Ship them in the UI kit window
(T+0:20 → T+1:00) so Samya, Makarand and Riya can all import them.

| # | Component | What it shows | Est |
|---|---|---|---|
| 1 | `LevelRing` | Circular progress: level number in the middle, `xpIntoLevel / nextLevelAt` as the arc, level name below. SVG + `stroke-dasharray`, no library. | 25 m |
| 2 | `XpBadge` | `⚡ 1,240 XP` — inline, three sizes. Used in nav, cards and the leaderboard. | 10 m |
| 3 | `XpProgressBar` | A bar that **animates** from its previous value with a CSS transition, never snaps | 15 m |
| 4 | `StatCard` | Label + big number + optional delta. Used for total XP, yearly XP, streak, rank. | 15 m |
| 5 | `XpLedgerList` | Reason icon, label, course, `+amount`, relative time. Grouped by day. | 20 m |
| 6 | `XpBreakdown` | `byReason` and `byCourse` as simple stacked bars — no chart library | 20 m |

Import every number from `@/lib/xp`:

```tsx
import { levelFromXp, levelName, xpToNextLevel, OPTIONAL_TRACK_MULTIPLIER } from '@/lib/xp'
```

**Never hardcode a level threshold or an XP amount in a component.** The demo dies the
moment the dashboard says "50 XP to go" and the ledger says 75.

## Design notes

- **XP has one accent colour** and it is used for nothing else. When a student sees that
  colour anywhere in the app, it means XP.
- **Level colour ramp**: seven steps from cool to warm across `LEVEL_NAMES`. Define them as
  CSS custom properties in `globals.css` (`--level-1` … `--level-7`) so `LevelRing`,
  `XpBadge` and the leaderboard all agree.
- **Dark mode is the default look.** Gamified products read better dark, and it hides the
  rough edges of a six-hour build. Define the full light palette on bare `:root`, redefine
  under `@media (prefers-color-scheme: dark)`.
- Numbers use `toLocaleString()` — `1,240` not `1240`.

## Definition of done

- [ ] All six render from `api.xp.summary` mock data
- [ ] `LevelRing` is correct at level 1 (0 XP) and at a level boundary (exactly 400 XP)
- [ ] `XpProgressBar` animates on value change
- [ ] No hardcoded XP numbers — `grep -rn "100\|400\|900" src/components/ui/` shows only
      layout values
- [ ] Legible at 375px and in both colour schemes
