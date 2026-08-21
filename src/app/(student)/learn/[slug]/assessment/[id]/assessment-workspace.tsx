'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ReviewCard } from '@/components/ai/review-card'
import type { AiReview } from '@/contracts/ai-coach'
import { api, ApiClientError } from '@/lib/api-client'

/**
 * FEATURE 04 — the assessment workspace. The screen the demo spends 90 of its 240
 * seconds on.
 *
 * THE ORDER IS THE POINT:
 *   attempt -> SUBMIT TO THE MENTOR -> "Ask the AI Coach" -> strengths, weaknesses and
 *   the XP the work might earn.
 *
 * The coach is deliberately gated behind submitting. It reports on work that is already
 * locked in, so its feedback cannot be farmed to iterate a draft up to a high predicted
 * score before any human sees it. The mentor still decides; the coach only advises.
 */

/** Matches `preview`'s contract input (`z.string().min(50)`). Keep the two in step. */
const MIN_CHARS = 50
const MAX_CHARS = 8000

type Source = 'live' | 'mock'

export type WorkspaceAssessment = {
  id: string
  title: string
  prompt: string
  /** Rendered as a checklist beside the editor — one line per criterion. */
  rubric: string
  maxScore: number
  xpAward: number
  courseTitle: string
  track: 'mandatory' | 'optional'
}

