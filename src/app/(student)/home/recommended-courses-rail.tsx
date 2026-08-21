'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { RecommendedCourse } from './types'
import { api } from '@/lib/api-client'

interface RecommendedCoursesRailProps {
  courses: RecommendedCourse[]
  loading?: boolean
  onEnroll?: (course: RecommendedCourse) => void
}

export function RecommendedCoursesRail({
  courses,
  loading = false,
  onEnroll,
}: RecommendedCoursesRailProps) {
  const [enrollingIds, setEnrollingIds] = useState<Record<string, boolean>>({})

  const handleEnrollClick = async (course: RecommendedCourse) => {
    setEnrollingIds((prev) => ({ ...prev, [course.courseId]: true }))
    try {
      // Call api.enrollments.enroll via typed client
      await api.enrollments.enroll({ courseId: course.courseId })
    } catch (err) {
      console.warn('Enrollment API note:', err)
    } finally {
      setEnrollingIds((prev) => ({ ...prev, [course.courseId]: false }))
      // Optimistically trigger parent handler to move course to Continue Learning
      onEnroll?.(course)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-3.5 flex gap-3 animate-pulse"
          >
            <div className="w-20 h-20 bg-surface-variant rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 bg-surface-variant rounded w-1/2" />
              <div className="h-4 bg-surface-variant rounded w-3/4" />
              <div className="h-3 bg-surface-variant rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 text-center text-on-surface-variant">
        <Sparkles className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-2" />
        <p className="text-xs font-semibold">You're enrolled in all current recommendations!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {courses.map((course) => {
        const isEnrolling = enrollingIds[course.courseId] || false

        return (
          <article
            key={course.courseId}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-3.5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col sm:flex-row gap-3 relative overflow-hidden group"
          >
            {course.thumbnail && (
              <div className="w-full sm:w-24 h-24 sm:h-20 bg-surface-variant rounded-lg overflow-hidden shrink-0 relative">
                <img
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={course.thumbnail}
                />
              </div>
            )}

            <div className="flex flex-col flex-1 gap-1">
              <span className="text-[11px] font-semibold text-primary bg-primary/10 w-max px-2 py-0.5 rounded-md">
                {course.reason}
              </span>
              <h4 className="font-bold text-sm text-on-background line-clamp-1 group-hover:text-primary transition-colors">
                {course.title}
              </h4>
              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                {course.blurb}
              </p>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isEnrolling}
                  onClick={() => handleEnrollClick(course)}
                  className="inline-flex items-center justify-center bg-surface-variant text-on-surface-variant font-bold text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-md border-b-2 border-surface-dim hover:bg-primary hover:text-on-primary hover:border-primary-container transition-all active:scale-95 disabled:opacity-50"
                >
                  {isEnrolling ? 'Enrolling...' : 'Enrol'}
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
