'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ReviewCard } from '@/components/ai/review-card'
import type { AiReview } from '@/contracts/ai-coach'
import { api, ApiClientError } from '@/lib/api-client'

/**
 * FEATURE 04 — the assessment workspace. The screen the demo spends 90 of its 240
 * seconds on.
 *
 * THE LOOP THIS EXISTS FOR:
 *   draft -> "Ask the AI Coach" -> predicted score + strengths/weaknesses -> improve ->
 *   ask again -> the number moves -> submit.
 *
 * The student iterates for free before the mentor ever sees it. Better work reaches the
 * mentor, and the student spent ten engaged minutes instead of abandoning.
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
      const input = { assessmentId: assessment.id, content }
      let result
      try {
        result = await api.aiCoach.preview(input)
        setSource('live')
      } catch (e) {
        // Until Samya's auth and Siddesh's Neon instance land there is no session, so a
        // live handler 401s. Fall back to the contract mock so the loop is demoable NOW.
        // The moment auth + DB exist this branch stops firing and the page goes live with
        // no code change — that is the whole point of the mock layer.
        if (e instanceof ApiClientError && e.code === 'UNAUTHORIZED') {
          result = await api.aiCoach.preview(input, { mock: true })
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
  }, [assessment.id, content])

  const chars = content.trim().length
  const tooShort = chars < MIN_CHARS
  const tooLong = chars > MAX_CHARS
  const canAsk = !pending && !tooShort && !tooLong

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
              {tooShort && ` · ${MIN_CHARS - chars} more before the coach can review it`}
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
            <button
              type="button"
              onClick={askCoach}
              disabled={!canAsk}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {pending
                ? `The coach is reading your work… ${elapsed}s`
                : review
                  ? 'Ask the AI Coach again'
                  : 'Ask the AI Coach'}
            </button>

            {/* Feature 04 backend is Ayush's. The button is deliberately present and
                disabled rather than absent, so the flow reads correctly in a demo and
                wiring it later is a one-line change. */}
            <button
              type="button"
              disabled
              title="Waiting on submissions API (Ayush, feature 04 backend)"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-400"
            >
              Submit for mentor review
            </button>
          </div>

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
