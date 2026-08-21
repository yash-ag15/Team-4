'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiClientError } from '@/lib/api-client'
import type {
  CourseCategory,
  CourseDifficulty,
  CourseTrack,
  LessonKind,
  ModuleType,
} from '@/contracts/courses'

// ---------------------------------------------------------------------------
// Module Type Definitions & Visual Config
// ---------------------------------------------------------------------------

export interface ModuleTypeOption {
  type: ModuleType
  label: string
  icon: string
  description: string
  badgeColor: string
  borderColor: string
  bgColor: string
  defaultLessons: FormLesson[]
  defaultXp: number
}

export const MODULE_TYPES: Record<ModuleType, ModuleTypeOption> = {
  training_session: {
    type: 'training_session',
    label: 'Training Session',
    icon: '🎓',
    description: 'Live interactive workshop, webinar, masterclass, or cohort sync.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50/50',
    defaultXp: 80,
    defaultLessons: [
      {
        id: 'les-ts-1',
        title: 'Live Workshop Link & Agenda',
        kind: 'link',
        contentUrl: 'https://meet.google.com/sample-session',
        contentBody: '### Workshop Preparation\nJoin on time with your camera on. Review the preliminary reading.',
        durationMin: 60,
        xpAward: 50,
        orderIndex: 0,
      },
      {
        id: 'les-ts-2',
        title: 'Post-Session Key Takeaways & Reflection',
        kind: 'reading',
        contentBody: '### Session Reflection\nSummarize 3 concrete insights you learned during today’s session.',
        durationMin: 15,
        xpAward: 30,
        orderIndex: 1,
      },
    ],
  },
  online_course: {
    type: 'online_course',
    label: 'Online Course Module',
    icon: '💻',
    description: 'Structured video lectures, reading guides, and checkpoint quizzes.',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    borderColor: 'border-sky-300',
    bgColor: 'bg-sky-50/50',
    defaultXp: 60,
    defaultLessons: [
      {
        id: 'les-oc-1',
        title: 'Video Lecture & Concept Breakdown',
        kind: 'video',
        contentUrl: 'https://youtube.com/watch?v=sample-tutorial',
        contentBody: '### Core Architecture\nWatch the walkthrough explaining foundational data structures.',
        durationMin: 20,
        xpAward: 25,
        orderIndex: 0,
      },
      {
        id: 'les-oc-2',
        title: 'Detailed Reading & Code Walkthrough',
        kind: 'reading',
        contentBody: '### In-Depth Reference\nStudy the implementation patterns and common edge cases.',
        durationMin: 15,
        xpAward: 15,
        orderIndex: 1,
      },
    ],
  },
  mentoring_task: {
    type: 'mentoring_task',
    label: 'Mentoring & Coaching Task',
    icon: '🤝',
    description: '1-on-1 mentor syncs, coaching discussion prompts, and goal tracking.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50/50',
    defaultXp: 100,
    defaultLessons: [
      {
        id: 'les-mt-1',
        title: '1-on-1 Coaching Sync Agenda & Notes',
        kind: 'link',
        contentUrl: 'https://calendly.com/sample-mentor-sync',
        contentBody: '### Coaching Focus\nDiscuss progress hurdles, career positioning, and feedback on submissions.',
        durationMin: 30,
        xpAward: 50,
        orderIndex: 0,
      },
      {
        id: 'les-mt-2',
        title: 'Personalized Action Plan & Commitments',
        kind: 'reading',
        contentBody: '### Action Items\nDocument agreed milestones with your mentor for the upcoming sprint.',
        durationMin: 15,
        xpAward: 50,
        orderIndex: 1,
      },
    ],
  },
  project: {
    type: 'project',
    label: 'Hands-on Project',
    icon: '🚀',
    description: 'Capstone build or team deliverable with GitHub repo and live demo.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50/50',
    defaultXp: 200,
    defaultLessons: [
      {
        id: 'les-pj-1',
        title: 'Project Brief & Architecture Requirements',
        kind: 'reading',
        contentBody: '### Project Overview\nBuild and deploy an end-to-end application solving real user pain points.',
        durationMin: 30,
        xpAward: 40,
        orderIndex: 0,
      },
      {
        id: 'les-pj-2',
        title: 'Submit GitHub Repository & Live Demo Link',
        kind: 'link',
        contentUrl: 'https://github.com',
        contentBody: '### Deliverables\nSubmit your repository link and deployed preview URL for review.',
        durationMin: 60,
        xpAward: 160,
        orderIndex: 1,
      },
    ],
  },
  assignment: {
    type: 'assignment',
    label: 'Assignment Submission',
    icon: '📝',
    description: 'Graded assessment evaluated with AI Coach feedback and mentor score.',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    borderColor: 'border-pink-300',
    bgColor: 'bg-pink-50/50',
    defaultXp: 150,
    defaultLessons: [
      {
        id: 'les-as-1',
        title: 'Assignment Prompt & Evaluation Rubric',
        kind: 'reading',
        contentBody: '### Instructions\nProvide a comprehensive case analysis answering the prompt questions.',
        durationMin: 45,
        xpAward: 50,
        orderIndex: 0,
      },
      {
        id: 'les-as-2',
        title: 'Submit Case Study Response',
        kind: 'reading',
        contentBody: '### Your Submission\nSubmit your detailed response for AI evaluation and mentor grading.',
        durationMin: 30,
        xpAward: 100,
        orderIndex: 1,
      },
    ],
  },
  milestone: {
    type: 'milestone',
    label: 'Milestone & Certification',
    icon: '🏆',
    description: 'Track custom milestones, hackathon checkpoints, or industry certificates.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50/50',
    defaultXp: 120,
    defaultLessons: [
      {
        id: 'les-ms-1',
        title: 'Milestone Completion Proof & Certificate URL',
        kind: 'link',
        contentUrl: '',
        contentBody: '### Proof of Milestone\nSubmit your certificate verification link or milestone achievement proof.',
        durationMin: 20,
        xpAward: 120,
        orderIndex: 0,
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Form State Interfaces
// ---------------------------------------------------------------------------

export interface FormLesson {
  id: string
  title: string
  kind: LessonKind
  contentUrl?: string
  contentBody?: string
  durationMin: number
  xpAward: number
  orderIndex: number
}

export interface FormSection {
  id: string
  title: string
  summary: string
  type: ModuleType
  xpAward: number
  orderIndex: number
  meta: {
    meetingUrl?: string
    sessionDate?: string
    speakerName?: string
    discussionTopic?: string
    deliverables?: string
    rubric?: string
    maxScore?: number
  }
  lessons: FormLesson[]
}

export default function CourseAuthoringWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Metadata
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverEmoji, setCoverEmoji] = useState('📊')
  const [category, setCategory] = useState<CourseCategory>('technical')
  const [track, setTrack] = useState<CourseTrack>('mandatory')
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('beginner')
  const [certificateEligible, setCertificateEligible] = useState(false)
  const [estimatedHours, setEstimatedHours] = useState(8)
  const [dueDate, setDueDate] = useState<string>('')

  // Step 2 & 3: Sections / Modules
  const [sections, setSections] = useState<FormSection[]>([
    {
      id: 'sec-1',
      title: 'Module 1: Foundations & Architecture',
      summary: 'Learn the primary concepts, system design, and toolchain.',
      type: 'online_course',
      xpAward: 50,
      orderIndex: 0,
      meta: {},
      lessons: [
        {
          id: 'les-1',
          title: 'Welcome to the Course & Core Concepts',
          kind: 'reading',
          contentBody: '### Overview\nWelcome to this comprehensive course. We will cover key principles...',
          durationMin: 10,
          xpAward: 15,
          orderIndex: 0,
        },
        {
          id: 'les-2',
          title: 'Setting Up Your Development Environment',
          kind: 'video',
          contentUrl: 'https://youtube.com/watch?v=sample-tutorial',
          durationMin: 15,
          xpAward: 20,
          orderIndex: 1,
        },
      ],
    },
    {
      id: 'sec-2',
      title: 'Live Workshop: Interactive Deep Dive',
      summary: 'Cohort-wide masterclass and practical lab session.',
      type: 'training_session',
      xpAward: 80,
      orderIndex: 1,
      meta: {
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        sessionDate: '2026-08-30T10:00',
        speakerName: 'Dr. Rajesh Khanna',
      },
      lessons: [
        {
          id: 'les-3',
          title: 'Join Live Workshop & Q&A',
          kind: 'link',
          contentUrl: 'https://meet.google.com/abc-defg-hij',
          durationMin: 60,
          xpAward: 50,
          orderIndex: 0,
        },
        {
          id: 'les-4',
          title: 'Workshop Lab Submission & Reflection',
          kind: 'reading',
          contentBody: '### Lab Takeaways\nDocument key insights and code patterns explored during the live session.',
          durationMin: 20,
          xpAward: 30,
          orderIndex: 1,
        },
      ],
    },
  ])

  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
  })

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Compute Total XP
  const baseLessonXp = sections.reduce(
    (acc, sec) => acc + sec.lessons.reduce((lAcc, l) => lAcc + l.xpAward, 0),
    0,
  )
  const baseSectionXp = sections.reduce((acc, sec) => acc + sec.xpAward, 0)
  const completionBonus = 100
  const computedTotalXp = Math.round(
    (baseLessonXp + baseSectionXp + completionBonus) * (track === 'optional' ? 1.5 : 1),
  )

  // -------------------------------------------------------------------------
  // Section / Module Handlers
  // -------------------------------------------------------------------------

  const addSectionWithType = (type: ModuleType) => {
    const config = MODULE_TYPES[type]
    const newId = `sec-${Date.now()}`
    const newSection: FormSection = {
      id: newId,
      title: `${config.label} ${sections.length + 1}`,
      summary: config.description,
      type,
      xpAward: config.defaultXp,
      orderIndex: sections.length,
      meta: {
        maxScore: 100,
        rubric: 'Evidence (25%), Analysis (35%), Clarity (20%), Execution (20%)',
      },
      lessons: config.defaultLessons.map((l, i) => ({
        ...l,
        id: `les-${Date.now()}-${i}`,
      })),
    }

    setSections([...sections, newSection])
    setExpandedSectionIds((prev) => ({ ...prev, [newId]: true }))
  }

  const updateSection = (id: string, updates: Partial<FormSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const changeSectionType = (id: string, newType: ModuleType) => {
    const config = MODULE_TYPES[newType]
    setSections(
      sections.map((s) => {
        if (s.id !== id) return s
        return {
          ...s,
          type: newType,
          title: s.title.includes('Module') || s.title.includes('Section') ? `${config.label}: ${s.title.split(':')[1] || s.title}` : s.title,
          summary: s.summary || config.description,
          xpAward: s.xpAward || config.defaultXp,
          lessons: s.lessons.length > 0 ? s.lessons : config.defaultLessons,
        }
      }),
    )
  }

  const deleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('A course must contain at least one module/section.')
      return
    }
    setSections(sections.filter((s) => s.id !== id))
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setSections(updated.map((s, i) => ({ ...s, orderIndex: i })))
  }

  // -------------------------------------------------------------------------
  // Lesson Handlers
  // -------------------------------------------------------------------------

  const addLesson = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const newLesson: FormLesson = {
      id: `les-${Date.now()}`,
      title: `Item ${section.lessons.length + 1}`,
      kind: section.type === 'training_session' ? 'link' : section.type === 'online_course' ? 'video' : 'reading',
      contentBody: '### Details\nAdd topic details, reading material, or instructions.',
      durationMin: 15,
      xpAward: 15,
      orderIndex: section.lessons.length,
    }

    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s,
      ),
    )
  }

  const updateLesson = (
    sectionId: string,
    lessonId: string,
    updates: Partial<FormLesson>,
  ) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        return {
          ...s,
          lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
        }
      }),
    )
  }

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        return {
          ...s,
          lessons: s.lessons.filter((l) => l.id !== lessonId),
        }
      }),
    )
  }

  const moveLesson = (
    sectionId: string,
    lessonIndex: number,
    direction: 'up' | 'down',
  ) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1
        if (targetIndex < 0 || targetIndex >= s.lessons.length) return s
        const updated = [...s.lessons]
        const temp = updated[lessonIndex]
        updated[lessonIndex] = updated[targetIndex]
        updated[targetIndex] = temp
        return {
          ...s,
          lessons: updated.map((l, i) => ({ ...l, orderIndex: i })),
        }
      }),
    )
  }

  // -------------------------------------------------------------------------
  // Validation & Submit
  // -------------------------------------------------------------------------

  const validateStep1 = () => {
    if (!title.trim() || title.length < 3) {
      alert('Please enter a course title (minimum 3 characters).')
      return false
    }
    if (!subtitle.trim() || subtitle.length < 5) {
      alert('Please enter a subtitle (minimum 5 characters).')
      return false
    }
    if (!description.trim() || description.length < 10) {
      alert('Please enter a description (minimum 10 characters).')
      return false
    }
    if (track === 'mandatory' && !dueDate) {
      alert('Mandatory courses require a target due date.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    for (const sec of sections) {
      if (!sec.title.trim()) {
        alert('All modules/sections must have a title.')
        return false
      }
    }
    return true
  }

  const validateStep3 = () => {
    for (const sec of sections) {
      if (sec.lessons.length === 0) {
        alert(`Module "${sec.title}" must have at least one lesson or task item.`)
        return false
      }
      for (const les of sec.lessons) {
        if (!les.title.trim()) {
          alert('All items must have a title.')
          return false
        }
      }
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    setCurrentStep((prev) => Math.min(prev + 1, 4) as any)
  }

  const handlePublish = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return

    setIsPublishing(true)
    setErrorMessage(null)

    try {
      await api.courses.create({
        title,
        subtitle,
        description,
        coverEmoji,
        category,
        track,
        difficulty,
        certificateEligible,
        estimatedHours,
        totalXp: computedTotalXp,
        dueAt: track === 'mandatory' && dueDate ? new Date(dueDate).toISOString() : null,
        status: 'published',
        sections: sections.map((s, sIdx) => ({
          title: s.title,
          summary: s.summary,
          type: s.type,
          orderIndex: sIdx,
          xpAward: s.xpAward,
          meta: s.meta,
          lessons: s.lessons.map((l, lIdx) => ({
            title: l.title,
            kind: l.kind,
            contentUrl: l.contentUrl || null,
            contentBody: l.contentBody || null,
            durationMin: l.durationMin,
            orderIndex: lIdx,
            xpAward: l.xpAward,
          })),
        })),
      })

      setPublishSuccess(true)
    } catch (err: any) {
      console.error('Failed to publish course', err)
      setErrorMessage(
        err instanceof ApiClientError ? err.message : 'Failed to publish course.',
      )
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#2596be]/20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span>Curriculum & Module Studio</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Create Course & Modules
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Add training sessions, online courses, coaching tasks, capstone projects, assignments, and milestones.
            </p>
          </div>

          <Link
            href="/mentor/dashboard"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start"
          >
            ← Exit to Dashboard
          </Link>
        </div>

        {/* Wizard Steps Navigation Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
            {[
              { num: 1, label: '1. Course Info' },
              { num: 2, label: '2. Modules & Structure' },
              { num: 3, label: '3. Content & Tasks' },
              { num: 4, label: '4. Review & Publish' },
            ].map((st) => (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num as any)
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  currentStep === st.num
                    ? 'bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white shadow-xs'
                    : currentStep > st.num
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {currentStep > st.num ? '✓' : st.num}
                </span>
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Success Screen after Publish */}
        {publishSuccess ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-5 shadow-lg animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-sm">
              🎉
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-['Hanken_Grotesk']">
              Course & Modules Published!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              <strong>{title}</strong> with {sections.length} modules and {sections.reduce((a, s) => a + s.lessons.length, 0)} interactive tasks is now active and live in the student catalog.
            </p>
            <div className="flex items-center justify-center gap-4 pt-3">
              <Link
                href="/mentor/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition"
              >
                Go to Mentor Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setPublishSuccess(false)
                  setCurrentStep(1)
                  setTitle('')
                  setSubtitle('')
                  setDescription('')
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Create Another Course
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ========================================================================= */}
            {/* STEP 1: Course Metadata & Track */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 1: Course Info & Program Track
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the title, track behavior (mandatory vs optional 1.5x XP), and program attributes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Data Foundations & Full-Stack Mastery"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Subtitle / Catchphrase *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master relational databases, coaching tasks, and real-world capstones"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Full Course Overview *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detailed overview of syllabus, prerequisites, and learning outcomes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Track Behavior *
                    </label>
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    >
                      <option value="mandatory">Mandatory Track (With Due Date)</option>
                      <option value="optional">Optional Track (1.5x XP Multiplier ⚡)</option>
                    </select>
                  </div>

                  {track === 'mandatory' ? (
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                        Target Due Date *
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-xs text-amber-900 font-medium">
                        ✨ <strong>Self-Paced Track:</strong> Learners earn an automatic <strong>1.5× XP multiplier</strong> on all activities.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none capitalize"
                    >
                      <option value="technical">Technical</option>
                      <option value="business">Business</option>
                      <option value="communication">Communication</option>
                      <option value="leadership">Leadership</option>
                      <option value="wellbeing">Wellbeing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none capitalize"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Estimated Duration (Hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="certEligible"
                      checked={certificateEligible}
                      onChange={(e) => setCertificateEligible(e.target.checked)}
                      className="w-5 h-5 rounded text-[#2596be] focus:ring-[#2596be] cursor-pointer"
                    />
                    <label htmlFor="certEligible" className="text-sm font-semibold text-slate-800 cursor-pointer">
                      🏅 Certificate Eligible (+200 XP Bonus)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Next: Add Modules & Structure →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: Multi-Module Builder (6 Supported Types) */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 2: Add Curriculum Modules
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select from 6 standardized module types to build a rich, blended learning journey.
                  </p>
                </div>

                {/* Quick Add Module Type Grid (6 Choices) */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase text-slate-600">
                    + Add New Module by Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.values(MODULE_TYPES).map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => addSectionWithType(opt.type)}
                        className={`p-3 rounded-2xl border ${opt.borderColor} ${opt.bgColor} hover:scale-102 transition-all text-left space-y-1.5 shadow-2xs hover:shadow-xs cursor-pointer group`}
                      >
                        <div className="text-2xl">{opt.icon}</div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#2596be] transition-colors leading-tight">
                          {opt.label}
                        </p>
                        <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-600">
                          +{opt.defaultXp} XP
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Modules List */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500">
                      Configured Modules ({sections.length})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#2596be]">
                      Total Module XP: {baseSectionXp} XP
                    </span>
                  </div>

                  {sections.map((sec, idx) => {
                    const typeConfig = MODULE_TYPES[sec.type] || MODULE_TYPES.online_course
                    const isExpanded = expandedSectionIds[sec.id] ?? true

                    return (
                      <div
                        key={sec.id}
                        className={`p-5 rounded-2xl border ${typeConfig.borderColor} bg-white space-y-4 shadow-2xs transition-all`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="text-xl shrink-0">{typeConfig.icon}</span>
                            <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                              placeholder="Module Title"
                              className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Type Selector Dropdown */}
                            <select
                              value={sec.type}
                              onChange={(e) => changeSectionType(sec.id, e.target.value as ModuleType)}
                              className={`text-xs font-bold font-mono px-2.5 py-1.5 rounded-xl border ${typeConfig.badgeColor} focus:outline-none cursor-pointer`}
                            >
                              <option value="training_session">🎓 Training Session</option>
                              <option value="online_course">💻 Online Course</option>
                              <option value="mentoring_task">🤝 Mentoring Task</option>
                              <option value="project">🚀 Project</option>
                              <option value="assignment">📝 Assignment</option>
                              <option value="milestone">🏆 Milestone</option>
                            </select>

                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, 'up')}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-xs"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => moveSection(idx, 'down')}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-xs"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSection(sec.id)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs cursor-pointer"
                            >
                              🗑
                            </button>
                          </div>
                        </div>

                        {/* Summary & Module XP */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={sec.summary}
                              onChange={(e) => updateSection(sec.id, { summary: e.target.value })}
                              placeholder="Summary of module objectives and expectations..."
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Module XP:</span>
                              <input
                                type="number"
                                min={10}
                                max={500}
                                value={sec.xpAward}
                                onChange={(e) => updateSection(sec.id, { xpAward: Number(e.target.value) })}
                                className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Specialized Metadata Controls based on Module Type */}
                        {sec.type === 'training_session' && (
                          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-blue-900 flex items-center gap-1">
                              <span>🎓</span> Training Session Details:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <input
                                type="text"
                                placeholder="Live Meeting Link (Zoom/Google Meet)"
                                value={sec.meta?.meetingUrl || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, {
                                    meta: { ...sec.meta, meetingUrl: e.target.value },
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white"
                              />
                              <input
                                type="datetime-local"
                                value={sec.meta?.sessionDate || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, {
                                    meta: { ...sec.meta, sessionDate: e.target.value },
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white font-mono"
                              />
                              <input
                                type="text"
                                placeholder="Instructor / Speaker Name"
                                value={sec.meta?.speakerName || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, {
                                    meta: { ...sec.meta, speakerName: e.target.value },
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {sec.type === 'mentoring_task' && (
                          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-amber-900 flex items-center gap-1">
                              <span>🤝</span> Mentoring & Coaching Goals:
                            </span>
                            <input
                              type="text"
                              placeholder="Specific discussion topic, career milestones, or sync agenda..."
                              value={sec.meta?.discussionTopic || ''}
                              onChange={(e) =>
                                updateSection(sec.id, {
                                  meta: { ...sec.meta, discussionTopic: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                            />
                          </div>
                        )}

                        {sec.type === 'project' && (
                          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-purple-900 flex items-center gap-1">
                              <span>🚀</span> Capstone Deliverables & Evaluation Criteria:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <input
                                type="text"
                                placeholder="Required Deliverables (e.g. GitHub Repository, Live Demo URL)"
                                value={sec.meta?.deliverables || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, {
                                    meta: { ...sec.meta, deliverables: e.target.value },
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Rubric Breakdown (e.g. Architecture 40%, Demo 40%, Docs 20%)"
                                value={sec.meta?.rubric || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, {
                                    meta: { ...sec.meta, rubric: e.target.value },
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {sec.type === 'assignment' && (
                          <div className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-200/80 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-pink-900 flex items-center gap-1">
                              <span>📝</span> Assignment Assessment Prompt & AI Rubric:
                            </span>
                            <input
                              type="text"
                              placeholder="Assessment evaluation rubric (e.g. Evidence 25%, Analysis 35%, Clarity 20%, Action 20%)"
                              value={sec.meta?.rubric || ''}
                              onChange={(e) =>
                                updateSection(sec.id, {
                                  meta: { ...sec.meta, rubric: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-pink-300 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Course Info
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Next: Add Content & Tasks →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: Content Items & Lessons by Module */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 3: Content Items & Tasks
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure video lectures, reading materials, meeting links, and reflection submissions for each module.
                  </p>
                </div>

                <div className="space-y-6">
                  {sections.map((sec, secIdx) => {
                    const typeConfig = MODULE_TYPES[sec.type] || MODULE_TYPES.online_course
                    return (
                      <div
                        key={sec.id}
                        className={`border ${typeConfig.borderColor} rounded-2xl p-5 bg-slate-50/40 space-y-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{typeConfig.icon}</span>
                            <div>
                              <span className="text-[10px] font-mono uppercase font-bold text-[#2596be]">
                                Module #{secIdx + 1} • {typeConfig.label}
                              </span>
                              <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => addLesson(sec.id)}
                            className="px-3.5 py-1.5 bg-white border border-[#2596be]/40 text-[#2596be] hover:bg-[#2596be]/10 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <span>+</span>
                            <span>Add Item</span>
                          </button>
                        </div>

                        {sec.lessons.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                            No tasks or lessons in this module. Click &ldquo;+ Add Item&rdquo; above.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sec.lessons.map((les, lesIdx) => (
                              <div
                                key={les.id}
                                className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      {lesIdx + 1}.
                                    </span>
                                    <input
                                      type="text"
                                      value={les.title}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, { title: e.target.value })
                                      }
                                      placeholder="Item Title"
                                      className="w-full px-3 py-1 text-sm font-semibold rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#2596be]"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <select
                                      value={les.kind}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, { kind: e.target.value as any })
                                      }
                                      className="text-xs font-bold font-mono px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 capitalize"
                                    >
                                      <option value="video">🎥 Video</option>
                                      <option value="reading">📖 Reading</option>
                                      <option value="link">🔗 Link / Task</option>
                                    </select>

                                    <button
                                      type="button"
                                      disabled={lesIdx === 0}
                                      onClick={() => moveLesson(sec.id, lesIdx, 'up')}
                                      className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-[10px]"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      disabled={lesIdx === sec.lessons.length - 1}
                                      onClick={() => moveLesson(sec.id, lesIdx, 'down')}
                                      className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 text-[10px]"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteLesson(sec.id, les.id)}
                                      className="p-1 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] cursor-pointer"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>

                                {les.kind === 'video' ? (
                                  <div className="space-y-1">
                                    <input
                                      type="url"
                                      value={les.contentUrl || ''}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, { contentUrl: e.target.value })
                                      }
                                      placeholder="Video URL (e.g. https://youtube.com/watch?v=... or Cloud Video)"
                                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                                    />
                                  </div>
                                ) : les.kind === 'link' ? (
                                  <div className="space-y-1">
                                    <input
                                      type="url"
                                      value={les.contentUrl || ''}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, { contentUrl: e.target.value })
                                      }
                                      placeholder="Session / Resource / Repository URL"
                                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <textarea
                                      rows={2}
                                      value={les.contentBody || ''}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, { contentBody: e.target.value })
                                      }
                                      placeholder="Markdown content, instructions, or reading material..."
                                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <span>Duration:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={300}
                                      value={les.durationMin}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, {
                                          durationMin: Number(e.target.value),
                                        })
                                      }
                                      className="w-16 px-2 py-0.5 rounded border border-slate-300 text-xs"
                                    />
                                    <span>min</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span>Reward:</span>
                                    <input
                                      type="number"
                                      min={5}
                                      max={500}
                                      value={les.xpAward}
                                      onChange={(e) =>
                                        updateLesson(sec.id, les.id, {
                                          xpAward: Number(e.target.value),
                                        })
                                      }
                                      className="w-16 px-2 py-0.5 rounded border border-slate-300 text-xs font-bold text-amber-700"
                                    />
                                    <span>XP</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Modules
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Next: Review & Publish →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: Review & Live Publish */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 4: Review Curriculum & Live Publish
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Double check your full course configuration before making it live to learners.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                    {errorMessage}
                  </div>
                )}

                {/* Course Header Summary */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{coverEmoji}</span>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#e8da4d] text-slate-950">
                      Total XP: {computedTotalXp} XP {track === 'optional' && '(1.5x Multiplier)'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold font-['Hanken_Grotesk']">{title}</h3>
                    <p className="text-xs text-slate-300 mt-1">{subtitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-300 border-t border-slate-700">
                    <span>Track: <strong className="text-white capitalize">{track}</strong></span>
                    <span>•</span>
                    <span>Category: <strong className="text-white capitalize">{category}</strong></span>
                    <span>•</span>
                    <span>Difficulty: <strong className="text-white capitalize">{difficulty}</strong></span>
                    <span>•</span>
                    <span>Est. Time: <strong className="text-white">{estimatedHours}h</strong></span>
                    {certificateEligible && (
                      <>
                        <span>•</span>
                        <span className="text-[#e8da4d] font-bold">🏅 Certificate Included</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Modules & Tasks Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-mono font-bold uppercase text-slate-700">
                    Curriculum Modules ({sections.length}):
                  </h4>

                  <div className="space-y-3">
                    {sections.map((sec, sIdx) => {
                      const typeConfig = MODULE_TYPES[sec.type] || MODULE_TYPES.online_course
                      return (
                        <div
                          key={sec.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeConfig.icon}</span>
                              <p className="text-sm font-bold text-slate-900">
                                #{sIdx + 1}: {sec.title}
                              </p>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${typeConfig.badgeColor}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#2596be]">
                              +{sec.xpAward} Section XP
                            </span>
                          </div>

                          <p className="text-xs text-slate-500">{sec.summary}</p>

                          <div className="pl-6 pt-1 space-y-1.5">
                            {sec.lessons.map((les, lIdx) => (
                              <div
                                key={les.id}
                                className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 font-mono"
                              >
                                <span>
                                  {lIdx + 1}. {les.kind === 'video' ? '🎥' : les.kind === 'link' ? '🔗' : '📖'} {les.title} ({les.durationMin}m)
                                </span>
                                <span className="font-bold text-amber-700">+{les.xpAward} XP</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Content
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublish}
                    className="px-8 py-3 bg-gradient-to-r from-[#2596be] via-[#38bdf8] to-[#ec4899] text-white font-extrabold text-sm rounded-xl shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isPublishing ? 'Publishing Course...' : '🚀 Publish Course & Modules Live'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
