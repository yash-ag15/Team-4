# 13 — Mentor AI assist (course authoring copilot)

**Priority: GOOD-TO-HAVE.** Do not start before Gate C (T+4:15) is green.
**Owner:** Riya (both halves) · **Branch:** `feature/ai-assist` · **Est:** 40 min
**Contract:** `src/contracts/ai-coach.ts` → `draftCourse` ·
**Server:** `src/server/ai-coach.ts` → `draftCourse()`

---

## Why it is worth doing if there is time

It is a **second AI moment** for the judges, on the side of the product they have not seen
yet, and it costs 40 minutes because the whole pipeline already exists. The mentor types
one line and gets a complete course skeleton — sections, lessons, and an assessment with a
real rubric — which they then edit.

It also closes a loop in the pitch: the AI helps the mentor *create* the work and helps the
student *do* it, and the human is in charge at both ends.

---

## The contract

`POST /api/ai-coach/draft-course` · `auth: 'user'` (mentor check in the server file)

```ts
input: z.object({
  topic: z.string().min(3).max(200),
  track: CourseTrack,
  difficulty: CourseDifficulty,
  sectionCount: z.coerce.number().int().min(2).max(6).default(4),
})

output: z.object({
  draft: z.object({
    title: z.string(), subtitle: z.string(), description: z.string(),
    coverEmoji: z.string(), category: CourseCategory,
    estimatedHours: z.number().int(),
    sections: z.array(z.object({
      title: z.string(), summary: z.string(), xpAward: z.number().int(),
      lessons: z.array(z.object({
        title: z.string(), kind: z.enum(['video','reading','link']),
        durationMin: z.number().int(), xpAward: z.number().int(),
        contentBody: z.string(),           // a real markdown outline, not a placeholder
      })),
    })),
    assessment: z.object({
      title: z.string(), kind: z.enum(['assignment','quiz','project','reflection']),
      prompt: z.string(),
      rubric: z.string(),                  // 4 criteria with point values
      maxScore: z.number().int(), xpAward: z.number().int(),
    }),
  }),
})
```

Same machinery as the review: `anthropic.messages.parse` +
`zodOutputFormat(CourseDraft)`, `effort: 'medium'`, `maxDuration = 60`, mock fallback with
no key. A different prompt and a different schema; nothing else is new.

---

## The flow

1. Mentor opens `/admin/courses/new`, types *"Introduction to data storytelling"*, picks
   track and difficulty.
2. **"Draft with AI"** → the skeleton appears in the wizard's normal editable fields.
3. Mentor edits anything, adjusts XP, clicks Create.
4. `courses.create` + `createSection` × N + `createLesson` × M + assessment create, in one
   handler.

**The draft is never saved directly.** It fills a form the mentor submits. Same principle as
the review: the AI proposes, the human commits.

---

## Definition of done

- [ ] "Draft with AI" fills the wizard with an editable, coherent course
- [ ] The generated rubric is specific enough that the AI Coach can grade against it
- [ ] The mentor can edit every field before saving
- [ ] Nothing is written until the mentor clicks Create
- [ ] No key → mock draft, no throw
- [ ] A student calling the endpoint gets `FORBIDDEN`
