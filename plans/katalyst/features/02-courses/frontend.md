# 02 — Courses · frontend tasks (Samya)

Build entirely against `api.courses.*` mocks from T+0:20. You will not need to change a line
when Siddesh lands the handlers.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `CourseCard` — cover emoji, title, subtitle, category chip, difficulty, `sectionCount · lessonCount · estimatedHours`, **`totalXp`**, and either a **due-date chip** (mandatory) or a **`1.5x XP` chip** (optional). Certificate courses get a 🏅. | `components/app/CourseCard.tsx` | 25 m |
| 2 | `/catalog` — grid of `CourseCard`, filter bar (track / category / difficulty / search), empty + loading + error states | `app/(student)/catalog/page.tsx` | 30 m |
| 3 | `/learn/[slug]` course detail — hero (title, mentor, XP, track, due date), section accordion with lessons, enrol CTA if not enrolled | `app/(student)/learn/[slug]/page.tsx` | 35 m |
| 4 | Lesson viewer — markdown for `reading`, embedded iframe for `video`, an external link card for `link`. "Mark complete" button (feature 03). | `app/(student)/learn/[slug]/lesson-view.tsx` | 30 m |
| 5 | **Course authoring wizard** (`/admin/courses/new`) — step 1 course meta, step 2 add sections, step 3 add lessons, step 4 publish. Plain forms, no drag-and-drop. | `app/(mentor)/admin/courses/new/*` | 45 m |

Task 5 is Gate C work — do it only after `/learn/[slug]` and the submission form (feature
04) are done. It is on the cut list.

## Filter-bar wiring

Filters go into the URL, not `useState`, so a filtered catalog is shareable and the back
button works:

```tsx
const params = useSearchParams()
const { courses, total } = await api.courses.list({
  track: params.get('track') ?? undefined,
  category: params.get('category') ?? undefined,
  q: params.get('q') ?? undefined,
})
```

## The chip rule — do not get this wrong, it is on stage

| Course | Chip |
|---|---|
| `track: 'mandatory'` | `Due 28 Aug` — red if within 3 days, amber within 7 |
| `track: 'optional'` | `1.5x XP` — accent colour, gently pulsing |
| `certificateEligible` | `🏅 Certificate` — in addition to the above |

Never show a due-date chip on an optional course; optional courses have `dueAt: null`.

## Definition of done

- [ ] Catalog renders in mock **and** live mode, with `<MockBadge source={...} />` while building
- [ ] Filters change the URL and survive a refresh
- [ ] Course detail shows sections and lessons in order
- [ ] Skeletons visible with `MOCK_DELAY_MS=1500`
- [ ] `?__mock=error` renders the error state, not a crash
- [ ] Empty catalog (`?q=zzzz`) renders `EmptyState`, not a blank grid
- [ ] Readable at 375px
