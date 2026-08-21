'use client'

import React, { use, useState } from 'react'
import { CourseProgress } from '../types'
import { CourseHeader } from '../course-header'
import { ModuleAccordion } from '../module-accordion'
import { FinalAssignmentCard } from '../final-assignment-card'
import { ModuleStepper } from '../module-stepper'
import { StudentNavbar } from '@/components/layout/student-navbar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { StudentProfileProvider } from '@/context/student-profile-context'

const MOCK_COURSE_DATA: Record<string, CourseProgress> = {
  'mastering-react-hooks': {
    courseId: 'mastering-react-hooks',
    title: 'Mastering React Hooks',
    overallCompletedPct: 70,
    xpEarned: 420,
    xpTotalPossible: 600,
    modules: [
      {
        moduleId: 'mod-1',
        title: 'Module 1: useState & useEffect',
        completedPct: 60,
        lessons: [
          { lessonId: 'les-1', title: 'Intro to useState', isCompleted: true },
          { lessonId: 'les-2', title: 'Functional Updates', isCompleted: true },
          { lessonId: 'les-3', title: 'The useEffect hook', isCompleted: true },
          { lessonId: 'les-4', title: 'Cleanup Functions', isCompleted: false },
          { lessonId: 'les-5', title: 'Dependency Arrays', isCompleted: false },
        ],
        assignment: {
          assignmentId: 'asg-1',
          title: 'State Management Quiz',
          status: 'in_progress',
          xpReward: 50,
        },
      },
      {
        moduleId: 'mod-2',
        title: 'Module 2: Advanced Hooks',
        completedPct: 0,
        lessons: [
          { lessonId: 'les-6', title: 'useMemo & useCallback', isCompleted: false },
          { lessonId: 'les-7', title: 'useRef & DOM manipulation', isCompleted: false },
          { lessonId: 'les-8', title: 'useReducer for complex state', isCompleted: false },
          { lessonId: 'les-9', title: 'Context API with Hooks', isCompleted: false },
        ],
        assignment: {
          assignmentId: 'asg-2',
          title: 'Custom Reducer Implementation',
          status: 'not_started',
          xpReward: 60,
        },
      },
      {
        moduleId: 'mod-3',
        title: 'Module 3: Custom Hooks & Optimization',
        completedPct: 0,
        lessons: [
          { lessonId: 'les-10', title: 'Building your first custom hook', isCompleted: false },
          { lessonId: 'les-11', title: 'useLocalStorage & useFetch patterns', isCompleted: false },
          { lessonId: 'les-12', title: 'Testing custom hooks with Vitest', isCompleted: false },
        ],
        assignment: {
          assignmentId: 'asg-3',
          title: 'Performance Benchmark Quiz',
          status: 'not_started',
          xpReward: 70,
        },
      },
    ],
    finalAssignment: {
      assignmentId: 'final-react-hooks',
      title: 'Course Final Project: Full-Stack Kanban App',
      status: 'locked', // locked until all modules complete
      xpReward: 100,
    },
  },
}

function ProgressContent({ slug }: { slug: string }) {
  const courseData =
    MOCK_COURSE_DATA[slug] ||
    MOCK_COURSE_DATA['mastering-react-hooks']

  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    courseData.modules[0]?.moduleId || null
  )

  const handleOpenAssignment = (assignmentId: string) => {
    // Leave a clear hook for Feature 4 assignment submission flow
    console.log('Open assignment submission flow for:', assignmentId)
    alert(`Opening Assignment submission flow for Assignment ID: ${assignmentId}`)
  }

  const handleSelectLesson = (lessonId: string) => {
    // Feature 2 lesson view integration hook
    console.log('Navigating to lesson:', lessonId)
    alert(`Opening Lesson View for Lesson ID: ${lessonId}`)
  }

  const handleSelectModuleFromStepper = (moduleId: string) => {
    setActiveModuleId(moduleId)
    const element = document.getElementById(`module-${moduleId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pb-24 md:pb-12">
      {/* Shared Student Navbar */}
      <StudentNavbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Course Header */}
        <CourseHeader
          title={courseData.title}
          overallCompletedPct={courseData.overallCompletedPct}
          xpEarned={courseData.xpEarned}
          xpTotalPossible={courseData.xpTotalPossible}
        />

        {/* 2-Column Desktop Grid: Main Content + Sticky Module Stepper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Modules & Final Assignment */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-on-background">
                Course Modules
              </h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {courseData.modules.length} Modules
              </span>
            </div>

            {/* Expandable Module Accordion */}
            <ModuleAccordion
              modules={courseData.modules}
              slug={slug}
              expandedModuleId={activeModuleId}
              onToggleModule={(modId) =>
                setActiveModuleId((prev) => (prev === modId ? null : modId))
              }
              onSelectLesson={handleSelectLesson}
              onOpenAssignment={handleOpenAssignment}
            />

            {/* End of Course Final Assignment Card */}
            <FinalAssignmentCard
              assignment={courseData.finalAssignment}
              onOpenAssignment={handleOpenAssignment}
            />
          </div>

          {/* Sticky Side Roadmap Stepper (Desktop Only) */}
          <div className="lg:col-span-4">
            <ModuleStepper
              modules={courseData.modules}
              activeModuleId={activeModuleId}
              onSelectModule={handleSelectModuleFromStepper}
            />
          </div>
        </div>
      </main>

      {/* Shared Mobile Bottom Navbar */}
      <StudentBottomNav />
    </div>
  )
}

export default function CourseProgressPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = use(params)
  return (
    <StudentProfileProvider>
      <ProgressContent slug={resolvedParams.slug} />
    </StudentProfileProvider>
  )
}
