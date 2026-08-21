'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api-client'
import type { AdminStudentRow, StudentFlag } from '@/contracts/admin'
import { FlagChip } from '@/components/mentor/flag-chip'
import { NudgeButton } from '@/components/mentor/nudge-button'

// ---------------------------------------------------------------------------
// Types & Detailed Student Performance
// ---------------------------------------------------------------------------

interface StudentDetailPerformance {
  student: AdminStudentRow
  enrolledCourses: {
    courseId: string
    courseTitle: string
    track: string
    progressPct: number
    enrolledAt: string
    completedAt: string | null
  }[]
  submissions: {
    id: string
    taskTitle: string
    status: string
    aiScore: number | null
    mentorScore: number | null
    finalXp: number | null
    submittedAt: string
  }[]
}

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<AdminStudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [flagFilter, setFlagFilter] = useState<'all' | 'at_risk' | StudentFlag>('all')
  const [campusFilter, setCampusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'xp' | 'progress' | 'last_active' | 'name'>('xp')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Selected Student for Inspector Slide-Over
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetailPerformance | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // -------------------------------------------------------------------------
  // Fetch Real Data from Backend
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadStudents() {
      setLoading(true)
      try {
        // Try admin listStudents first for full cohort, fallback to mentor students
        const res = await api.admin.listStudents({ limit: 100 }).catch(() => null)
        if (res?.students && res.students.length > 0) {
          setStudents(res.students)
        } else {
          const mentorRes = await api.mentor.students({ limit: 100 }).catch(() => null)
          if (mentorRes?.students && mentorRes.students.length > 0) {
            setStudents(mentorRes.students)
          }
        }
      } catch (err) {
        console.error('Failed to load student roster', err)
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  // Load individual student performance when selected
  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudentDetail(null)
      return
    }

    const currentId = selectedStudentId
    async function loadStudentDetail() {
      setLoadingDetail(true)
      try {
        const res = await api.admin.studentPerformance({ userId: currentId })
        if (res) {
          setSelectedStudentDetail(res as any)
        }
      } catch (err) {
        console.error('Failed to load student performance', err)
      } finally {
        setLoadingDetail(false)
      }
    }
    loadStudentDetail()
  }, [selectedStudentId])

  // -------------------------------------------------------------------------
  // Cohort Graphical Analytics Computations
  // -------------------------------------------------------------------------

  const totalStudents = students.length
  const totalCumulativeXp = useMemo(() => students.reduce((acc, s) => acc + s.totalXp, 0), [students])
  const avgXp = totalStudents > 0 ? Math.round(totalCumulativeXp / totalStudents) : 0
  const avgProgress = totalStudents > 0 ? Math.round(students.reduce((acc, s) => acc + s.avgProgressPct, 0) / totalStudents) : 0
  
  // Health Status Distribution
  const healthStats = useMemo(() => {
    let onTrack = 0
    let overdue = 0
    let inactive = 0
    let stalled = 0
    let awaiting = 0

    for (const s of students) {
      if (!s.flag) onTrack++
      else if (s.flag === 'overdue') overdue++
      else if (s.flag === 'inactive') inactive++
      else if (s.flag === 'stalled') stalled++
      else if (s.flag === 'awaiting_resubmit') awaiting++
    }

    const atRiskTotal = overdue + inactive + stalled + awaiting
    return { onTrack, overdue, inactive, stalled, awaiting, atRiskTotal }
  }, [students])

  // Progress Brackets for Distribution Chart
  const progressBrackets = useMemo(() => {
    let b0_25 = 0
    let b26_50 = 0
    let b51_75 = 0
    let b76_100 = 0

    for (const s of students) {
      if (s.avgProgressPct <= 25) b0_25++
      else if (s.avgProgressPct <= 50) b26_50++
      else if (s.avgProgressPct <= 75) b51_75++
      else b76_100++
    }
    return { b0_25, b26_50, b51_75, b76_100 }
  }, [students])

  // Distinct Campuses
  const campuses = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => {
      if (s.campus) set.add(s.campus)
    })
    return Array.from(set)
  }, [students])

  // Top Performers for Visual XP Leaderboard
  const topXpStudents = useMemo(() => {
    return [...students].sort((a, b) => b.totalXp - a.totalXp).slice(0, 5)
  }, [students])

  const maxStudentXp = useMemo(() => {
    return Math.max(1, ...students.map((s) => s.totalXp))
  }, [students])

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesQuery =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.campus.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.cohortYear.toLowerCase().includes(searchQuery.toLowerCase())

        if (!matchesQuery) return false
        if (campusFilter !== 'all' && s.campus !== campusFilter) return false

        if (flagFilter === 'all') return true
        if (flagFilter === 'at_risk') return Boolean(s.flag)
        return s.flag === flagFilter
      })
      .sort((a, b) => {
        if (sortBy === 'xp') return b.totalXp - a.totalXp
        if (sortBy === 'progress') return b.avgProgressPct - a.avgProgressPct
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'last_active') {
          return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime()
        }
        return 0
      })
  }, [students, searchQuery, flagFilter, campusFilter, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#2596be]/20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span>Real-Time Cohort Telemetry</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Student Roster & Graphical Analytics
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Live telemetry tracking student milestones, XP velocity, activity distribution, and triage intervention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                api.admin.listStudents({ limit: 100 })
                  .then((res) => { if (res?.students) setStudents(res.students) })
                  .finally(() => setLoading(false))
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span>
              <span>Refresh Live</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRAPHICAL KPI CARDS (4 Visual Meters) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Active Cohort */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2596be] to-[#38bdf8]" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Total Learners
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#2596be]/10 text-[#2596be] flex items-center justify-center text-sm font-bold">
                👥
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-['Hanken_Grotesk']">
                {totalStudents}
              </span>
              <span className="text-xs font-semibold text-emerald-600">Active in DB</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>On-Track: <strong>{healthStats.onTrack}</strong></span>
              <span className="text-pink-600 font-bold">At-Risk: {healthStats.atRiskTotal}</span>
            </div>
          </div>

          {/* Card 2: Cumulative XP & Average Velocity */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e8da4d] to-amber-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Cohort Total XP
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#e8da4d]/20 text-amber-700 flex items-center justify-center text-sm font-bold">
                ⚡
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-900 font-['Hanken_Grotesk']">
                {totalCumulativeXp.toLocaleString()}
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">XP</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Avg per Learner:</span>
              <strong className="text-slate-800">{avgXp.toLocaleString()} XP</strong>
            </div>
          </div>

          {/* Card 3: Average Completion Rate Meter */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Avg Progress %
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                🎯
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-['Hanken_Grotesk']">
                {avgProgress}%
              </span>
              <span className="text-xs text-slate-400">across courses</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2596be] via-emerald-400 to-[#ec4899] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(avgProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Triage & Risk Index */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ec4899] to-rose-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Attention Flags
              </span>
              <span className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-bold">
                ⚠️
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-pink-700 font-['Hanken_Grotesk']">
                {healthStats.atRiskTotal}
              </span>
              <span className="text-xs text-slate-500">learners needing support</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono font-semibold">
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">Overdue: {healthStats.overdue}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">Stalled: {healthStats.stalled}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRAPHICAL CHARTS & LEADERBOARD VISUALIZATION */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Visual XP Leaderboard Bars */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Hanken_Grotesk'] flex items-center gap-2">
                  <span>🏆</span>
                  <span>Cohort XP Mastery & Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top performing learners ranked by cumulative gamified XP milestones.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#2596be] bg-[#2596be]/10 px-2.5 py-1 rounded-xl">
                Top 5 Learners
              </span>
            </div>

            <div className="space-y-4">
              {topXpStudents.map((st, i) => {
                const percent = Math.round((st.totalXp / maxStudentXp) * 100)
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

                return (
                  <div key={st.id} className="space-y-1.5 group cursor-pointer" onClick={() => setSelectedStudentId(st.id)}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm w-5 text-center">{medal}</span>
                        <span className="font-bold text-slate-900 group-hover:text-[#2596be] transition-colors">
                          {st.name}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">({st.campus || 'Campus'})</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200">
                          Lvl {st.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className="text-amber-800">{st.totalXp.toLocaleString()} XP</span>
                        <span className="text-slate-400 font-normal">({st.avgProgressPct}%)</span>
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          i === 0
                            ? 'bg-gradient-to-r from-[#e8da4d] via-amber-400 to-amber-600'
                            : i === 1
                            ? 'bg-gradient-to-r from-[#2596be] to-[#38bdf8]'
                            : 'bg-gradient-to-r from-[#ec4899] to-pink-400'
                        }`}
                        style={{ width: `${Math.max(percent, 6)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chart 2: Progress Distribution & Health Spectrum */}
          <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Hanken_Grotesk'] flex items-center gap-2">
                <span>📈</span>
                <span>Progress Spectrum</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Learner distribution across completion stages.</p>
            </div>

            <div className="space-y-4">
              {/* Bracket 76-100% */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-emerald-700">76% - 100% (Near Completion)</span>
                  <span className="font-bold text-slate-800">{progressBrackets.b76_100} learners</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${totalStudents > 0 ? (progressBrackets.b76_100 / totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Bracket 51-75% */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-[#2596be]">51% - 75% (On Track)</span>
                  <span className="font-bold text-slate-800">{progressBrackets.b51_75} learners</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2596be] h-full rounded-full"
                    style={{ width: `${totalStudents > 0 ? (progressBrackets.b51_75 / totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Bracket 26-50% */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-amber-700">26% - 50% (Midway Active)</span>
                  <span className="font-bold text-slate-800">{progressBrackets.b26_50} learners</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${totalStudents > 0 ? (progressBrackets.b26_50 / totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Bracket 0-25% */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-pink-700">0% - 25% (Needs Nudge)</span>
                  <span className="font-bold text-slate-800">{progressBrackets.b0_25} learners</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-pink-500 h-full rounded-full"
                    style={{ width: `${totalStudents > 0 ? (progressBrackets.b0_25 / totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-2">
                Filter by Health Flag:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFlagFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    flagFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({totalStudents})
                </button>
                <button
                  type="button"
                  onClick={() => setFlagFilter('overdue')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    flagFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Overdue ({healthStats.overdue})
                </button>
                <button
                  type="button"
                  onClick={() => setFlagFilter('inactive')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    flagFilter === 'inactive' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Inactive ({healthStats.inactive})
                </button>
                <button
                  type="button"
                  onClick={() => setFlagFilter('stalled')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    flagFilter === 'stalled' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Stalled ({healthStats.stalled})
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SEARCH & FILTER CONTROLS BAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="w-full md:w-96 relative">
              <input
                type="text"
                placeholder="Search student name, email, campus, cohort..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm rounded-2xl border border-slate-300/80 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2596be] transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            </div>

            {/* Filter Dropdowns & View Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Campus Filter */}
              {campuses.length > 0 && (
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer"
                >
                  <option value="all">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer"
              >
                <option value="xp">Sort: Highest XP ⚡</option>
                <option value="progress">Sort: Avg Progress 📈</option>
                <option value="last_active">Sort: Recently Active 🕒</option>
                <option value="name">Sort: Alphabetical (A-Z)</option>
              </select>

              {/* View Switcher: Grid vs Table */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'grid' ? 'bg-white text-[#2596be] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎴</span>
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-[#2596be] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: GRAPHICAL CARDS GRID VIEW */}
        {/* ========================================================================= */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-16 text-center text-sm text-slate-400">
                Loading live student roster...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="col-span-full py-16 text-center text-sm text-slate-500 bg-white rounded-3xl border border-slate-200">
                No learners found matching your criteria.
              </div>
            ) : (
              filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#2596be]/40 transition-all space-y-4 relative group"
                >
                  {/* Top Row: Avatar, Name, Level Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2596be]/20 via-[#38bdf8]/20 to-[#ec4899]/20 text-[#2596be] font-black text-lg flex items-center justify-center border border-[#2596be]/30 shadow-2xs">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <h4
                          onClick={() => setSelectedStudentId(st.id)}
                          className="font-bold text-slate-900 text-base group-hover:text-[#2596be] transition-colors cursor-pointer"
                        >
                          {st.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{st.campus || 'Campus'} • {st.cohortYear || '2026'}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-xl bg-pink-50 text-pink-700 border border-pink-200/80 shadow-2xs">
                      Lvl {st.level}
                    </span>
                  </div>

                  {/* XP & Progress Badges */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-[#e8da4d]/15 border border-[#e8da4d]/40 space-y-0.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-900 block">Total XP</span>
                      <span className="text-base font-extrabold font-mono text-amber-950">
                        {st.totalXp.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Courses</span>
                      <span className="text-base font-extrabold font-mono text-slate-800">
                        {st.coursesCompleted}/{st.coursesEnrolled}
                      </span>
                    </div>
                  </div>

                  {/* Avg Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Overall Progress</span>
                      <span className="font-bold text-slate-800">{st.avgProgressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2596be] to-[#ec4899] rounded-full transition-all duration-500"
                        style={{ width: `${st.avgProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Flags & Quick Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      {st.flag ? (
                        <FlagChip flag={st.flag} customReason={st.flagReason || undefined} />
                      ) : (
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ On Track
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(st.id)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      >
                        Inspect
                      </button>
                      <NudgeButton
                        studentName={st.name}
                        studentEmail={st.email}
                        studentId={st.id}
                        reason={st.flagReason || undefined}
                      />
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DETAILED TABLE VIEW */}
        {/* ========================================================================= */}
        {viewMode === 'table' && (
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
                    <th className="px-6 py-4 text-right">Actions</th>
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
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-3.5 cursor-pointer"
                            onClick={() => setSelectedStudentId(st.id)}
                          >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2596be]/20 via-[#38bdf8]/15 to-[#ec4899]/20 text-[#2596be] font-extrabold flex items-center justify-center text-xs border border-[#2596be]/25">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#2596be] transition-colors">{st.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{st.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600 text-xs">
                          <p className="font-semibold text-slate-800">{st.campus || 'Main Campus'}</p>
                          <p className="text-slate-400 font-mono">Cohort {st.cohortYear || '2026'}</p>
                        </td>

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

                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {st.lastActiveAt ? new Date(st.lastActiveAt).toLocaleDateString() : 'Never'}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {st.flag ? (
                              <FlagChip flag={st.flag} customReason={st.flagReason || undefined} />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                <span>✓</span> On Track
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(st.id)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            >
                              Inspect
                            </button>
                            <NudgeButton
                              studentName={st.name}
                              studentEmail={st.email}
                              studentId={st.id}
                              reason={st.flagReason || undefined}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STUDENT PERFORMANCE INSPECTOR SLIDE-OVER MODAL */}
        {/* ========================================================================= */}
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-right">
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#2596be]">
                    Learner Profile & Telemetry
                  </span>
                  <h3 className="text-xl font-bold font-['Hanken_Grotesk'] mt-0.5">
                    {selectedStudentDetail?.student.name || 'Loading Student...'}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {selectedStudentDetail?.student.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
                {loadingDetail ? (
                  <div className="py-16 text-center text-slate-400">Loading student performance telemetry...</div>
                ) : (
                  <>
                    {/* XP & Level Summary Box */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-900 block">Total XP</span>
                        <span className="text-lg font-extrabold text-amber-950 font-mono">
                          {selectedStudentDetail?.student.totalXp.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200">
                        <span className="text-[10px] font-mono uppercase font-bold text-pink-900 block">Level</span>
                        <span className="text-lg font-extrabold text-pink-950 font-mono">
                          Lvl {selectedStudentDetail?.student.level}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                        <span className="text-[10px] font-mono uppercase font-bold text-sky-900 block">Avg Progress</span>
                        <span className="text-lg font-extrabold text-sky-950 font-mono">
                          {selectedStudentDetail?.student.avgProgressPct}%
                        </span>
                      </div>
                    </div>

                    {/* Enrolled Courses & Real Progress */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-700">
                        Enrolled Courses ({selectedStudentDetail?.enrolledCourses.length || 0}):
                      </h4>
                      <div className="space-y-2.5">
                        {selectedStudentDetail?.enrolledCourses.map((c) => (
                          <div key={c.courseId} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">{c.courseTitle}</span>
                              <span className="font-mono font-bold text-[#2596be]">{c.progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#2596be] to-[#ec4899] rounded-full"
                                style={{ width: `${c.progressPct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submissions & AI Reviews */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-700">
                        Assessment Submissions ({selectedStudentDetail?.submissions.length || 0}):
                      </h4>
                      {selectedStudentDetail?.submissions.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                          No submissions recorded yet for this learner.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedStudentDetail?.submissions.map((sub) => (
                            <div key={sub.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-900">{sub.taskTitle}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Status: <span className="uppercase font-bold">{sub.status}</span>
                                </p>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-amber-800">+{sub.finalXp ?? 0} XP</span>
                                <p className="text-[10px] text-slate-500">Score: {sub.mentorScore ?? sub.aiScore ?? '-'}/100</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-white transition cursor-pointer"
                >
                  Close Inspector
                </button>
                {selectedStudentDetail?.student && (
                  <NudgeButton
                    studentName={selectedStudentDetail.student.name}
                    studentEmail={selectedStudentDetail.student.email}
                    studentId={selectedStudentDetail.student.id}
                    reason={selectedStudentDetail.student.flagReason || undefined}
                  />
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
