# 04 — Submissions · frontend tasks (Samya)

This page is where the demo spends 90 of its 240 seconds. Build it well.

| # | Task | Files | Est |
|---|---|---|---|
| 1 | `AssessmentCard` in the section accordion — title, kind chip, `maxScore`, **`xpAward`**, due date, and the student's status if already submitted | `app/(student)/learn/[slug]/assessment-card.tsx` | 15 m |
| 2 | `/learn/[slug]/assessment/[id]` — the prompt, the **rubric rendered as a visible checklist**, and a textarea | `app/(student)/learn/[slug]/assessment/[id]/page.tsx` | 30 m |
| 3 | **"Ask the AI Coach first"** button → `api.aiCoach.preview({ assessmentId, content })`. Renders Riya's `<ReviewCard>` inline, above the submit button. | `.../coach-preview.tsx` | 30 m |
| 4 | Submit → `api.submissions.create` → navigate to the submission detail with the review already attached | `.../submit-button.tsx` | 15 m |
| 5 | `/submissions` and `/submissions/[id]` — status ladder, AI review, mentor's decision when it lands | `app/(student)/submissions/*` | 30 m |
| 6 | Draft autosave to `localStorage`, keyed by `assessmentId` | `.../page.tsx` | 10 m |

## The preview loop — the thing judges remember

```
[ textarea: the student's draft ]

  ( Ask the AI Coach )        ( Submit )
       ^                          ^
   free, repeatable         final, notifies the mentor
```

After a preview returns, the page shows the predicted score ring, strengths, weaknesses and
action items **directly above the textarea the student is still editing.** They fix
something, ask again, and watch the number move. That is the loop. Make sure a second
preview visibly replaces the first — same position, brief transition, no scroll jump.

Rendering the rubric as a checklist next to the textarea is a small thing that makes the AI
review feel earned rather than magic: the student can see what it is grading against.

## States you must build

| State | What shows |
|---|---|
| Idle | Prompt, rubric, empty textarea, both buttons; **"Ask the AI Coach" disabled under 50 characters** |
| Previewing | Button becomes a progress state with real copy — *"The coach is reading your work…"* — and a 10-25 s expectation. Not a bare spinner. |
| Preview returned | `<ReviewCard>` above the textarea; submit button now says "Submit for mentor review" |
| Submitting | Disabled, "Saving and reviewing…" |
| Submitted | Redirect to `/submissions/[id]`, review attached, status chip `Awaiting mentor` |
| AI failed | Amber note: *"The coach couldn't review this right now — your work is saved and your mentor will see it."* **Never a red error.** |
| `changes_requested` | Mentor's note at the top, textarea prefilled, button says "Resubmit" |

## Definition of done

- [ ] Preview works against the mock from T+0:20 (no key needed)
- [ ] Preview can be run repeatedly and the displayed score changes with the content
- [ ] The 25-second wait has honest copy, not a spinner
- [ ] Submitting with the AI down still succeeds, with the amber note
- [ ] Draft survives a page refresh
- [ ] Readable at 375px — the textarea must not be 4 lines tall on a phone
