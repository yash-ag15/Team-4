'use client'

import React, { useState } from 'react'
import { Star, Award } from 'lucide-react'
import { AssignedCourse, RecommendedCourse } from './types'
import { StreakBadge } from './streak-badge'
import { AssignedCoursesRail } from './assigned-courses-rail'
import { RecommendedCoursesRail } from './recommended-courses-rail'
import { AchievementsRow } from './achievements-row'
import { StudentNavbar } from '@/components/layout/student-navbar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { StudentProfileProvider, useStudentProfile } from '@/context/student-profile-context'

const MOCK_ASSIGNED_COURSES: AssignedCourse[] = [
  {
    courseId: 'mastering-react-hooks',
    title: 'Mastering React Hooks',
    thumbnail:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    completedLessons: 6,
    totalLessons: 10,
    xpEarned: 180,
    xpTotalPossible: 300,
    lastActivityAt: '2026-08-21T09:00:00.000Z',
    completedAt: null,
    isMandatory: true,
  },
  {
    courseId: 'intro-to-ui-design',
    title: 'Intro to UI Design',
    thumbnail:
      'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80',
    completedLessons: 2,
    totalLessons: 8,
    xpEarned: 50,
    xpTotalPossible: 200,
    lastActivityAt: '2026-08-20T14:30:00.000Z',
    completedAt: null,
    isMandatory: false,
  },
  {
    courseId: 'data-structures-basics',
    title: 'Data Structures Basics',
    thumbnail:
      'https://images.unsplash.com/photo-1516116211223-48a9896886a0?w=600&auto=format&fit=crop&q=80',
    completedLessons: 9,
    totalLessons: 12,
    xpEarned: 270,
    xpTotalPossible: 360,
    lastActivityAt: '2026-08-19T11:15:00.000Z',
    completedAt: null,
    isMandatory: true,
  },
  {
    courseId: 'web-security-fundamentals',
    title: 'Web Security Fundamentals',
    thumbnail:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    completedLessons: 6,
    totalLessons: 6,
    xpEarned: 240,
    xpTotalPossible: 240,
    lastActivityAt: '2026-08-18T16:00:00.000Z',
    completedAt: '2026-08-18T16:00:00.000Z',
    isMandatory: true,
  },
  {
    courseId: 'public-speaking-101',
    title: 'Public Speaking 101',
    thumbnail:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
    completedLessons: 0,
    totalLessons: 6,
    xpEarned: 0,
    xpTotalPossible: 180,
    lastActivityAt: null,
    completedAt: null,
    isMandatory: true,
  },
]

const MOCK_RECOMMENDED_COURSES: RecommendedCourse[] = [
  {
    courseId: 'advanced-typescript',
    title: 'Advanced TypeScript',
    blurb: 'Master generics, type inference, and utility types in production.',
    reason: "Because you're learning React",
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
  },
  {
    courseId: 'figma-for-pros',
    title: 'Figma for Pros',
    blurb: 'Master auto-layout, design tokens, and component architecture.',
    reason: 'New for you',
    thumbnail:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80',
  },
  {
    courseId: 'nodejs-fundamentals',
    title: 'Node.js Fundamentals',
    blurb: 'Build scalable backend REST APIs with Express and Postgres.',
    reason: 'Popular this week',
    thumbnail:
      'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&auto=format&fit=crop&q=80',
  },
]

type FilterPill = 'all' | 'in_progress' | 'not_started' | 'completed'

