'use client'

import React from 'react'
import Link from 'next/link'
import { Zap, BookOpen, CheckCircle2 } from 'lucide-react'
import { AssignedCourse } from './types'

interface AssignedCoursesRailProps {
  courses: AssignedCourse[]
  loading?: boolean
}

/** Sort helper:
 * 1. If filtering completed courses (or both completed), sort by most recently completed first (completedAt desc)
 * 2. If active, most recent activity first (lastActivityAt desc)
 * 3. Among not-yet-started, mandatory sorts above optional
 */
export function sortAssignedCourses(courses: AssignedCourse[]): AssignedCourse[] {
  return [...courses].sort((a, b) => {
    const aDone = a.completedLessons >= a.totalLessons && a.totalLessons > 0
    const bDone = b.completedLessons >= b.totalLessons && b.totalLessons > 0

    // Both completed -> most recently completed first
    if (aDone && bDone) {
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      }
      return 0
    }

    // Both active
    if (a.lastActivityAt && b.lastActivityAt) {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    }
    // Only A active -> A first
    if (a.lastActivityAt && !b.lastActivityAt) return -1
    // Only B active -> B first
    if (!a.lastActivityAt && b.lastActivityAt) return 1

    // Neither started -> mandatory first
    if (a.isMandatory && !b.isMandatory) return -1
    if (!a.isMandatory && b.isMandatory) return 1

    return 0
  })
}

export function AssignedCoursesRail({ courses, loading = false }: AssignedCoursesRailProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-4 flex flex-col sm:flex-row gap-4 animate-pulse"
          >
            <div className="h-32 sm:w-44 bg-surface-variant rounded-xl shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <div className="h-5 bg-surface-variant rounded w-3/4" />
              <div className="h-3 bg-surface-variant rounded w-1/2 mt-2" />
              <div className="w-full h-3 bg-surface-variant rounded-full mt-2" />
              <div className="w-28 h-9 bg-surface-variant rounded-lg mt-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-8 text-center flex flex-col items-center gap-3">
        <BookOpen className="w-10 h-10 text-on-surface-variant opacity-60" />
        <h4 className="text-base font-bold text-on-background">No courses found</h4>
        <p className="text-xs text-on-surface-variant max-w-sm">
          Explore the catalog to enroll in courses and earn XP toward your learning goals!
        </p>
        <Link
          href="/catalog"
          className="mt-2 bg-primary text-on-primary font-semibold text-xs px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    )
  }

  const sorted = sortAssignedCourses(courses)

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((course) => {
        const isCompleted =
          course.totalLessons > 0 && course.completedLessons >= course.totalLessons
        const progressPct =
          course.totalLessons > 0
            ? Math.min(100, Math.round((course.completedLessons / course.totalLessons) * 100))
            : 0

        const buttonText = isCompleted
          ? 'Review'
          : course.lastActivityAt === null || course.completedLessons === 0
          ? 'Start'
          : 'Continue'

        return (
          <article
            key={course.courseId}
            className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group ${
              isCompleted
                ? 'bg-surface-container-lowest/80 border-outline-variant/30 hover:border-emerald-600/40'
                : 'bg-surface-container-lowest border-outline-variant/40 hover:border-primary/40'
            }`}
          >
            {/* Thumbnail */}
            <div className="h-36 sm:h-32 sm:w-44 bg-surface-variant rounded-xl overflow-hidden shrink-0 relative">
              <img
                alt={course.title}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  isCompleted ? 'grayscale-25' : ''
                }`}
                src={
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                }
              />
              {isCompleted && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col flex-1 gap-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1">
                  {/* Solid Mandatory Chip if isMandatory: true */}
                  {course.isMandatory && (
                    <span className="bg-primary text-on-primary font-bold px-2.5 py-0.5 rounded-md text-[11px] w-max shadow-xs">
                      Mandatory
                    </span>
                  )}
                  <h4
                    className={`font-bold text-base line-clamp-1 transition-colors ${
                      isCompleted
                        ? 'text-on-background group-hover:text-emerald-700'
                        : 'text-on-background group-hover:text-primary'
                    }`}
                  >
                    {course.title}
                  </h4>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isCompleted ? 'fill-emerald-600 text-emerald-600' : 'fill-primary'}`} />
                  {course.xpEarned} / {course.xpTotalPossible} XP
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                  <span>
                    {isCompleted
                      ? 'Completed all lessons'
                      : `${course.completedLessons} of ${course.totalLessons} lessons complete`}
                  </span>
                  <span className={`font-bold ${isCompleted ? 'text-emerald-700' : 'text-primary'}`}>
                    {progressPct}%
                  </span>
                </div>

                {/* Progress Bar: muted/success tone when completed */}
                <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <Link
                  href={`/learn/${course.courseId}`}
                  className={`inline-flex items-center justify-center font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg border-b-2 transition-all active:scale-95 ${
                    isCompleted
                      ? 'bg-surface-variant text-on-surface-variant border-surface-dim hover:bg-surface-container-high hover:text-on-background'
                      : 'bg-primary text-on-primary border-primary-container hover:bg-primary-container'
                  }`}
                >
                  {buttonText}
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
