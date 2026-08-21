'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api-client'
import { FlagChip, type StudentFlag } from '@/components/mentor/flag-chip'
import { NudgeButton } from '@/components/mentor/nudge-button'

interface StudentRecord {
  userId: string
  name: string
  email: string
  image?: string | null
  cohortYear: string
  campus: string
  totalXp: number
  level: number
  coursesEnrolled: number
  coursesCompleted: number
  avgProgressPct: number
  lastActiveAt: string | null
  pendingSubmissions: number
  flags: StudentFlag[]
  reason?: string
}

const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    userId: 'st-1',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.org',
    image: null,
    cohortYear: '2026',
    campus: 'Mumbai Central',
    totalXp: 1450,
    level: 4,
    coursesEnrolled: 3,
    coursesCompleted: 1,
    avgProgressPct: 38,
    lastActiveAt: new Date(Date.now() - 9 * 86400 * 1000).toISOString(),
    pendingSubmissions: 0,
    flags: ['inactive'],
    reason: 'No learning activity in the last 9 days',
  },
  {
    userId: 'st-2',
    name: 'Nikita Rao',
    email: 'nikita.rao@example.org',
    image: null,
    cohortYear: '2026',
    campus: 'Bengaluru Tech',
    totalXp: 2100,
    level: 5,
    coursesEnrolled: 4,
    coursesCompleted: 2,
    avgProgressPct: 55,
    lastActiveAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    pendingSubmissions: 1,
    flags: ['overdue'],
    reason: 'Data Foundations assessment overdue by 2 days',
  },
  {
    userId: 'st-3',
    name: 'Aman Gupta',
    email: 'aman.gupta@example.org',
    image: null,
    cohortYear: '2025',
    campus: 'Delhi North',
    totalXp: 850,
    level: 3,
    coursesEnrolled: 2,
    coursesCompleted: 0,
    avgProgressPct: 12,
    lastActiveAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    pendingSubmissions: 0,
    flags: ['stalled'],
    reason: 'Progress stalled at 12% for 3 consecutive weeks',
  },
  {
    userId: 'st-4',
    name: 'Priya Nair',
    email: 'priya.nair@example.org',
    image: null,
    cohortYear: '2026',
    campus: 'Bengaluru Tech',
    totalXp: 3850,
    level: 7,
    coursesEnrolled: 4,
    coursesCompleted: 3,
    avgProgressPct: 92,
    lastActiveAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    pendingSubmissions: 1,
    flags: [],
  },
  {
    userId: 'st-5',
    name: 'Zoya Khan',
    email: 'zoya.khan@example.org',
    image: null,
    cohortYear: '2026',
    campus: 'Mumbai Central',
    totalXp: 2900,
    level: 6,
    coursesEnrolled: 3,
    coursesCompleted: 2,
    avgProgressPct: 78,
    lastActiveAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    pendingSubmissions: 1,
    flags: [],
  },
  {
    userId: 'st-6',
    name: 'Sneha Patel',
    email: 'sneha.patel@example.org',
    image: null,
    cohortYear: '2025',
    campus: 'Pune Main',
    totalXp: 1720,
    level: 5,
    coursesEnrolled: 3,
    coursesCompleted: 1,
    avgProgressPct: 48,
    lastActiveAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    pendingSubmissions: 1,
    flags: ['awaiting_resubmit'],
    reason: 'Changes requested on submission untouched for 4 days',
  },
]

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>(DEFAULT_STUDENTS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [flagFilter, setFlagFilter] = useState<'all' | 'at_risk' | StudentFlag>('all')
  const [sortBy, setSortBy] = useState<'xp' | 'last_active' | 'progress'>('xp')

  useEffect(() => {
    async function fetchStudents() {
      try {
        if ((api as any)?.mentor?.students) {
          const res = await (api as any).mentor.students({ limit: 100 })
          if (res?.students && res.students.length > 0) {
            setStudents(res.students)
          }
        }
      } catch {
        // Fallback to rich mock data
      }
    }
    fetchStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesQuery =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.campus.toLowerCase().includes(searchQuery.toLowerCase())

        if (!matchesQuery) return false

        if (flagFilter === 'all') return true
        if (flagFilter === 'at_risk') return s.flags.length > 0
        return s.flags.includes(flagFilter)
      })
      .sort((a, b) => {
        if (sortBy === 'xp') return b.totalXp - a.totalXp
        if (sortBy === 'progress') return b.avgProgressPct - a.avgProgressPct
        if (sortBy === 'last_active') {
          return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime()
        }
        return 0
      })
  }, [students, searchQuery, flagFilter, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span>Learner Progress & Triage</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Student Roster
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor learner XP milestones, active attention flags, and intervene directly with nudges.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-mono">Total Learners:</span>
            <span className="text-sm font-bold text-slate-900 bg-[#2596be]/10 text-[#2596be] px-2 py-0.5 rounded-lg">
              {students.length}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="w-full md:w-84 relative">
            <input
              type="text"
              placeholder="Search by student name, email, campus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-300/80 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value as any)}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-300/80 bg-white font-semibold text-slate-700 cursor-pointer hover:border-[#2596be] transition-colors focus:ring-2 focus:ring-[#2596be] focus:outline-none"
            >
              <option value="all">All Flags (Everyone)</option>
              <option value="at_risk">⚠️ Any At-Risk Flag</option>
              <option value="overdue">Overdue Only</option>
              <option value="inactive">Inactive 7d+ Only</option>
              <option value="stalled">Stalled Only</option>
              <option value="awaiting_resubmit">Awaiting Resubmit</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-300/80 bg-white font-semibold text-slate-700 cursor-pointer hover:border-[#2596be] transition-colors focus:ring-2 focus:ring-[#2596be] focus:outline-none"
            >
              <option value="xp">Sort: Highest XP ⚡</option>
              <option value="progress">Sort: Avg Progress 📈</option>
              <option value="last_active">Sort: Most Recently Active 🕒</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-4 py-4">Cohort / Campus</th>
                  <th className="px-4 py-4">Level & Total XP</th>
                  <th className="px-4 py-4">Avg Progress</th>
                  <th className="px-4 py-4">Last Active</th>
                  <th className="px-4 py-4">Flags</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading student roster...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No students found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.userId} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2596be]/20 via-[#38bdf8]/15 to-[#ec4899]/20 text-[#2596be] font-extrabold flex items-center justify-center text-xs border border-[#2596be]/25">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#2596be] transition-colors">{st.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{st.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Campus / Cohort */}
                      <td className="px-4 py-4 text-slate-600 text-xs">
                        <p className="font-semibold text-slate-800">{st.campus}</p>
                        <p className="text-slate-400 font-mono">Cohort {st.cohortYear}</p>
                      </td>

                      {/* Level & Total XP (Gold / Yellow Badge) */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-gradient-to-r from-[#e8da4d]/30 to-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs">
                          <span>⚡</span>
                          <span>{st.totalXp.toLocaleString()} XP</span>
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-mono font-medium">
                          <span className="px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 font-bold border border-pink-200/60">
                            Lvl {st.level}
                          </span>
                        </div>
                      </td>

                      {/* Avg Progress */}
                      <td className="px-4 py-4">
                        <div className="w-28 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-mono font-semibold">
                            <span className="text-slate-700">{st.avgProgressPct}%</span>
                            <span className="text-slate-400 font-normal">{st.coursesCompleted}/{st.coursesEnrolled} done</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#2596be] to-[#ec4899] rounded-full transition-all duration-300"
                              style={{ width: `${st.avgProgressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-4 text-xs font-mono text-slate-500">
                        {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Flags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {st.flags.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                              <span>✓</span> On Track
                            </span>
                          ) : (
                            st.flags.map((f) => <FlagChip key={f} flag={f} customReason={st.reason} />)
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <NudgeButton
                          studentName={st.name}
                          studentEmail={st.email}
                          studentId={st.userId}
                          reason={st.reason}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
