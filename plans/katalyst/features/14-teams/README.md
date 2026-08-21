# 14 — Teams & team contribution

**Priority: GOOD-TO-HAVE — the first thing on the cut list.** Do not start before Gate C
(T+4:15) is green **and** features 12 and 13 are either done or consciously skipped.
**Owner:** Siddesh (backend) + Methika (frontend) · **Est:** 40 min

---

## Scope, deliberately tiny

**Ship:** a team leaderboard. Students belong to a team (assigned in the seed, not
self-service), and the leaderboard gets a third tab showing team totals.

**Do not ship:** team creation UI, invitations, team-specific challenges, per-team scoring
rules, contribution weighting. Every one of those is a rabbit hole and none of them changes
the demo.

---

## Schema (`src/db/schema/social.ts`)

```
teams:        id · name · cohortYear · emoji · createdAt
team_members: id · teamId -> teams · userId -> user   [unique(teamId, userId)]
```

**No team XP ledger.** Team XP is `sum(xp_events.amount)` joined through `team_members`.
Adding a second ledger is how the two disagree on stage.

## The contract

`GET /api/xp/leaderboard?scope=month&groupBy=team`

One extra optional input on the **existing** leaderboard contract, not a new endpoint.

```ts
export const TeamRow = z.object({
  rank: z.number().int(), teamId: z.string(), name: z.string(), emoji: z.string(),
  memberCount: z.number().int(),
  totalXp: z.number().int(),
  avgXp: z.number().int(),          // rank by this, not totalXp
  isMyTeam: z.boolean(),
  topContributor: z.object({ name: z.string(), xp: z.number().int() }).nullable(),
})
```

**Rank by `avgXp`, not `totalXp`.** Ranking by total just rewards the biggest team, which
every student notices immediately and which makes the whole board feel unfair.

`topContributor` is the "individual + team contributions" line from the brief, satisfied in
one field.

## Frontend

A third tab on `/leaderboard`, plus a small "Your team" card on the student dashboard:

```
🐅 Team Tigers          #2 of 6
   4,820 XP total · 1,205 avg
   Top: Priya Nair (2,340)
```

## Definition of done

- [ ] Teams seeded, every student in one
- [ ] Team tab on the leaderboard, ranked by average XP
- [ ] `isMyTeam` highlighted
- [ ] Top contributor shown per team
- [ ] Dashboard team card
- [ ] No second XP ledger anywhere
