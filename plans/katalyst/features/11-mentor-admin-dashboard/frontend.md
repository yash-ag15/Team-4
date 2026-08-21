# 11 — Mentor & admin · frontend tasks (Samya)

T+3:00 → T+4:15. Riya owns `/mentor/review/*`; you own everything else under `(mentor)`.

**Design Source:** Stitch Project `18128630861271238429` (*Mentor & Admin Management Suite*)  
**Design Theme:** *Lumina Academic System* (`#006481`/`#2596be` Primary, `#e8da4d`/`#f4e657` Accent, `#f7f9fb` Canvas)

---

## Task & Source File Matrix

| # | Task | Implemented Code File | Est | Status |
|---|---|---|---|---|
| 1 | `/mentor/dashboard` — pending reviews card, my courses card, needs-attention list, cohort XP | [`src/app/(mentor)/dashboard/page.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/app/(mentor)/dashboard/page.tsx) | 30 m | Done |
| 2 | `/mentor/students` — `DataTable`: name, cohort, XP, level, courses, avg progress, last active, flags, pending | [`src/app/(mentor)/students/page.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/app/(mentor)/students/page.tsx) | 30 m | Done |
| 3 | Flag chips with tooltips explaining the reason | [`src/components/mentor/flag-chip.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/components/mentor/flag-chip.tsx) | 10 m | Done |
| 4 | `/admin/reports` — filter bar + totals headline KPI cards + exportable table | [`src/app/(mentor)/admin/reports/page.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/app/(mentor)/admin/reports/page.tsx) | 35 m | Done |
| 5 | `/admin/users` — role dropdown calling `api.admin.setRole` | [`src/app/(mentor)/admin/users/page.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/app/(mentor)/admin/users/page.tsx) | 20 m | Done |
| 6 | Mentor & Admin Shared Shell & Navigation Layout | [`src/app/(mentor)/layout.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/app/(mentor)/layout.tsx) | 15 m | Done |
| 7 | Intervene & Nudge Action Helper | [`src/components/mentor/nudge-button.tsx`](file:///c:/Users/SAAMYA/OneDrive/Desktop/Team-4/src/components/mentor/nudge-button.tsx) | 10 m | Done |

---

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

---

## Definition of done

- [x] Mentor dashboard shows the pending count and links to the queue
- [x] Needs-attention rows show their reason
- [x] Students table sorts by XP and by last-active
- [x] Report filters change the URL and the data
- [x] Totals render as headline numbers, not table columns
- [x] Admin can change a role from the users table
- [x] A student navigating to `/mentor/dashboard` is redirected, not shown an error
- [x] Wide tables scroll inside their own container — the page never scrolls horizontally

