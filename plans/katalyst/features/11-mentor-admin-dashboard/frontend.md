# 11 — Mentor & admin · frontend tasks (Samya)

T+3:00 → T+4:15. Riya owns `/mentor/review/*`; you own everything else under `(mentor)`.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `/mentor/dashboard` — pending reviews card, my courses card, needs-attention list, cohort XP | `app/(mentor)/dashboard/page.tsx` | 30 m |
| 2 | `/mentor/students` — `DataTable`: name, cohort, XP, level, courses, avg progress, last active, flags, pending | `app/(mentor)/students/page.tsx` | 30 m |
| 3 | Flag chips with tooltips explaining the reason | same | 10 m |
| 4 | `/admin/reports` — filter bar + totals cards + table | `app/(mentor)/admin/reports/page.tsx` | 35 m |
| 5 | `/admin/users` — role dropdown calling `api.admin.setRole` | `app/(mentor)/admin/users/page.tsx` | 20 m |
| 6 | Course authoring wizard — see `../02-courses/frontend.md` task 5 | | |

## The mentor dashboard's job is triage

Its top card is a single number and a single action:

```
┌────────────────────────────────────────┐
│  4 submissions waiting                 │
│                                        │
│  Priya Nair · Assessment 2 · AI: 82    │
│  Rahul Verma · Assessment 1 · AI: 61   │
│  Zoya Khan · Assessment 2 · AI: 74     │
│                                        │
│           [ Review all → ]             │
└────────────────────────────────────────┘
```

Then "needs attention", with the reason on every row:

```
⚠ Rahul Verma      no activity for 9 days          [ Nudge ]
⚠ Nikita Rao       Data Foundations overdue 2d     [ Nudge ]
⚠ Aman Gupta       stalled at 12% for 3 weeks      [ Nudge ]
```

The `[ Nudge ]` button writes a notification (feature 12) if that ships, and otherwise
opens a `mailto:` with prefilled copy. **Either version is fine** — what matters on stage is
that the mentor sees who to chase without opening a spreadsheet. Do not block on feature 12.

## The admin report

Totals **above** the table, as four big numbers:

```
   Students        Completion rate     Engagement (month)     Total XP
      42                 68%                  81%              54,210
```

Those are the metrics from the brief. Filters go in the URL so a filtered report is
shareable. A "Copy as CSV" button that puts tab-separated text on the clipboard is 10
minutes and reads as a real export.

## Definition of done

- [ ] Mentor dashboard shows the pending count and links to the queue
- [ ] Needs-attention rows show their reason
- [ ] Students table sorts by XP and by last-active
- [ ] Report filters change the URL and the data
- [ ] Totals render as headline numbers, not table columns
- [ ] Admin can change a role from the users table
- [ ] A student navigating to `/mentor/dashboard` is redirected, not shown an error
- [ ] Wide tables scroll inside their own container — the page never scrolls horizontally