function StudentHomeContent() {
  const { profile } = useStudentProfile()
  const [filter, setFilter] = useState<FilterPill>('all')
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>(MOCK_ASSIGNED_COURSES)
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>(MOCK_RECOMMENDED_COURSES)

  // Optimistic Enrollment Handler: moves course from Recommended -> Continue Learning
  const handleEnrollCourse = (course: RecommendedCourse) => {
    setRecommendedCourses((prev) => prev.filter((r) => r.courseId !== course.courseId))

    const newAssigned: AssignedCourse = {
      courseId: course.courseId,
      title: course.title,
      thumbnail: course.thumbnail,
      completedLessons: 0,
      totalLessons: 10,
      xpEarned: 0,
      xpTotalPossible: 250,
      lastActivityAt: null, // null = never started -> button shows "Start"
      completedAt: null,
      isMandatory: false,   // self-enrolled -> no mandatory tag
    }

    setAssignedCourses((prev) => [newAssigned, ...prev])
  }

  // Client-side filter logic per specification
  const filteredAssignedCourses = assignedCourses.filter((course) => {
    if (filter === 'in_progress') {
      return course.lastActivityAt !== null && course.completedLessons < course.totalLessons
    }
    if (filter === 'not_started') {
      return course.lastActivityAt === null
    }
    if (filter === 'completed') {
      return course.completedLessons === course.totalLessons && course.totalLessons > 0
    }
    return true
  })

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Shared Top Navbar */}
      <StudentNavbar />

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Welcome Header & Badges Row */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-4xl font-extrabold text-on-background tracking-tight">
            Welcome back, {profile.name}!
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed-variant px-4 py-2 rounded-full w-max shadow-sm border border-secondary-fixed-dim">
              <Star className="w-4 h-4 text-xp-gold fill-xp-gold" />
              <span className="font-semibold text-xs md:text-sm">
                Level {profile.level} — Contributor, {profile.xpTotal} XP
              </span>
            </div>
            <StreakBadge streakCount={profile.streakCount} />
          </div>
        </section>

        {/* Filter Pills: All / In Progress / Not Started / Completed */}
        <section className="flex gap-2.5 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-5 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm transition-all active:scale-95 shrink-0 ${
              filter === 'all'
                ? 'bg-primary text-on-primary border-2 border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant border-2 border-surface-variant hover:bg-surface-variant'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`px-5 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm transition-all active:scale-95 shrink-0 ${
              filter === 'in_progress'
                ? 'bg-primary text-on-primary border-2 border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant border-2 border-surface-variant hover:bg-surface-variant'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setFilter('not_started')}
            className={`px-5 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm transition-all active:scale-95 shrink-0 ${
              filter === 'not_started'
                ? 'bg-primary text-on-primary border-2 border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant border-2 border-surface-variant hover:bg-surface-variant'
            }`}
          >
            Not Started
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-5 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm transition-all active:scale-95 shrink-0 ${
              filter === 'completed'
                ? 'bg-primary text-on-primary border-2 border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant border-2 border-surface-variant hover:bg-surface-variant'
            }`}
          >
            Completed
          </button>
        </section>

        {/* Two-Column Layout (Desktop ~60% Left / ~40% Right, Mobile Single Stack) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (~60% width): Continue Learning Vertical List */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-on-background">
                {filter === 'completed' ? 'Completed Courses' : 'Continue Learning'}
              </h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {filteredAssignedCourses.length} course{filteredAssignedCourses.length === 1 ? '' : 's'}
              </span>
            </div>
            <AssignedCoursesRail courses={filteredAssignedCourses} />
          </section>

          {/* Right Column (~40% width): Recommended For You Compact List */}
          <section className="lg:col-span-5 flex flex-col gap-4 bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-base md:text-lg font-bold text-on-background">
                Recommended For You
              </h3>
            </div>
            <RecommendedCoursesRail
              courses={recommendedCourses}
              onEnroll={handleEnrollCourse}
            />
          </section>
        </div>

        {/* Full-Width Achievements Section */}
        <section className="flex flex-col gap-4 pt-4 border-t border-outline-variant/30">
          <h3 className="text-lg font-bold text-on-background">Your Achievements</h3>
          <AchievementsRow />
        </section>
      </main>

      {/* Shared Mobile Bottom Navbar */}
      <StudentBottomNav />
    </div>
  )
}

export default function StudentHomePage() {
  return (
    <StudentProfileProvider>
      <StudentHomeContent />
    </StudentProfileProvider>
  )
}
