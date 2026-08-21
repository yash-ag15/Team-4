'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiClientError } from '@/lib/api-client'
import type { QueueSubmission, SubmissionStatus } from '@/contracts/mentor'

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-blue-50/90',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  ai_reviewed: {
    label: 'AI Reviewed',
    bg: 'bg-amber-50/90',
    text: 'text-amber-800',
    border: 'border-amber-200 shadow-2xs',
    dot: 'bg-[#e8da4d]',
  },
  mentor_approved: {
    label: 'Mentor Approved',
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  changes_requested: {
    label: 'Changes Requested',
    bg: 'bg-pink-50/90',
    text: 'text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
  },
}

export default function ReviewQueuePage() {
  const [submissions, setSubmissions] = useState<QueueSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const filter = statusFilter === 'all' ? undefined : (statusFilter as SubmissionStatus)
      const res = await api.mentor.queue({ status: filter })
      setSubmissions(res.submissions || [])
    } catch (err: any) {
      console.error('Failed to load review queue', err)
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Something went wrong while fetching submissions.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [statusFilter])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#e8da4d] animate-pulse" />
              <span>Assessment Evaluation</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Review Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review AI-evaluated student submissions and make the final decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-300/80 bg-white font-semibold text-slate-700 cursor-pointer hover:border-[#2596be] transition-colors focus:ring-2 focus:ring-[#2596be] focus:outline-none shadow-xs"
            >
              <option value="all">All Submissions</option>
              <option value="ai_reviewed">AI Reviewed (Pending)</option>
              <option value="mentor_approved">Mentor Approved</option>
              <option value="changes_requested">Changes Requested</option>
            </select>

            <button
              onClick={fetchQueue}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-sm">
            <div className="inline-block w-8 h-8 border-3 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium font-mono">
              Loading review queue submissions...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-lg font-bold text-rose-900 font-['Hanken_Grotesk']">
              Unable to load review queue
            </h3>
            <p className="text-sm text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && submissions.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#2596be]/15 to-[#ec4899]/15 text-[#2596be] rounded-2xl flex items-center justify-center text-2xl mx-auto border border-[#2596be]/20">
              🎉
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
              You&apos;re all caught up!
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are no student submissions waiting for your review matching the current filter.
            </p>
          </div>
        )}

        {/* Queue Table */}
        {!loading && !error && submissions.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-4 py-4">Course & Assessment</th>
                    <th className="px-4 py-4">AI Score</th>
                    <th className="px-4 py-4">Suggested XP</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const statusMeta = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.ai_reviewed
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2596be]/20 via-[#38bdf8]/15 to-[#ec4899]/20 text-[#2596be] font-extrabold flex items-center justify-center text-xs border border-[#2596be]/25">
                              {sub.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#2596be] transition-colors">
                                {sub.studentName}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{sub.studentEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Course & Assessment */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{sub.assessmentTitle}</p>
                          <p className="text-xs text-slate-500">{sub.courseTitle}</p>
                        </td>

                        {/* AI Score */}
                        <td className="px-4 py-4">
                          {sub.aiScore !== null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold bg-[#e8da4d]/25 text-slate-900 border border-amber-300/80">
                              <span>🤖</span>
                              <span>{sub.aiScore} / {sub.maxScore}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">Pending AI</span>
                          )}
                        </td>

                        {/* Suggested XP */}
                        <td className="px-4 py-4">
                          {sub.aiXpSuggested !== null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2596be]">
                              <span>⚡</span>
                              <span>{sub.aiXpSuggested} XP</span>
                              <span className="text-slate-400 font-normal">(/ {sub.xpAward} max)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>

                        {/* Submitted */}
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Action CTA */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/mentor/review/${sub.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white hover:from-[#1e7a9c] hover:to-[#ec4899] transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-[#2596be]/20 active:scale-95"
                          >
                            <span>Review</span>
                            <span>→</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
