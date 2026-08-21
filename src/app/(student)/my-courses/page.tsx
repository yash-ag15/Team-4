'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, PlayCircle, CheckCircle2, Award, Clock, ArrowRight, Sparkles, Filter } from 'lucide-react'
import { api } from '@/lib/api-client'
import { StudentNavbar } from '@/components/layout/student-navbar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { StudentProfileProvider, useStudentProfile } from '@/context/student-profile-context'

export interface EnrolledCourseCardData {
  courseId: string
  slug: string
  title: string
  coverEmoji: string
  progressPct: number
  completedLessons: number
  totalLessons: number
  xpEarned: number
  xpTotalPossible: number
  isMandatory: boolean
  lastActivityAt: string | null
  completedAt: string | null
}

const MOCK_ENROLLED_COURSES: EnrolledCourseCardData[] = [
  {
    courseId: 'c21dd670-83af-4112-8aea-e940ca8959a2',
    slug: 'decision-making-under-uncertainty-0d5c1a',
    title: 'Decision Making Under Uncertainty',
    coverEmoji: '🎯',
    progressPct: 60,
    completedLessons: 6,
    totalLessons: 10,
    xpEarned: 180,
    xpTotalPossible: 300,
    isMandatory: true,
    lastActivityAt: '2026-08-21T09:00:00.000Z',
    completedAt: null,
  },
  {
    courseId: '81bce3c8-8906-4b0c-8dea-3dae0031df22',
    slug: 'debugging-like-a-pro-0d5c1a',
    title: 'Debugging Like a Pro',
    coverEmoji: '🌱',
    progressPct: 25,
    completedLessons: 2,
    totalLessons: 8,
    xpEarned: 50,
    xpTotalPossible: 200,
    isMandatory: false,
    lastActivityAt: '2026-08-20T14:30:00.000Z',
    completedAt: null,
  },
  {
    courseId: '8909a197-3442-40fb-bafb-357045f34cb2',
    slug: 'sustainable-productivity-0d5c1a',
    title: 'Sustainable Productivity',
    coverEmoji: '🚀',
    progressPct: 100,
    completedLessons: 6,
    totalLessons: 6,
    xpEarned: 250,
    xpTotalPossible: 250,
    isMandatory: true,
    lastActivityAt: '2026-08-18T16:00:00.000Z',
    completedAt: '2026-08-18T16:00:00.000Z',
  },
]

type FilterTab = 'all' | 'in_progress' | 'completed'

function MyCoursesContent() {
  const { profile } = useStudentProfile()
  const [courses, setCourses] = useState<EnrolledCourseCardData[]>(MOCK_ENROLLED_COURSES)
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      try {
        const dashboardRes = await api.userDashboard.dashboard({})
        if (isMounted && dashboardRes?.dashboard?.continueWith) {
          const cw = dashboardRes.dashboard.continueWith
          const activeCourse: EnrolledCourseCardData = {
            courseId: cw.courseId,
            slug: cw.slug,
            title: cw.title,
            coverEmoji: cw.coverEmoji,
            progressPct: cw.progressPct,
            completedLessons: Math.round((cw.progressPct / 100) * 10),
            totalLessons: 10,
            xpEarned: Math.round((cw.progressPct / 100) * 300),
            xpTotalPossible: 300,
            isMandatory: cw.track === 'mandatory',
            lastActivityAt: new Date().toISOString(),
            completedAt: cw.progressPct === 100 ? new Date().toISOString() : null,
          }

          setCourses((prev) => {
            const exists = prev.some((c) => c.slug === cw.slug)
            return exists ? prev : [activeCourse, ...prev]
          })
        }
      } catch (err) {
        console.warn('Dashboard api call fallback:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredCourses = courses.filter((c) => {
    if (filter === 'in_progress') return c.progressPct < 100
    if (filter === 'completed') return c.progressPct === 100
    return true
  })

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Shared Top Navbar */}
      <StudentNavbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold text-xs px-3 py-1 rounded-full w-max">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Enrolled Courses</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-on-background tracking-tight">
              My Learning Journey
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xl">
              Track your enrolled courses, resume active modules, and review your completed achievements.
            </p>
          </div>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-xs md:text-sm px-5 py-2.5 rounded-full shadow-sm hover:opacity-90 active:scale-95 transition-all self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </section>

        {/* Filter Pills */}
        <section className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-outline-variant/30 pb-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-full font-semibold text-xs md:text-sm transition-all active:scale-95 ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-5 py-2 rounded-full font-semibold text-xs md:text-sm transition-all active:scale-95 ${
              filter === 'in_progress'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
            }`}
          >
            In Progress ({courses.filter((c) => c.progressPct < 100).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-5 py-2 rounded-full font-semibold text-xs md:text-sm transition-all active:scale-95 ${
              filter === 'completed'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
            }`}
          >
            Completed ({courses.filter((c) => c.progressPct === 100).length})
          </button>
        </section>

        {/* Course Cards Grid */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex flex-col gap-4 animate-pulse"
                >
                  <div className="h-6 bg-surface-variant rounded w-3/4" />
                  <div className="h-4 bg-surface-variant rounded w-1/2" />
                  <div className="h-2 bg-surface-variant rounded-full w-full mt-4" />
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center flex flex-col items-center gap-3">
              <BookOpen className="w-10 h-10 text-on-surface-variant/40" />
              <h3 className="text-base font-bold text-on-background">No courses found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                {filter === 'completed'
                  ? "You haven't completed any courses yet. Keep learning!"
                  : 'You have no active courses matching this filter.'}
              </p>
              <Link
                href="/catalog"
                className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>Explore the Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => {
                const isDone = course.progressPct === 100
                return (
                  <div
                    key={course.courseId}
                    className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between gap-5 group relative"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                            {course.coverEmoji || '📘'}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider w-max ${
                                course.isMandatory
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'bg-tertiary-container text-on-tertiary-container'
                              }`}
                            >
                              {course.isMandatory ? 'Mandatory Track' : 'Optional Track (1.5x XP)'}
                            </span>
                            <h3 className="font-bold text-base md:text-lg text-on-background group-hover:text-primary transition-colors line-clamp-1 mt-1">
                              {course.title}
                            </h3>
                          </div>
                        </div>

                        {isDone ? (
                          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Done</span>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                            {course.progressPct}%
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex justify-between items-center text-xs font-medium text-on-surface-variant">
                          <span>
                            {course.completedLessons} of {course.totalLessons} lessons
                          </span>
                          <span className="font-semibold text-xp-gold">
                            {course.xpEarned} / {course.xpTotalPossible} XP
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDone ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${course.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant font-medium">
                        {isDone ? 'Completed' : 'Last active recently'}
                      </span>

                      <Link
                        href={`/learn/${course.slug}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 shadow-xs ${
                          isDone
                            ? 'bg-surface-container-high text-on-background hover:bg-surface-variant'
                            : 'bg-primary text-on-primary hover:opacity-90'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <span>Review Course</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            <span>Resume</span>
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Shared Mobile Bottom Navbar */}
      <StudentBottomNav />
    </div>
  )
}

export default function MyCoursesPage() {
  return (
    <StudentProfileProvider>
      <MyCoursesContent />
    </StudentProfileProvider>
  )
}