export function AssessmentWorkspace({ assessment }: { assessment: WorkspaceAssessment }) {
  const [content, setContent] = useState('')
  const [review, setReview] = useState<AiReview | null>(null)
  const [source, setSource] = useState<Source>('live')
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [askCount, setAskCount] = useState(0)
  /** Set once the attempt is with the mentor. Null means the coach stays locked. */
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const draftKey = `katalyst:draft:${assessment.id}`
  const reviewRef = useRef<HTMLDivElement>(null)

  // Draft autosave. A student who refreshes mid-assessment must not lose their work —
  // that is a trust bug, not a convenience one.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey)
      if (saved) setContent(saved)
    } catch {
      // Private window / storage disabled. The editor still works, it just will not persist.
    }
  }, [draftKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, content)
    } catch {
      /* ignore */
    }
  }, [draftKey, content])

  // A bare spinner for 10-25s reads as "broken". A counting timer reads as "working".
  useEffect(() => {
    if (!pending) return
    setElapsed(0)
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 250)
    return () => clearInterval(timer)
  }, [pending])

  const askCoach = useCallback(async () => {
    setPending(true)
    setError(null)
    try {
      if (!submissionId) throw new ApiClientError('FORBIDDEN', 'Submit to your mentor first.')
      const input = { submissionId }
      let result
      try {
        result = await api.aiCoach.review(input)
        setSource('live')
      } catch (e) {
        // No session yet (auth or DB not wired in this environment) — fall back to the
        // contract mock so the flow is still demoable. With a real session this branch
        // never fires and the page is live with no code change.
        if (e instanceof ApiClientError && e.code === 'UNAUTHORIZED') {
          result = await api.aiCoach.review(input, { mock: true })
          setSource('mock')
        } else {
          throw e
        }
      }
      setReview(result.review)
      setAskCount((n) => n + 1)
      // Scroll the review into view — on a laptop it renders below the fold otherwise.
      requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : 'The coach could not be reached. Your draft is saved.',
      )
    } finally {
      setPending(false)
    }
  }, [submissionId])

  /**
   * Send the attempt to the mentor. This is what unlocks the coach.
   *
   * The AI review is NOT fired automatically on submit: the student asks for it, so the
   * feedback arrives because they wanted it rather than as noise attached to submitting.
   */
  const submitToMentor = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      const { submission } = await api.submissions.create({
        assessmentId: assessment.id,
        content,
      })
      setSubmissionId(submission.id)
      // The previous review described a previous draft. Drop it so nothing stale shows.
      setReview(null)
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : 'Could not submit. Your draft is saved — try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }, [assessment.id, content])

  const chars = content.trim().length
  const tooShort = chars < MIN_CHARS
  const tooLong = chars > MAX_CHARS
  const busy = pending || submitting
  const canSubmit = !busy && !tooShort && !tooLong
  // The gate: no coach until the work is with the mentor.
  const canAsk = !busy && submissionId !== null

  const rubricLines = assessment.rubric.split('\n').filter((l) => l.trim())

  return (
    <div className="flex flex-col gap-8">
      {/* ---------------------------------------------------------------- prompt */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
            {assessment.courseTitle}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
            {assessment.maxScore} points
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-1 font-medium text-indigo-700">
            up to {assessment.xpAward} XP
            {assessment.track === 'optional' && ' · 1.5x optional'}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{assessment.title}</h1>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {assessment.prompt}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
        {/* -------------------------------------------------------------- editor */}
        <div className="flex flex-col gap-4">
          {/* The review sits ABOVE the editor on purpose: the student reads the feedback,
              then scrolls straight into the text they are fixing. */}
          {review && (
            <div ref={reviewRef} className="flex flex-col gap-2">
              {source === 'mock' && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <strong>Mock review.</strong> Sign-in and the database are not wired yet, so
                  this is the contract fixture rather than a live model call. The loop and the
                  UI are real; the words are canned.
                </p>
              )}
              {askCount > 1 && (
                <p className="text-xs text-gray-500">
                  Attempt {askCount} — the score moves as you improve the draft.
                </p>
              )}
              <ReviewCard review={review} />
            </div>
          )}

          <label htmlFor="submission" className="text-sm font-medium text-gray-700">
            Your answer
          </label>
          <textarea
            id="submission"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Write your answer here. You can ask the AI Coach for feedback as many times as you like before submitting."
            className="w-full resize-y rounded-lg border border-gray-300 p-4 text-sm leading-relaxed shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              {chars.toLocaleString()} characters
              {tooShort && ` · ${MIN_CHARS - chars} more before you can submit`}
              {tooLong && ` · ${(chars - MAX_CHARS).toLocaleString()} over the limit`}
            </span>
            <span>Draft saves automatically</span>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Submitting comes FIRST and is the primary action until it is done. */}
            <button
              type="button"
              onClick={submitToMentor}
              disabled={!canSubmit}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed ${
                submissionId
                  ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300'
              }`}
            >
              {submitting
                ? 'Submitting…'
                : submissionId
                  ? 'Re-submit to mentor'
                  : 'Submit for mentor review'}
            </button>

            {/* The coach only unlocks once the work is with the mentor. Disabled rather
                than hidden, with the reason in the tooltip, so the rule is visible. */}
            <button
              type="button"
              onClick={askCoach}
              disabled={!canAsk}
              title={
                submissionId
                  ? 'Ask the AI Coach to review your submitted work'
                  : 'Submit to your mentor first — the coach reviews submitted work, not drafts'
              }
              className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed ${
                submissionId
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300'
                  : 'border border-gray-300 text-gray-400'
              }`}
            >
              {pending
                ? `The coach is reading your work… ${elapsed}s`
                : review
                  ? 'Ask the AI Coach again'
                  : 'Ask the AI Coach'}
            </button>
          </div>

          {!submissionId && (
            <p className="text-xs text-gray-500">
              Submit your attempt to your mentor to unlock the AI Coach. It will show your
              strengths, your weaknesses and the XP this work might earn — your mentor still
              decides the final score.
            </p>
          )}

          {pending && (
            <p className="text-xs text-gray-500">
              Reviews take about 10-25 seconds. Your draft is already saved.
            </p>
          )}
        </div>

        {/* -------------------------------------------------------------- rubric */}
        {/* Showing the rubric next to the editor makes the AI review feel earned rather
            than magic — the student can see exactly what it is grading against. */}
        <aside className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            How this is judged
          </h2>
          <ul className="flex flex-col gap-2">
            {rubricLines.map((line) => (
              <li key={line} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                <span aria-hidden className="mt-0.5 text-gray-400">
                  ☐
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-gray-200 pt-3 text-xs text-gray-500">
            The AI Coach grades against these criteria only. Your mentor makes the final
            call on your score and XP.
          </p>
        </aside>
      </div>
    </div>
  )
}
