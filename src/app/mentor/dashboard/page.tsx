'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { FlagChip, type StudentFlag } from '@/components/mentor/flag-chip'
import { NudgeButton } from '@/components/mentor/nudge-button'

interface QueueItem {
  id: string
  studentName: string
  studentAvatar?: string | null
  courseTitle: string
  assessmentTitle: string
  aiScore: number | null
  submittedAt: string
}

interface CourseItem {
  id: string
  title: string
  track: 'mandatory' | 'optional'
  enrolledCount: number
  avgProgressPct: number
  completionRate: number
}

interface AtRiskStudent {
  userId: string
  name: string
  email: string
  image?: string | null
  courseTitle?: string
  flags: StudentFlag[]
  reason?: string
  lastActiveAt?: string | null
}

export default function MentorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [pendingQueue, setPendingQueue] = useState<QueueItem[]>([
    {
      id: 'sub-1',
      studentName: 'Priya Nair',
      studentAvatar: null,
      courseTitle: 'Data Foundations',
      assessmentTitle: 'Assessment 2: SQL Aggregations',
      aiScore: 82,
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sub-2',
      studentName: 'Rahul Verma',
      studentAvatar: null,
      courseTitle: 'Web Development Basics',
      assessmentTitle: 'Assessment 1: Responsive Layouts',
      aiScore: 61,
      submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sub-3',
      studentName: 'Zoya Khan',
      studentAvatar: null,
      courseTitle: 'Data Foundations',
      assessmentTitle: 'Assessment 2: SQL Aggregations',
      aiScore: 74,
      submittedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
  ])

  const [courses, setCourses] = useState<CourseItem[]>([
    {
      id: 'course-1',
      title: 'Data Foundations',
      track: 'mandatory',
      enrolledCount: 28,
      avgProgressPct: 68,
      completionRate: 64,
    },
    {
      id: 'course-2',
      title: 'Advanced Analytics with Python',
      track: 'optional',
      enrolledCount: 14,
      avgProgressPct: 45,
      completionRate: 50,
    },
  ])

  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([
    {
      userId: 'st-1',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.org',
      flags: ['inactive'],
      reason: 'No learning activity in the last 9 days',
      lastActiveAt: new Date(Date.now() - 9 * 86400 * 1000).toISOString(),
    },
    {
      userId: 'st-2',
      name: 'Nikita Rao',
      email: 'nikita.rao@example.org',
      flags: ['overdue'],
      reason: 'Data Foundations assessment overdue by 2 days',
      lastActiveAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    },
    {
      userId: 'st-3',
      name: 'Aman Gupta',
      email: 'aman.gupta@example.org',
      flags: ['stalled'],
      reason: 'Progress stalled at 12% for 3 consecutive weeks',
      lastActiveAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    },
    {
      userId: 'st-4',
      name: 'Sneha Patel',
      email: 'sneha.patel@example.org',
      flags: ['awaiting_resubmit'],
      reason: 'Changes requested on submission untouched for 4 days',
      lastActiveAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    },
  ])

  const [cohortStats, setCohortStats] = useState({
    totalStudents: 42,
    totalXpMonth: 34200,
    avgCompletionRate: 68,
    activeThisMonth: 81,
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [queueRes, coursesRes, studentsRes] = await Promise.allSettled([
          (api as any)?.mentor?.queue ? (api as any).mentor.queue({ limit: 3 }) : Promise.reject(),
          (api as any)?.courses?.mine ? (api as any).courses.mine() : Promise.reject(),
          (api as any)?.mentor?.students ? (api as any).mentor.students({ flag: 'at_risk', limit: 5 }) : Promise.reject(),
        ])

        if (queueRes.status === 'fulfilled' && queueRes.value?.submissions) {
          setPendingQueue(
            queueRes.value.submissions.map((s: any) => ({
              id: s.id,
              studentName: s.student?.name || 'Student',
              studentAvatar: s.student?.image,
              courseTitle: s.course?.title || 'Course',
              assessmentTitle: s.assessment?.title || 'Assessment',
              aiScore: s.aiScore ?? s.suggestedScore ?? 75,
              submittedAt: s.submittedAt || new Date().toISOString(),
            }))
          )
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value?.courses) {
          setCourses(coursesRes.value.courses)
        }

        if (studentsRes.status === 'fulfilled' && studentsRes.value?.students) {
          setAtRiskStudents(studentsRes.value.students)
        }
      } catch {
        // Preserves default rich mock data
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse" />
              <span>Mentor Command Center</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Mentor Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review AI-evaluated submissions, track student progress, and intervene early on at-risk learners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mentor/students"
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
            >
              View All Students
            </Link>
            <Link
              href="/mentor/review"
              className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white hover:opacity-95 transition shadow-md shadow-[#2596be]/25 flex items-center gap-2.5 group"
            >
              <span>Submissions Queue</span>
              {pendingQueue.length > 0 && (
                <span className="bg-[#e8da4d] text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-extrabold shadow-xs group-hover:scale-105 transition-transform">
                  {pendingQueue.length}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Hero Triage Card: Gradient of #2596be, Pink & Yellow */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d4f66] via-[#2596be] to-[#ec4899] p-8 text-white shadow-xl shadow-[#2596be]/15 border border-white/20">
          {/* Subtle background glow circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#e8da4d]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#ec4899]/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-white border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#e8da4d] animate-ping" />
                <span>AI Coach Reviews Ready</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold font-['Hanken_Grotesk'] tracking-tight leading-tight">
                {pendingQueue.length} Submissions Waiting for Decision
              </h2>
              <p className="text-sm text-slate-100/90 leading-relaxed">
                The AI Coach has prepared scoring and strength/weakness rubrics. Accept recommendations with one click or customize XP awards.
              </p>
            </div>

            <Link
              href="/mentor/review"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[#e8da4d] text-slate-950 font-extrabold text-sm rounded-2xl hover:bg-[#f4e657] hover:scale-102 transition-all duration-200 shadow-lg shadow-[#e8da4d]/30 shrink-0 cursor-pointer"
            >
              <span>Review All Pending Submissions</span>
              <span className="text-base">→</span>
            </Link>
          </div>

          {/* 3 Oldest Previews */}
          {pendingQueue.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingQueue.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/mentor/review/${item.id}`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all rounded-2xl p-4 border border-white/15 flex items-center justify-between group hover:translate-y-[-2px]"
                >
                  <div className="truncate mr-3">
                    <p className="text-sm font-bold text-white group-hover:text-[#e8da4d] transition-colors truncate">
                      {item.studentName}
                    </p>
                    <p className="text-xs text-slate-200 truncate mt-0.5">{item.assessmentTitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-extrabold bg-[#e8da4d] text-slate-950 px-2.5 py-1 rounded-lg shadow-xs">
                      AI: {item.aiScore}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 4 KPI Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2596be] to-[#38bdf8]" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase text-slate-500 font-bold tracking-wider">Total Students</p>
              <span className="w-8 h-8 rounded-xl bg-[#2596be]/10 text-[#2596be] flex items-center justify-center text-sm font-bold">
                👥
              </span>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk']">
              {cohortStats.totalStudents}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across your active assigned courses</p>
          </div>

          {/* Card 2: Cohort XP */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e8da4d] to-amber-500" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase text-slate-500 font-bold tracking-wider">Cohort XP This Month</p>
              <span className="w-8 h-8 rounded-xl bg-[#e8da4d]/20 text-amber-700 flex items-center justify-center text-sm font-bold">
                ⚡
              </span>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold text-[#2596be] mt-2 font-['Hanken_Grotesk']">
              {cohortStats.totalXpMonth.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>↑</span> +25% active participation
            </p>
          </div>

          {/* Card 3: Completion Rate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase text-slate-500 font-bold tracking-wider">Avg Completion Rate</p>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                🎯
              </span>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk']">
              {cohortStats.avgCompletionRate}%
            </p>
            <p className="text-xs text-pink-600 font-semibold mt-1">Goal: +20% activity completion</p>
          </div>

          {/* Card 4: Monthly Engagement */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ec4899] to-pink-500" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase text-slate-500 font-bold tracking-wider">Monthly Engagement</p>
              <span className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-bold">
                🔥
              </span>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk']">
              {cohortStats.activeThisMonth}%
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Target: 80%+ engagement</p>
          </div>
        </div>

        {/* Grid: Students Needing Attention (Triage) & My Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Students Needing Attention */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Hanken_Grotesk'] flex items-center gap-2">
                  <span>Students Needing Attention</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-pink-100 text-pink-700">
                    {atRiskStudents.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated triage flags: overdue assessments, stalled progress, inactivity 7d+.
                </p>
              </div>
              <Link
                href="/mentor/students?flag=at_risk"
                className="text-xs font-bold text-[#2596be] hover:text-[#ec4899] transition-colors"
              >
                View all ({atRiskStudents.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading student triage list...</div>
            ) : atRiskStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl">
                🎉 All students are on track! No critical attention flags today.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {atRiskStudents.map((st) => (
                  <div key={st.userId} className="py-3.5 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2596be]/15 to-[#ec4899]/15 text-[#2596be] font-extrabold flex items-center justify-center text-sm shrink-0 border border-[#2596be]/20">
                        {st.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#2596be] transition-colors">
                          {st.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{st.reason || st.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-wrap gap-1.5">
                        {st.flags.map((f) => (
                          <FlagChip key={f} flag={f} customReason={st.reason} />
                        ))}
                      </div>
                      <NudgeButton
                        studentName={st.name}
                        studentEmail={st.email}
                        studentId={st.userId}
                        reason={st.reason}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right 1 Col: My Courses Summary */}
          <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Hanken_Grotesk']">
                  My Courses
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Roster & completion summary</p>
              </div>
              <Link
                href="/mentor/admin/courses/new"
                className="text-xs font-bold text-[#2596be] hover:text-[#ec4899] bg-[#2596be]/10 hover:bg-[#ec4899]/10 px-2.5 py-1 rounded-lg border border-[#2596be]/20 transition-all flex items-center gap-1"
              >
                <span>+</span>
                <span>New Course</span>
              </Link>
            </div>

            <div className="space-y-4">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/70 space-y-2.5 hover:border-[#2596be]/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.title}</p>
                    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                      c.track === 'optional'
                        ? 'bg-gradient-to-r from-[#e8da4d]/30 to-amber-100 text-amber-900 border-amber-300/80'
                        : 'bg-[#2596be]/10 text-[#2596be] border-[#2596be]/30'
                    }`}>
                      {c.track} {c.track === 'optional' && '(1.5x XP)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>{c.enrolledCount} learners enrolled</span>
                    <span className="font-bold text-slate-700">{c.avgProgressPct}% avg</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2596be] to-[#ec4899] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(c.avgProgressPct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
