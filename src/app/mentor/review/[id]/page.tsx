'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import type {
  SubmissionDetail,
  AiReview,
  StudentContext,
} from '@/contracts/mentor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SubmissionReviewDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const submissionId = resolvedParams.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [aiReview, setAiReview] = useState<AiReview | null>(null)
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null)

  // Decision state
  const [finalScore, setFinalScore] = useState<number>(85)
  const [finalXp, setFinalXp] = useState<number>(100)
  const [mentorNote, setMentorNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [decisionResult, setDecisionResult] = useState<{
    status: string
    awardedXp: number
    note: string
  } | null>(null)

  const fetchDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.mentor.getForReview({ id: submissionId })
      setSubmission(res.submission)
      setAiReview(res.aiReview)
      setStudentContext(res.studentContext)

      if (res.aiReview) {
        setFinalScore(res.submission.finalScore ?? res.aiReview.score)
        setFinalXp(res.submission.finalXp ?? res.aiReview.suggestedXp)
      } else {
        setFinalScore(res.submission.finalScore ?? 75)
        setFinalXp(res.submission.finalXp ?? 50)
      }
      if (res.submission.mentorNote) {
        setMentorNote(res.submission.mentorNote)
      }
    } catch (err: any) {
      console.error('Failed to load submission review detail', err)
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to fetch submission review details.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [submissionId])

  const acceptAiSuggestion = () => {
    if (!aiReview) return
    setFinalScore(aiReview.score)
    setFinalXp(aiReview.suggestedXp)
    setMentorNote(
      `Accepted AI Coach recommendation (${aiReview.score}/${submission?.maxScore ?? 100}). Good execution on core requirements.`,
    )
  }

  const handleDecision = async (decision: 'approve' | 'request_changes') => {
    if (!submission) return

    // Validation
    if (decision === 'request_changes' && !mentorNote.trim()) {
      alert('Please provide a mentor note explaining what changes the student needs to make.')
      return
    }

    if (finalScore < 0 || finalScore > submission.maxScore) {
      alert(`Score must be between 0 and ${submission.maxScore}.`)
      return
    }

    if (finalXp < 0 || finalXp > submission.xpAward) {
      alert(`Final XP must be between 0 and ${submission.xpAward} XP.`)
      return
    }

    setIsSubmitting(true)
    setShowConfirmModal(false)

    try {
      const res = await api.mentor.decide({
        id: submission.id,
        decision,
        finalScore,
        finalXp,
        note: mentorNote,
      })

      setDecisionResult({
        status: res.status,
        awardedXp: res.awardedXp ?? res.finalXp ?? 0,
        note: res.note ?? mentorNote,
      })

      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              finalScore: decision === 'approve' ? finalScore : null,
              finalXp: decision === 'approve' ? finalXp : null,
              mentorNote,
            }
          : null,
      )
    } catch (err: any) {
      alert(err instanceof ApiClientError ? err.message : 'Failed to submit decision.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="inline-block w-10 h-10 border-3 border-[#2596be] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-slate-500">Loading student submission & AI evaluation...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-md text-center space-y-3">
          <span className="text-3xl">⚠️</span>
          <h3 className="text-lg font-bold text-rose-900 font-['Hanken_Grotesk']">
            Unable to Load Submission
          </h3>
          <p className="text-sm text-rose-700">{error || 'Submission not found.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Try Again
            </button>
            <Link
              href="/mentor/review"
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Back to Queue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isAlreadyDecided =
    submission.status === 'mentor_approved' || submission.status === 'changes_requested'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Link href="/mentor/review" className="hover:text-[#2596be] transition">
              Review Queue
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{submission.studentName}</span>
            <span>/</span>
            <span className="text-slate-600 truncate">{submission.assessmentTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mentor/review"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              ← Back to Queue
            </Link>
          </div>
        </div>

        {/* Status Notification Banner (If Already Decided) */}
        {isAlreadyDecided && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              submission.status === 'mentor_approved'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                : 'bg-pink-50/90 border-pink-300 text-pink-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {submission.status === 'mentor_approved' ? '✓' : '✍'}
              </span>
              <div>
                <p className="font-bold text-sm">
                  {submission.status === 'mentor_approved'
                    ? `Mentor Approved — ${submission.finalScore}/${submission.maxScore} (${submission.finalXp} XP Awarded)`
                    : 'Changes Requested — Awaiting Student Resubmission'}
                </p>
                {submission.mentorNote && (
                  <p className="text-xs mt-0.5 opacity-90 font-mono">
                    Note: &ldquo;{submission.mentorNote}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-white border border-current">
              Decision Recorded
            </span>
          </div>
        )}

        {/* Success Banner immediately after action */}
        {decisionResult && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#2596be] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base font-bold">
                ✓
              </div>
              <div>
                <p className="font-bold text-sm">
                  Decision Submitted: {decisionResult.status === 'mentor_approved' ? 'Approved' : 'Changes Requested'}
                </p>
                <p className="text-xs opacity-90">
                  {decisionResult.awardedXp > 0
                    ? `Awarded ${decisionResult.awardedXp} XP to ${submission.studentName}.`
                    : 'Student will be notified to revise and resubmit.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/review"
                className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-xs"
              >
                Back to Review Queue →
              </Link>
            </div>
          </div>
        )}

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANE: Student Work & Student Context (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Student Context Strip */}
            {studentContext && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2596be]/20 to-[#ec4899]/20 text-[#2596be] font-extrabold flex items-center justify-center text-sm border border-[#2596be]/25">
                    {submission.studentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{submission.studentName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{submission.studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <p className="text-slate-400 uppercase text-[10px]">Learner XP</p>
                    <p className="font-extrabold text-amber-900 bg-[#e8da4d]/30 px-2 py-0.5 rounded-lg">
                      ⚡ {studentContext.currentXp.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 uppercase text-[10px]">Progress</p>
                    <p className="font-extrabold text-[#2596be]">
                      {studentContext.courseProgressPct}%
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-slate-400 uppercase text-[10px]">Recent Scores</p>
                    <p className="font-bold text-slate-700">
                      {studentContext.recentScores.map((s) => s.score).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Student Submission Card */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase text-[#2596be] bg-[#2596be]/10 px-2.5 py-0.5 rounded-full">
                    {submission.courseTitle}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2 font-['Hanken_Grotesk']">
                    {submission.assessmentTitle}
                  </h2>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  Submitted {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>

              {/* Submission Body Content */}
              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 font-mono whitespace-pre-wrap overflow-x-auto">
                {submission.content}
              </div>
            </div>

          </div>

          {/* RIGHT PANE: AI Coach Review & Mentor Decision (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* AI Review Card */}
            {aiReview && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2596be] via-[#ec4899] to-[#e8da4d]" />
                
                {/* AI Review Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <h3 className="font-extrabold text-slate-900 font-['Hanken_Grotesk'] text-base">
                      AI Coach Evaluation
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {aiReview.confidence} confidence
                  </span>
                </div>

                {/* Score & XP Preview */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/70 text-center">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Suggested Score</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-0.5 font-['Hanken_Grotesk']">
                      {aiReview.score} <span className="text-xs text-slate-400 font-normal">/ {submission.maxScore}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Suggested XP</p>
                    <p className="text-2xl font-extrabold text-[#2596be] mt-0.5 font-['Hanken_Grotesk']">
                      ⚡ {aiReview.suggestedXp} <span className="text-xs text-slate-400 font-normal">/ {submission.xpAward}</span>
                    </p>
                  </div>
                </div>

                {/* AI Feedback Paragraph */}
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic">
                  &ldquo;{aiReview.feedback}&rdquo;
                </p>

                {/* Strengths */}
                {aiReview.strengths.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 font-mono uppercase">
                      <span>✓</span> Strengths ({aiReview.strengths.length})
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {aiReview.strengths.map((st: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/80">
                          <span className="text-emerald-500 shrink-0 font-bold">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {aiReview.weaknesses.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1 font-mono uppercase">
                      <span>⚠</span> Areas to Improve ({aiReview.weaknesses.length})
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {aiReview.weaknesses.map((wk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 bg-rose-50/50 p-2 rounded-lg border border-rose-100/80">
                          <span className="text-rose-500 shrink-0 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rubric Breakdown */}
                {aiReview.rubricBreakdown && aiReview.rubricBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-mono uppercase font-bold text-slate-500">Rubric Breakdown</p>
                    <div className="space-y-1.5">
                      {aiReview.rubricBreakdown.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div>
                            <p className="font-semibold text-slate-800">{r.criterion}</p>
                            <p className="text-[10px] text-slate-500">{r.comment}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-700 shrink-0">
                            {r.score}/{r.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Mentor Decision Panel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5 relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 font-['Hanken_Grotesk'] text-base flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Mentor Decision</span>
                </h3>

                {!isAlreadyDecided && aiReview && (
                  <button
                    type="button"
                    onClick={acceptAiSuggestion}
                    className="text-xs font-mono font-bold text-[#2596be] hover:text-[#ec4899] bg-[#2596be]/10 hover:bg-[#2596be]/15 px-2.5 py-1 rounded-xl transition cursor-pointer"
                  >
                    ⚡ Accept AI Suggestion
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Score & XP Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Final Score <span className="text-slate-400 font-normal">(/ {submission.maxScore})</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={submission.maxScore}
                      disabled={isAlreadyDecided || isSubmitting}
                      value={finalScore}
                      onChange={(e) => setFinalScore(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Final XP <span className="text-slate-400 font-normal">(/ {submission.xpAward} max)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={submission.xpAward}
                      disabled={isAlreadyDecided || isSubmitting}
                      value={finalXp}
                      onChange={(e) => setFinalXp(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-[#2596be] rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Mentor Feedback Textarea */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                    Mentor Feedback & Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback for the student..."
                    disabled={isAlreadyDecided || isSubmitting}
                    value={mentorNote}
                    onChange={(e) => setMentorNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none disabled:opacity-60"
                  />
                </div>

                {/* Action Buttons */}
                {!isAlreadyDecided ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDecision('request_changes')}
                      className="px-4 py-2.5 rounded-xl border border-pink-300 bg-pink-50/80 text-pink-700 hover:bg-pink-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      Request Changes
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowConfirmModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2596be] to-emerald-600 text-white font-bold text-xs hover:opacity-95 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Approve Submission'}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Link
                      href="/review"
                      className="block text-center w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                    >
                      ← Return to Review Queue
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 font-['Hanken_Grotesk']">
              Approve this submission?
            </h3>
            <p className="text-sm text-slate-600">
              The student will receive <strong className="text-[#2596be] font-mono">{finalXp} XP</strong> and their submission will be marked as approved.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono space-y-1 text-slate-700">
              <p>Score: <strong>{finalScore}/{submission.maxScore}</strong></p>
              <p>Awarded XP: <strong>{finalXp} XP</strong></p>
              {mentorNote && <p className="truncate">Note: {mentorNote}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision('approve')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2596be] hover:bg-[#1e7a9c] text-white shadow-sm transition"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
