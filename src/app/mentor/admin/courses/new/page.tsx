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
} from '@/contracts/courses'

interface FormLesson {
  id: string
  title: string
  kind: LessonKind
  contentUrl?: string
  contentBody?: string
  durationMin: number
  xpAward: number
  orderIndex: number
}

interface FormSection {
  id: string
  title: string
  summary: string
  xpAward: number
  orderIndex: number
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
  const [estimatedHours, setEstimatedHours] = useState(6)
  const [dueDate, setDueDate] = useState<string>('')

  // Step 2 & 3: Sections and Lessons
  const [sections, setSections] = useState<FormSection[]>([
    {
      id: 'sec-1',
      title: 'Introduction & Core Foundations',
      summary: 'Learn the primary concepts, architecture, and setup.',
      xpAward: 50,
      orderIndex: 0,
      lessons: [
        {
          id: 'les-1',
          title: 'Welcome to the Course & Overview',
          kind: 'reading',
          contentBody: '### Overview\nWelcome to this comprehensive module. We will cover key principles...',
          durationMin: 10,
          xpAward: 10,
          orderIndex: 0,
        },
        {
          id: 'les-2',
          title: 'Setting Up Your Workspace',
          kind: 'video',
          contentUrl: 'https://youtube.com/watch?v=sample-tutorial',
          durationMin: 15,
          xpAward: 15,
          orderIndex: 1,
        },
      ],
    },
  ])

  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({
    'sec-1': true,
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

  // Section Handlers
  const addSection = () => {
    const newId = `sec-${Date.now()}`
    const newSection: FormSection = {
      id: newId,
      title: `Section ${sections.length + 1}`,
      summary: '',
      xpAward: 50,
      orderIndex: sections.length,
      lessons: [],
    }
    setSections([...sections, newSection])
    setExpandedSectionIds((prev) => ({ ...prev, [newId]: true }))
  }

  const updateSection = (id: string, updates: Partial<FormSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const deleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('A course must contain at least one section.')
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

  // Lesson Handlers
  const addLesson = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const newLesson: FormLesson = {
      id: `les-${Date.now()}`,
      title: `Lesson ${section.lessons.length + 1}`,
      kind: 'reading',
      contentBody: '### Lesson Content\nAdd your lesson reading material here.',
      durationMin: 15,
      xpAward: 10,
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

  // Step Validation
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
        alert('All sections must have a title.')
        return false
      }
    }
    return true
  }

  const validateStep3 = () => {
    for (const sec of sections) {
      if (sec.lessons.length === 0) {
        alert(`Section "${sec.title}" must have at least one lesson.`)
        return false
      }
      for (const les of sec.lessons) {
        if (!les.title.trim()) {
          alert('All lessons must have a title.')
          return false
        }
        if (les.kind === 'reading' && !les.contentBody?.trim()) {
          alert(`Reading lesson "${les.title}" requires text content.`)
          return false
        }
        if ((les.kind === 'video' || les.kind === 'link') && !les.contentUrl?.trim()) {
          alert(`Lesson "${les.title}" requires a valid URL.`)
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
          orderIndex: sIdx,
          xpAward: s.xpAward,
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

  // Due Date Urgency calculation
  const getDueDateChip = () => {
    if (track !== 'mandatory' || !dueDate) return null
    const diffDays = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 3600 * 24),
    )

    if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          Due in {diffDays}d
        </span>
      )
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          Due in {diffDays}d
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        Due {new Date(dueDate).toLocaleDateString()}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span>Curriculum Authoring Studio</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              Create New Course
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Author course curriculum, structured sections, and interactive lessons.
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
              { num: 1, label: 'Course Details' },
              { num: 2, label: 'Sections' },
              { num: 3, label: 'Lessons' },
              { num: 4, label: 'Review & Publish' },
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
              Course Published Successfully!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              <strong>{title}</strong> is now live in the student catalog and ready for learner enrollments.
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
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Create Another Course
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* STEP 1: Course Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 1: Course Metadata & Track
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define course taxonomy, difficulty tier, and completion XP rewards.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Emoji & Title */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                        Cover Icon
                      </label>
                      <input
                        type="text"
                        value={coverEmoji}
                        onChange={(e) => setCoverEmoji(e.target.value)}
                        className="w-full px-3 py-2.5 text-center text-xl rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-10">
                      <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Data Foundations & Analytics"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Short Subtitle *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master relational data, SQL queries, and cohort retention metrics"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Full Course Description *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detailed overview of syllabus, prerequisites, and learning outcomes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    />
                  </div>

                  {/* Track Selection */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Track Behavior *
                    </label>
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                    >
                      <option value="mandatory">Mandatory (Scheduled with Due Date)</option>
                      <option value="optional">Optional Track (1.5x XP Multiplier ⚡)</option>
                    </select>
                  </div>

                  {/* Due Date (Mandatory Only) */}
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
                        ✨ <strong>Optional Track:</strong> Learners can complete at their own pace and earn an automatic <strong>1.5× XP multiplier</strong>. No deadline required.
                      </span>
                    </div>
                  )}

                  {/* Category & Difficulty */}
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

                  {/* Hours & Certificate */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-600 mb-1">
                      Estimated Duration (Hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
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
                      🏅 Certificate Eligible (+200 XP Bonus Badge)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Next: Manage Sections →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Sections */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                      Step 2: Course Sections
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Organize your curriculum into sequential topical chapters.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2 bg-gradient-to-r from-[#2596be]/15 to-[#ec4899]/15 text-[#2596be] border border-[#2596be]/30 font-bold text-xs rounded-xl hover:bg-[#2596be]/20 transition cursor-pointer"
                  >
                    + Add Section
                  </button>
                </div>

                <div className="space-y-4">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                            placeholder="Section Title"
                            className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2596be] focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
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
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={sec.summary}
                            onChange={(e) => updateSection(sec.id, { summary: e.target.value })}
                            placeholder="Brief summary of section outcomes..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Section XP:</span>
                            <input
                              type="number"
                              min={10}
                              max={500}
                              value={sec.xpAward}
                              onChange={(e) => updateSection(sec.id, { xpAward: Number(e.target.value) })}
                              className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Details
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2596be] to-[#1e7a9c] text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer"
                  >
                    Next: Add Lessons →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Lessons */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 3: Lessons by Section
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add reading materials, video lectures, and resource links to each section.
                  </p>
                </div>

                <div className="space-y-6">
                  {sections.map((sec, secIdx) => (
                    <div key={sec.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-[#2596be]">
                            Section #{secIdx + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => addLesson(sec.id)}
                          className="px-3 py-1.5 bg-white border border-[#2596be]/40 text-[#2596be] hover:bg-[#2596be]/10 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          + Add Lesson
                        </button>
                      </div>

                      {sec.lessons.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                          No lessons added yet. Click &ldquo;+ Add Lesson&rdquo; above.
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
                                    placeholder="Lesson Title"
                                    className="w-full px-3 py-1 text-sm font-semibold rounded-lg border border-slate-300 focus:ring-1 focus:ring-[#2596be]"
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <select
                                    value={les.kind}
                                    onChange={(e) =>
                                      updateLesson(sec.id, les.id, { kind: e.target.value as any })
                                    }
                                    className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50"
                                  >
                                    <option value="reading">📖 Reading</option>
                                    <option value="video">🎥 Video</option>
                                    <option value="link">🔗 Link</option>
                                  </select>

                                  <button
                                    type="button"
                                    disabled={lesIdx === 0}
                                    onClick={() => moveLesson(sec.id, lesIdx, 'up')}
                                    className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-xs"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={lesIdx === sec.lessons.length - 1}
                                    onClick={() => moveLesson(sec.id, lesIdx, 'down')}
                                    className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-xs"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteLesson(sec.id, les.id)}
                                    className="p-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>

                              {/* Content Editor based on kind */}
                              {les.kind === 'reading' && (
                                <div>
                                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                                    Markdown Content
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={les.contentBody || ''}
                                    onChange={(e) =>
                                      updateLesson(sec.id, les.id, { contentBody: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300"
                                  />
                                </div>
                              )}

                              {(les.kind === 'video' || les.kind === 'link') && (
                                <div>
                                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                                    {les.kind === 'video' ? 'Video URL (YouTube/Embed)' : 'Resource URL'}
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://..."
                                    value={les.contentUrl || ''}
                                    onChange={(e) =>
                                      updateLesson(sec.id, les.id, { contentUrl: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                <div className="flex items-center gap-1">
                                  <span>Duration:</span>
                                  <input
                                    type="number"
                                    min={5}
                                    value={les.durationMin}
                                    onChange={(e) =>
                                      updateLesson(sec.id, les.id, { durationMin: Number(e.target.value) })
                                    }
                                    className="w-16 px-1.5 py-0.5 border rounded"
                                  />
                                  <span>min</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>XP:</span>
                                  <input
                                    type="number"
                                    min={5}
                                    value={les.xpAward}
                                    onChange={(e) =>
                                      updateLesson(sec.id, les.id, { xpAward: Number(e.target.value) })
                                    }
                                    className="w-16 px-1.5 py-0.5 border rounded font-bold text-[#2596be]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Sections
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

            {/* STEP 4: Review & Publish */}
            {currentStep === 4 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-['Hanken_Grotesk']">
                    Step 4: Review & Publish Course
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your complete syllabus and published catalog preview.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Course Preview Card */}
                <div className="p-6 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 shadow-md space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        {coverEmoji}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#2596be]/10 text-[#2596be] border border-[#2596be]/20">
                            {category}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {difficulty}
                          </span>
                          {certificateEligible && (
                            <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200 shadow-2xs">
                              🏅 Certificate
                            </span>
                          )}
                          {track === 'optional' && (
                            <span className="text-[10px] font-mono uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-[#e8da4d]/30 text-amber-900 border border-amber-300 animate-pulse">
                              ⚡ 1.5× XP Multiplier
                            </span>
                          )}
                          {getDueDateChip()}
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 font-['Hanken_Grotesk']">
                          {title || 'Untitled Course'}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-mono font-extrabold bg-[#e8da4d] text-slate-950 shadow-xs">
                        ⚡ {computedTotalXp} XP
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{estimatedHours} hrs est.</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-100">
                    {description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs font-mono">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <p className="text-slate-400 uppercase text-[9px]">Sections</p>
                      <p className="font-extrabold text-slate-900">{sections.length}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <p className="text-slate-400 uppercase text-[9px]">Total Lessons</p>
                      <p className="font-extrabold text-slate-900">
                        {sections.reduce((acc, s) => acc + s.lessons.length, 0)}
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <p className="text-slate-400 uppercase text-[9px]">Track</p>
                      <p className="font-extrabold capitalize text-[#2596be]">{track}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <p className="text-slate-400 uppercase text-[9px]">Bonus XP</p>
                      <p className="font-extrabold text-emerald-600">+100 XP</p>
                    </div>
                  </div>
                </div>

                {/* Syllabus Structure Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-500">
                    Syllabus Outline ({sections.length} Sections)
                  </h4>
                  <div className="space-y-2">
                    {sections.map((sec, sIdx) => (
                      <div key={sec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>
                            Section {sIdx + 1}: {sec.title}
                          </span>
                          <span className="font-mono text-slate-500">
                            {sec.lessons.length} lessons · +{sec.xpAward} XP
                          </span>
                        </div>
                        {sec.lessons.length > 0 && (
                          <ul className="mt-2 space-y-1 pl-4 text-slate-600 list-disc">
                            {sec.lessons.map((l) => (
                              <li key={l.id}>
                                {l.title} ({l.kind}, {l.durationMin}m, +{l.xpAward} XP)
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    ← Back: Lessons
                  </button>

                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublish}
                    className="px-7 py-3 bg-gradient-to-r from-[#2596be] via-[#1e7a9c] to-[#ec4899] text-white font-extrabold text-sm rounded-xl shadow-md shadow-[#2596be]/25 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? 'Publishing Course...' : '🚀 Publish Course to Catalog'}
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
