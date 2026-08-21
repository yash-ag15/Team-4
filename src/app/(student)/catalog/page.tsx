'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Clock, Zap, Award, BookOpen, Filter } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { Course, CourseCategory, CourseDifficulty, CourseTrack } from '@/contracts/courses'
import { StudentNavbar } from '@/components/layout/student-navbar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { StudentProfileProvider } from '@/context/student-profile-context'

const CATEGORIES: { label: string; value: 'all' | CourseCategory }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Technical', value: 'technical' },
  { label: 'Business', value: 'business' },
  { label: 'Communication', value: 'communication' },
  { label: 'Leadership', value: 'leadership' },
  { label: 'Wellbeing', value: 'wellbeing' },
]

const DIFFICULTIES: { label: string; value: 'all' | CourseDifficulty }[] = [
  { label: 'All Levels', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const TRACKS: { label: string; value: 'all' | CourseTrack }[] = [
  { label: 'All Tracks', value: 'all' },
  { label: 'Mandatory', value: 'mandatory' },
  { label: 'Optional (1.5x XP)', value: 'optional' },
]

function CatalogContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [category, setCategory] = useState<'all' | CourseCategory>('all')
  const [difficulty, setDifficulty] = useState<'all' | CourseDifficulty>('all')
  const [track, setTrack] = useState<'all' | CourseTrack>('all')

  useEffect(() => {
    let isMounted = true
    async function loadCourses() {
      setLoading(true)
      try {
        const query: {
          category?: CourseCategory
          difficulty?: CourseDifficulty
          track?: CourseTrack
        } = {}

        if (category !== 'all') query.category = category
        if (difficulty !== 'all') query.difficulty = difficulty
        if (track !== 'all') query.track = track

        const res = await api.courses.list(query)
        if (isMounted) {
          setCourses(res.courses)
        }
      } catch (err) {
        console.error('Failed to load catalog courses:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCourses()
    return () => {
      isMounted = false
    }
  }, [category, difficulty, track])

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Shared Top Navbar */}
      <StudentNavbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Header */}
        <section className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold text-xs px-3 py-1 rounded-full w-max">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Course Catalog</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-background tracking-tight">
            Explore Courses & Boost Your XP
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl">
            Browse published courses across technical, leadership, and professional skills. Earn XP and unlock achievements as you build mastery.
          </p>
        </section>

        {/* Filters Bar */}
        <section className="bg-surface-container-low/60 border border-outline-variant/40 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-on-background font-bold text-sm">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Courses</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Category
            </span>
            <div className="flex flex-wrap gap-2 overflow-x-auto hide-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all active:scale-95 ${
                    category === cat.value
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-variant'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters: Level & Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/30">
            {/* Difficulty */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Difficulty Level
              </span>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                      difficulty === diff.value
                        ? 'bg-secondary text-on-secondary font-semibold'
                        : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Track */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Track
              </span>
              <div className="flex flex-wrap gap-2">
                {TRACKS.map((tr) => (
                  <button
                    key={tr.value}
                    type="button"
                    onClick={() => setTrack(tr.value)}
                    className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                      track === tr.value
                        ? 'bg-tertiary text-on-tertiary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Course Cards Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-on-background">
              Available Courses
            </h2>
            <span className="text-xs text-on-surface-variant font-semibold">
              Showing {courses.length} course{courses.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 flex flex-col gap-4 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 bg-surface-variant rounded-xl" />
                    <div className="w-20 h-5 bg-surface-variant rounded-full" />
                  </div>
                  <div className="h-5 bg-surface-variant rounded w-3/4" />
                  <div className="h-4 bg-surface-variant rounded w-full" />
                  <div className="h-4 bg-surface-variant rounded w-2/3" />
                  <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between">
                    <div className="w-16 h-4 bg-surface-variant rounded" />
                    <div className="w-16 h-4 bg-surface-variant rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center flex flex-col items-center gap-3">
              <BookOpen className="w-10 h-10 text-on-surface-variant/40" />
              <h3 className="text-base font-bold text-on-background">No courses match your filter</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Try selecting a different category or difficulty level to explore available learning tracks.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all')
                  setDifficulty('all')
                  setTrack('all')
                }}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn/${course.slug}`}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Cover Emoji & Track Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                        {course.coverEmoji || '📘'}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          course.track === 'optional'
                            ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed'
                            : 'bg-primary-container text-on-primary-container border border-primary-fixed-dim'
                        }`}
                      >
                        {course.track === 'optional' ? 'Optional 1.5x' : 'Mandatory'}
                      </span>
                    </div>

                    {/* Category & Difficulty Pills */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-on-surface-variant">
                      <span className="bg-surface-variant px-2.5 py-0.5 rounded-md capitalize">
                        {course.category}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{course.difficulty}</span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="font-bold text-base text-on-background group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                        {course.subtitle || course.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-on-surface-variant/70" />
                      <span>{course.estimatedHours} hrs</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-xp-gold">
                      <Zap className="w-3.5 h-3.5 fill-xp-gold" />
                      <span>+{course.totalXp} XP</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Shared Mobile Bottom Navbar */}
      <StudentBottomNav />
    </div>
  )
}

export default function StudentCatalogPage() {
  return (
    <StudentProfileProvider>
      <CatalogContent />
    </StudentProfileProvider>
  )
}
