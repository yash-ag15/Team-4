# 09 — Leaderboard · frontend tasks (Methika)

T+2:30 → T+3:15, after the student dashboard's core is in.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `/leaderboard` page — scope tabs (This month / All time), optional course filter | `app/(student)/leaderboard/page.tsx` | 20 m |
| 2 | `LeaderboardTable` — medals for 1-3, avatar, name, cohort, level name, XP | `components/ui/LeaderboardTable.tsx` | 25 m |
| 3 | **Sticky "me" row** at the bottom, accent border, always visible | same | 15 m |
| 4 | `LeaderboardPeek` — my rank + two above + two below, for the dashboard | `components/ui/LeaderboardPeek.tsx` | 20 m |
| 5 | Empty / loading / error states | same | 10 m |

## The peek is worth more than the table

On the dashboard, this:

```
   12  Arjun Mehta      680 XP
   13  Nikita Rao       645 XP
 ▸ 14  You              620 XP        25 XP behind Nikita
   15  Rahul Verma      590 XP
   16  Zoya Khan        575 XP
```

"25 XP behind Nikita" is one line of arithmetic and it does more for engagement than the
whole top-10 table. Put it on the dashboard; link it to the full page.

## Details that make it look finished

- Numbers with `toLocaleString()`.
- Medals as emoji (🥇🥈🥉), not images.
- Avatar falls back to initials in the level colour when `image` is null — most seeded users
  will have no image.
- Row height stays constant between the medal rows and the numbered rows, or the top of the
  table visibly jumps.
- The scope tab is in the URL (`?scope=all`) so a refresh keeps it.

## Definition of done

- [ ] Renders from the mock with no backend
- [ ] "Me" row sticky and distinct, including when I am in the top 20 (then highlight in
      place and skip the sticky duplicate)
- [ ] Tabs change the data and the URL
- [ ] Peek shows the "X XP behind Y" line
- [ ] No layout shift between loading skeleton and loaded rows
- [ ] Works at 375px — drop the cohort column on narrow screens
