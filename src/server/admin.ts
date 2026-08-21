import { eq, desc, and, inArray, sql, gte, lte, ilike, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import * as admin from '@/contracts/admin'
import { db } from '@/db'
import {
  courses,
  courseSections,
  lessons,
  assessments,
  user,
  enrollments,
  xpEvents,
  submissions,
  aiReviews,
  dailyCheckins,
} from '@/db/schema'
import { validateVideoContent, extractYouTubeVideoId } from '@/lib/video'
import { levelFromXp } from '@/lib/xp'

export type AdminCourse = z.infer<typeof admin.AdminCourse>
export type CreateCourseInput = z.infer<(typeof admin.createCourse)['input']>
export type ListCoursesInput = z.infer<(typeof admin.listCourses)['input']>

export type AdminContentItem = z.infer<typeof admin.AdminContentItem>
export type CreateContentInput = z.infer<(typeof admin.createContent)['input']>
export type UpdateContentInput = z.infer<(typeof admin.updateContent)['input']>

export const toAdminCourse = (row: typeof courses.$inferSelect): AdminCourse => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  subtitle: row.subtitle,
  description: row.description,
  coverEmoji: row.coverEmoji,
  category: row.category as AdminCourse['category'],
  track: row.track as AdminCourse['track'],
  difficulty: row.difficulty as AdminCourse['difficulty'],
  certificateEligible: row.certificateEligible,
  estimatedHours: row.estimatedHours,
  xpBonusOnComplete: row.xpBonusOnComplete,
  dueAt: row.dueAt ? row.dueAt.toISOString() : null,
  status: row.status as AdminCourse['status'],
  mentorId: row.mentorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export async function createCourse(input: CreateCourseInput): Promise<{ course: AdminCourse }> {
  const slug =
    input.slug ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const [existingSlug] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1)

  if (existingSlug) {
    throw new ApiError('CONFLICT', `A course with slug "${slug}" already exists`)
  }

  const mentorId = input.mentorId || 'user-1'
  if (input.mentorId) {
    const [mentorRow] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, input.mentorId))
      .limit(1)

    if (!mentorRow) {
      throw new ApiError('NOT_FOUND', `Mentor with user ID "${input.mentorId}" does not exist`)
    }
  }

  const courseId = input.id || `course-${randomUUID().slice(0, 8)}`

  const [inserted] = await db
    .insert(courses)
    .values({
      id: courseId,
      slug,
      title: input.title,
      subtitle: input.subtitle ?? '',
      description: input.description ?? '',
      coverEmoji: input.coverEmoji ?? '📘',
      category: input.category,
      track: input.track ?? 'mandatory',
      difficulty: input.difficulty ?? 'beginner',
      certificateEligible: input.certificateEligible ?? false,
      estimatedHours: input.estimatedHours ?? 0,
      xpBonusOnComplete: input.xpBonusOnComplete ?? 100,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      status: input.status ?? 'draft',
      mentorId,
    })
    .returning()

  if (!inserted) {
    throw new ApiError('INTERNAL', 'Failed to insert course')
  }

  return { course: toAdminCourse(inserted) }
}

export async function listCourses(input: ListCoursesInput = {}): Promise<{ courses: AdminCourse[] }> {
  const rows = await db
    .select()
    .from(courses)
    .orderBy(desc(courses.createdAt))
    .limit(input.limit ?? 50)

  return { courses: rows.map(toAdminCourse) }
}

// ============================================================================
// Module Content Helpers & Parsers
// ============================================================================

function parseLessonToContentItem(l: typeof lessons.$inferSelect): AdminContentItem {
  let meta: {
    description?: string
    source?: 'YOUTUBE' | 'CLOUD'
    videoId?: string
    status?: 'ACTIVE' | 'INACTIVE'
  } = {}

  try {
    if (l.contentBody && l.contentBody.startsWith('{')) {
      meta = JSON.parse(l.contentBody)
    }
  } catch {
    meta = {}
  }

  const videoId = meta.videoId || extractYouTubeVideoId(l.contentUrl) || undefined
  const source: 'YOUTUBE' | 'CLOUD' = meta.source || (videoId ? 'YOUTUBE' : 'CLOUD')

  return {
    id: l.id,
    moduleId: l.sectionId,
    type: 'VIDEO',
    title: l.title,
    description: meta.description ?? (l.contentBody && !l.contentBody.startsWith('{') ? l.contentBody : ''),
    order: l.orderIndex,
    status: meta.status || 'ACTIVE',
    createdAt: l.createdAt.toISOString(),
    source,
    url: l.contentUrl,
    videoId: source === 'YOUTUBE' ? videoId : undefined,
    durationMin: l.durationMin,
    xp: l.xpAward,
  }
}

function parseAssessmentToContentItem(a: typeof assessments.$inferSelect): AdminContentItem {
  let rubricData: {
    evaluationCriteria?: admin.EvaluationCriterion[]
    taskData?: Record<string, unknown>
    status?: 'ACTIVE' | 'INACTIVE'
  } = {}

  try {
    if (a.rubric && a.rubric.startsWith('{')) {
      rubricData = JSON.parse(a.rubric)
    }
  } catch {
    rubricData = {}
  }

  return {
    id: a.id,
    moduleId: a.sectionId || '',
    type: 'TASK',
    title: a.title,
    description: a.prompt,
    order: a.orderIndex,
    status: rubricData.status || 'ACTIVE',
    createdAt: a.createdAt.toISOString(),
    xp: a.xpAward,
    maxMarks: a.maxScore,
    evaluationCriteria: rubricData.evaluationCriteria || [],
    taskData: rubricData.taskData,
  }
}

// ============================================================================
// Module Content Operations
// ============================================================================

export async function createContent(input: CreateContentInput): Promise<{ content: AdminContentItem }> {
  // 1. Verify that the module (section) exists
  const [section] = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.id, input.id))
    .limit(1)

  if (!section) {
    throw new ApiError('NOT_FOUND', `Module with ID "${input.id}" not found`)
  }

  // 2. Determine target order index if not provided
  let orderIndex = input.order
  if (orderIndex === undefined) {
    const existingLessons = await db
      .select({ order: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.sectionId, input.id))

    const existingAssessments = await db
      .select({ order: assessments.orderIndex })
      .from(assessments)
      .where(eq(assessments.sectionId, input.id))

    const maxOrder = Math.max(
      0,
      ...existingLessons.map((l) => l.order),
      ...existingAssessments.map((a) => a.order),
    )
    orderIndex = maxOrder + 1
  }

  // 3. Handle VIDEO creation
  if (input.type === 'VIDEO') {
    if (!input.source) {
      throw new ApiError('VALIDATION_ERROR', 'Video source is required ("YOUTUBE" or "CLOUD")')
    }
    if (!input.url) {
      throw new ApiError('VALIDATION_ERROR', 'Video URL is required')
    }

    const validation = validateVideoContent(input.source, input.url)
    if (!validation.valid) {
      throw new ApiError('VALIDATION_ERROR', validation.error || 'Invalid video content')
    }

    const contentId = `content-vid-${randomUUID().slice(0, 8)}`
    const meta = {
      description: input.description,
      source: input.source,
      videoId: validation.videoId,
      status: 'ACTIVE' as const,
    }

    const [inserted] = await db
      .insert(lessons)
      .values({
        id: contentId,
        sectionId: input.id,
        title: input.title,
        kind: 'video',
        contentUrl: input.url,
        contentBody: JSON.stringify(meta),
        durationMin: input.durationMin ?? 5,
        orderIndex,
        xpAward: input.xp ?? 10,
      })
      .returning()

    if (!inserted) {
      throw new ApiError('INTERNAL', 'Failed to create video content')
    }

    return { content: parseLessonToContentItem(inserted) }
  }

  // 4. Handle TASK creation
  if (input.type === 'TASK') {
    const contentId = `content-task-${randomUUID().slice(0, 8)}`
    const rubricPayload = {
      evaluationCriteria: input.evaluationCriteria || [],
      taskData: input.taskData || {},
      status: 'ACTIVE' as const,
    }

    const [inserted] = await db
      .insert(assessments)
      .values({
        id: contentId,
        courseId: section.courseId,
        sectionId: input.id,
        title: input.title,
        prompt: input.description || input.title,
        rubric: JSON.stringify(rubricPayload),
        kind: 'assignment',
        maxScore: input.maxMarks ?? 100,
        xpAward: input.xp ?? 50,
        orderIndex,
      })
      .returning()

    if (!inserted) {
      throw new ApiError('INTERNAL', 'Failed to create task content')
    }

    return { content: parseAssessmentToContentItem(inserted) }
  }

  throw new ApiError('VALIDATION_ERROR', `Unsupported content type "${input.type}"`)
}

export async function listContent(moduleId: string): Promise<{ content: AdminContentItem[] }> {
  const [section] = await db
    .select({ id: courseSections.id })
    .from(courseSections)
    .where(eq(courseSections.id, moduleId))
    .limit(1)

  if (!section) {
    throw new ApiError('NOT_FOUND', `Module with ID "${moduleId}" not found`)
  }

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.sectionId, moduleId))

  const assessmentRows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.sectionId, moduleId))

  const allItems: AdminContentItem[] = [
    ...lessonRows.map(parseLessonToContentItem),
    ...assessmentRows.map(parseAssessmentToContentItem),
  ]

  // Sort sequentially by orderIndex
  allItems.sort((a, b) => a.order - b.order)

  return { content: allItems }
}

export async function getContent(contentId: string): Promise<{ content: AdminContentItem }> {
  // Check in lessons (video content)
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, contentId))
    .limit(1)

  if (lesson) {
    return { content: parseLessonToContentItem(lesson) }
  }

  // Check in assessments (task content)
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, contentId))
    .limit(1)

  if (assessment) {
    return { content: parseAssessmentToContentItem(assessment) }
  }

  throw new ApiError('NOT_FOUND', `Content with ID "${contentId}" not found`)
}

export async function updateContent(
  contentId: string,
  input: UpdateContentInput,
): Promise<{ content: AdminContentItem }> {
  // Check if it's a lesson
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, contentId))
    .limit(1)

  if (lesson) {
    let currentMeta: Record<string, any> = {}
    try {
      if (lesson.contentBody && lesson.contentBody.startsWith('{')) {
        currentMeta = JSON.parse(lesson.contentBody)
      }
    } catch {
      currentMeta = {}
    }

    let nextUrl = input.url ?? lesson.contentUrl
    let nextSource = input.source ?? currentMeta.source ?? (extractYouTubeVideoId(nextUrl) ? 'YOUTUBE' : 'CLOUD')
    let nextVideoId = currentMeta.videoId

    if (input.url || input.source) {
      const validation = validateVideoContent(nextSource, nextUrl)
      if (!validation.valid) {
        throw new ApiError('VALIDATION_ERROR', validation.error || 'Invalid video configuration')
      }
      nextVideoId = validation.videoId
    }

    const updatedMeta = {
      ...currentMeta,
      description: input.description ?? currentMeta.description ?? lesson.contentBody,
      source: nextSource,
      videoId: nextVideoId,
    }

    const [updated] = await db
      .update(lessons)
      .set({
        title: input.title ?? lesson.title,
        contentUrl: nextUrl,
        contentBody: JSON.stringify(updatedMeta),
        durationMin: input.durationMin ?? lesson.durationMin,
        orderIndex: input.order ?? lesson.orderIndex,
        xpAward: input.xp ?? lesson.xpAward,
      })
      .where(eq(lessons.id, contentId))
      .returning()

    return { content: parseLessonToContentItem(updated) }
  }

  // Check if it's an assessment
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, contentId))
    .limit(1)

  if (assessment) {
    let currentRubric: Record<string, any> = {}
    try {
      if (assessment.rubric && assessment.rubric.startsWith('{')) {
        currentRubric = JSON.parse(assessment.rubric)
      }
    } catch {
      currentRubric = {}
    }

    const updatedRubric = {
      ...currentRubric,
      evaluationCriteria: input.evaluationCriteria ?? currentRubric.evaluationCriteria ?? [],
      taskData: input.taskData ?? currentRubric.taskData ?? {},
    }

    const [updated] = await db
      .update(assessments)
      .set({
        title: input.title ?? assessment.title,
        prompt: input.description ?? assessment.prompt,
        maxScore: input.maxMarks ?? assessment.maxScore,
        xpAward: input.xp ?? assessment.xpAward,
        orderIndex: input.order ?? assessment.orderIndex,
        rubric: JSON.stringify(updatedRubric),
      })
      .where(eq(assessments.id, contentId))
      .returning()

    return { content: parseAssessmentToContentItem(updated) }
  }

  throw new ApiError('NOT_FOUND', `Content with ID "${contentId}" not found`)
}

export async function setContentStatus(
  contentId: string,
  status: 'ACTIVE' | 'INACTIVE',
): Promise<{ content: AdminContentItem }> {
  // Check lesson
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, contentId))
    .limit(1)

  if (lesson) {
    let meta: Record<string, any> = {}
    try {
      if (lesson.contentBody && lesson.contentBody.startsWith('{')) {
        meta = JSON.parse(lesson.contentBody)
      }
    } catch {
      meta = {}
    }

    meta.status = status

    const [updated] = await db
      .update(lessons)
      .set({ contentBody: JSON.stringify(meta) })
      .where(eq(lessons.id, contentId))
      .returning()

    return { content: parseLessonToContentItem(updated) }
  }

  // Check assessment
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, contentId))
    .limit(1)

  if (assessment) {
    let rubric: Record<string, any> = {}
    try {
      if (assessment.rubric && assessment.rubric.startsWith('{')) {
        rubric = JSON.parse(assessment.rubric)
      }
    } catch {
      rubric = {}
    }

    rubric.status = status

    const [updated] = await db
      .update(assessments)
      .set({ rubric: JSON.stringify(rubric) })
      .where(eq(assessments.id, contentId))
      .returning()

    return { content: parseAssessmentToContentItem(updated) }
  }

  throw new ApiError('NOT_FOUND', `Content with ID "${contentId}" not found`)
}

export async function reorderContent(
  moduleId: string,
  items: { contentId: string; order: number }[],
): Promise<{ success: boolean; reorderedCount: number }> {
  let count = 0

  for (const item of items) {
    // Attempt update in lessons
    const resLesson = await db
      .update(lessons)
      .set({ orderIndex: item.order })
      .where(and(eq(lessons.id, item.contentId), eq(lessons.sectionId, moduleId)))
      .returning({ id: lessons.id })

    if (resLesson.length > 0) {
      count++
      continue
    }

    // Attempt update in assessments
    const resAssessment = await db
      .update(assessments)
      .set({ orderIndex: item.order })
      .where(and(eq(assessments.id, item.contentId), eq(assessments.sectionId, moduleId)))
      .returning({ id: assessments.id })

    if (resAssessment.length > 0) {
      count++
    }
  }

  return { success: true, reorderedCount: count }
}

// ============================================================================
// Helper: maps a user row to AdminUserRow
// ============================================================================

function toAdminUserRow(u: typeof user.$inferSelect): admin.AdminUserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    systemRole: (u.systemRole ?? 'student') as admin.SystemRole,
    cohortYear: u.cohortYear ?? '',
    campus: u.campus ?? '',
    createdAt: u.createdAt.toISOString(),
  }
}

// ============================================================================
// Helper: maps a course row to AdminModule
// ============================================================================

function toAdminModule(c: typeof courses.$inferSelect): admin.AdminModule {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    difficulty: c.difficulty as admin.CourseDifficulty,
    durationMin: (c.estimatedHours ?? 0) * 60,
    category: c.category,
    track: c.track as admin.CourseTrack,
    status: c.status as admin.CourseStatus,
    createdAt: c.createdAt.toISOString(),
  }
}

// ============================================================================
// Helper: maps an assessment row to AdminTask
// ============================================================================

function toAdminTask(a: typeof assessments.$inferSelect): admin.AdminTask {
  let rubricData: {
    evaluationCriteria?: admin.EvaluationCriterion[]
    taskData?: Record<string, unknown>
    status?: 'active' | 'inactive'
  } = {}

  try {
    if (a.rubric && a.rubric.startsWith('{')) {
      rubricData = JSON.parse(a.rubric)
    }
  } catch {
    rubricData = {}
  }

  return {
    id: a.id,
    moduleId: a.courseId,
    title: a.title,
    description: a.prompt,
    xp: a.xpAward,
    maxMarks: a.maxScore,
    evaluationCriteria: rubricData.evaluationCriteria ?? [],
    taskData: rubricData.taskData,
    status: (rubricData.status ?? 'active') as admin.TaskStatus,
    createdAt: a.createdAt.toISOString(),
  }
}

// ============================================================================
// Module CRUD (AdminModule maps to courses table)
// ============================================================================

export async function createModule(
  input: z.infer<(typeof admin.createModule)['input']>,
  adminId: string,
): Promise<{ module: admin.AdminModule }> {
  const slugBase = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const slug = `${slugBase}-${randomUUID().slice(0, 6)}`

  const [inserted] = await db
    .insert(courses)
    .values({
      id: `module-${randomUUID().slice(0, 8)}`,
      slug,
      title: input.title,
      subtitle: '',
      description: input.description ?? '',
      coverEmoji: '📘',
      category: input.category as 'technical' | 'business' | 'communication' | 'leadership' | 'wellbeing',
      track: input.track as 'mandatory' | 'optional',
      difficulty: input.difficulty as 'beginner' | 'intermediate' | 'advanced',
      certificateEligible: false,
      estimatedHours: Math.ceil((input.durationMin ?? 60) / 60),
      xpBonusOnComplete: 100,
      dueAt: null,
      status: 'draft' as const,
      mentorId: adminId,
    })
    .returning()

  if (!inserted) throw new ApiError('INTERNAL', 'Failed to create module')
  return { module: toAdminModule(inserted) }
}

export async function listModules(
  input: z.infer<(typeof admin.listModules)['input']> = {},
): Promise<{ modules: admin.AdminModule[] }> {
  const conditions = [
    input.status ? eq(courses.status, input.status as any) : undefined,
    input.track ? eq(courses.track, input.track as any) : undefined,
  ].filter(Boolean)

  const rows = await db
    .select()
    .from(courses)
    .where(conditions.length ? and(...(conditions as any[])) : undefined)
    .orderBy(desc(courses.createdAt))
    .limit(input.limit ?? 50)

  return { modules: rows.map(toAdminModule) }
}

export async function getModule(
  input: z.infer<(typeof admin.getModule)['input']>,
): Promise<{ module: admin.AdminModule }> {
  const [row] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1)
  if (!row) throw new ApiError('NOT_FOUND', `Module "${input.id}" not found`)
  return { module: toAdminModule(row) }
}

export async function updateModule(
  input: z.infer<(typeof admin.updateModule)['input']>,
): Promise<{ module: admin.AdminModule }> {
  const updates: Partial<typeof courses.$inferInsert> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.difficulty !== undefined) updates.difficulty = input.difficulty as any
  if (input.durationMin !== undefined) updates.estimatedHours = Math.ceil(input.durationMin / 60)
  if (input.category !== undefined) updates.category = input.category as any
  if (input.track !== undefined) updates.track = input.track as any
  if (input.status !== undefined) updates.status = input.status as any

  const [updated] = await db
    .update(courses)
    .set(updates)
    .where(eq(courses.id, input.id))
    .returning()

  if (!updated) throw new ApiError('NOT_FOUND', `Module "${input.id}" not found`)
  return { module: toAdminModule(updated) }
}

// ============================================================================
// Task CRUD (AdminTask maps to assessments table)
// ============================================================================

export async function createTask(
  input: z.infer<(typeof admin.createTask)['input']>,
): Promise<{ task: admin.AdminTask }> {
  // Verify the module (course) exists
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, input.id)).limit(1)
  if (!course) throw new ApiError('NOT_FOUND', `Module "${input.id}" not found`)

  // Auto-assign orderIndex
  const existingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assessments)
    .where(eq(assessments.courseId, input.id))
  const orderIndex = (existingCount[0]?.count ?? 0) + 1

  const rubric = JSON.stringify({
    evaluationCriteria: input.evaluationCriteria,
    taskData: input.taskData ?? {},
    status: 'active',
  })

  const [inserted] = await db
    .insert(assessments)
    .values({
      id: `task-${randomUUID().slice(0, 8)}`,
      courseId: input.id,
      sectionId: null,
      title: input.title,
      prompt: input.description,
      rubric,
      kind: 'assignment',
      maxScore: input.maxMarks,
      xpAward: input.xp,
      orderIndex,
    })
    .returning()

  if (!inserted) throw new ApiError('INTERNAL', 'Failed to create task')
  return { task: toAdminTask(inserted) }
}

export async function listTasks(
  input: z.infer<(typeof admin.listTasks)['input']>,
): Promise<{ tasks: admin.AdminTask[] }> {
  const rows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.courseId, input.id))
    .orderBy(assessments.orderIndex)

  return { tasks: rows.map(toAdminTask) }
}

export async function getTask(
  input: z.infer<(typeof admin.getTask)['input']>,
): Promise<{ task: admin.AdminTask }> {
  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, input.taskId))
    .limit(1)

  if (!row) throw new ApiError('NOT_FOUND', `Task "${input.taskId}" not found`)
  return { task: toAdminTask(row) }
}

export async function updateTask(
  input: z.infer<(typeof admin.updateTask)['input']>,
): Promise<{ task: admin.AdminTask }> {
  const [existing] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, input.taskId))
    .limit(1)

  if (!existing) throw new ApiError('NOT_FOUND', `Task "${input.taskId}" not found`)

  let rubricData: Record<string, unknown> = {}
  try {
    if (existing.rubric?.startsWith('{')) rubricData = JSON.parse(existing.rubric)
  } catch {
    rubricData = {}
  }

  const updatedRubric = JSON.stringify({
    ...rubricData,
    evaluationCriteria: input.evaluationCriteria ?? rubricData.evaluationCriteria ?? [],
    taskData: input.taskData ?? rubricData.taskData ?? {},
  })

  const [updated] = await db
    .update(assessments)
    .set({
      title: input.title ?? existing.title,
      prompt: input.description ?? existing.prompt,
      maxScore: input.maxMarks ?? existing.maxScore,
      xpAward: input.xp ?? existing.xpAward,
      rubric: updatedRubric,
    })
    .where(eq(assessments.id, input.taskId))
    .returning()

  return { task: toAdminTask(updated) }
}

export async function setTaskStatus(
  input: z.infer<(typeof admin.setTaskStatus)['input']>,
): Promise<{ task: admin.AdminTask }> {
  const [existing] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, input.taskId))
    .limit(1)

  if (!existing) throw new ApiError('NOT_FOUND', `Task "${input.taskId}" not found`)

  let rubricData: Record<string, unknown> = {}
  try {
    if (existing.rubric?.startsWith('{')) rubricData = JSON.parse(existing.rubric)
  } catch {
    rubricData = {}
  }

  rubricData.status = input.status

  const [updated] = await db
    .update(assessments)
    .set({ rubric: JSON.stringify(rubricData) })
    .where(eq(assessments.id, input.taskId))
    .returning()

  return { task: toAdminTask(updated) }
}

// ============================================================================
// Admin Report
// ============================================================================

export async function getReport(
  input: z.infer<(typeof admin.getReport)['input']>,
): Promise<{ rows: admin.AdminReportRow[]; totals: admin.AdminReportTotals }> {
  const conditions = [
    input.cohortYear ? eq(user.cohortYear, input.cohortYear) : undefined,
    input.courseId ? eq(enrollments.courseId, input.courseId) : undefined,
    input.track ? eq(courses.track, input.track as any) : undefined,
    input.status ? eq(enrollments.status, input.status as any) : undefined,
    input.from ? gte(enrollments.enrolledAt, new Date(input.from)) : undefined,
    input.to ? lte(enrollments.enrolledAt, new Date(input.to)) : undefined,
  ].filter(Boolean) as any[]

  const rows = await db
    .select({
      studentId: user.id,
      studentName: user.name,
      cohortYear: user.cohortYear,
      campus: user.campus,
      courseTitle: courses.title,
      track: courses.track,
      status: enrollments.status,
      progressPct: enrollments.progressPct,
      xpEarned: enrollments.xpEarned,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(user, eq(enrollments.studentId, user.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(enrollments.enrolledAt))
    .limit(input.limit ?? 500)

  // Compute totals from the result set
  const uniqueStudentIds = [...new Set(rows.map((r) => r.studentId))]
  const completed = rows.filter((r) => r.status === 'completed').length
  const completionRate = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0
  const totalXp = rows.reduce((acc, r) => acc + r.xpEarned, 0)
  const avgXp = uniqueStudentIds.length > 0 ? Math.round(totalXp / uniqueStudentIds.length) : 0

  // Active this month = distinct students with any xp_event in current calendar month
  let activeThisMonth = 0
  if (uniqueStudentIds.length > 0) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const activeRows = await db
      .selectDistinct({ userId: xpEvents.userId })
      .from(xpEvents)
      .where(
        and(
          inArray(xpEvents.userId, uniqueStudentIds),
          gte(xpEvents.createdAt, startOfMonth),
        ),
      )
    activeThisMonth = activeRows.length
  }

  const engagementRate =
    uniqueStudentIds.length > 0 ? Math.round((activeThisMonth / uniqueStudentIds.length) * 100) : 0

  return {
    rows: rows.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      cohortYear: r.cohortYear ?? '',
      campus: r.campus ?? '',
      courseTitle: r.courseTitle,
      track: r.track as admin.CourseTrack,
      status: r.status as admin.EnrollmentStatus,
      progressPct: r.progressPct,
      xpEarned: r.xpEarned,
      enrolledAt: r.enrolledAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      lastActiveAt: null, // fetching per-row lastActiveAt requires N queries; omit for perf
    })),
    totals: {
      students: uniqueStudentIds.length,
      enrollments: rows.length,
      completed,
      completionRate,
      totalXp,
      avgXp,
      activeThisMonth,
      engagementRate,
    },
  }
}

// ============================================================================
// User Management
// ============================================================================

export async function listUsers(
  input: z.infer<(typeof admin.listUsers)['input']>,
): Promise<{ users: admin.AdminUserRow[] }> {
  const conditions = [
    input.role ? eq(user.systemRole, input.role) : undefined,
    input.q
      ? or(ilike(user.name, `%${input.q}%`), ilike(user.email, `%${input.q}%`))
      : undefined,
  ].filter(Boolean) as any[]

  const rows = await db
    .select()
    .from(user)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(input.limit ?? 100)

  return { users: rows.map(toAdminUserRow) }
}

export async function setRole(
  input: z.infer<(typeof admin.setRole)['input']>,
  adminId: string,
): Promise<{ user: admin.AdminUserRow }> {
  if (input.id === adminId) {
    throw new ApiError('FORBIDDEN', 'You cannot change your own role')
  }

  const [updated] = await db
    .update(user)
    .set({ systemRole: input.role })
    .where(eq(user.id, input.id))
    .returning()

  if (!updated) throw new ApiError('NOT_FOUND', `User "${input.id}" not found`)
  return { user: toAdminUserRow(updated) }
}

// ============================================================================
// Student Roster with Aggregates and Flags
// ============================================================================

export async function listStudents(
  input: z.infer<(typeof admin.listStudents)['input']>,
): Promise<{ students: admin.AdminStudentRow[] }> {
  // 1. Fetch matching students
  const conditions = [
    eq(user.systemRole, 'student'),
    input.cohortYear ? eq(user.cohortYear, input.cohortYear) : undefined,
    input.campus ? eq(user.campus, input.campus) : undefined,
    input.q
      ? or(ilike(user.name, `%${input.q}%`), ilike(user.email, `%${input.q}%`))
      : undefined,
  ].filter(Boolean) as any[]

  const studentUsers = await db
    .select()
    .from(user)
    .where(and(...conditions))
    .orderBy(desc(user.createdAt))
    .limit(input.limit ?? 100)

  if (studentUsers.length === 0) return { students: [] }

  const studentIds = studentUsers.map((u) => u.id)

  // 2. Enrollments (with course dueAt for overdue flag)
  const studentEnrollments = await db
    .select({
      studentId: enrollments.studentId,
      courseId: enrollments.courseId,
      status: enrollments.status,
      progressPct: enrollments.progressPct,
      xpEarned: enrollments.xpEarned,
      enrolledAt: enrollments.enrolledAt,
      courseDueAt: courses.dueAt,
      courseTrack: courses.track,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(inArray(enrollments.studentId, studentIds))

  // 3. XP totals per student
  const xpTotalsRows = await db
    .select({
      userId: xpEvents.userId,
      totalXp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int`,
    })
    .from(xpEvents)
    .where(inArray(xpEvents.userId, studentIds))
    .groupBy(xpEvents.userId)

  const xpByUser = Object.fromEntries(xpTotalsRows.map((r) => [r.userId, r.totalXp]))

  // 4. Pending submissions per student (status: submitted or ai_reviewed)
  const pendingRows = await db
    .select({
      studentId: submissions.studentId,
      pending: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .where(
      and(
        inArray(submissions.studentId, studentIds),
        inArray(submissions.status, ['submitted', 'ai_reviewed'] as any[]),
      ),
    )
    .groupBy(submissions.studentId)

  const pendingByUser = Object.fromEntries(pendingRows.map((r) => [r.studentId, r.pending]))

  // 5. Last activity from submissions (max submittedAt)
  const lastSubmissionRows = await db
    .select({
      studentId: submissions.studentId,
      lastAt: sql<string>`max(${submissions.submittedAt})`,
    })
    .from(submissions)
    .where(inArray(submissions.studentId, studentIds))
    .groupBy(submissions.studentId)

  const lastSubmitByUser = Object.fromEntries(lastSubmissionRows.map((r) => [r.studentId, r.lastAt]))

  // 6. Last check-in per student
  const lastCheckinRows = await db
    .select({
      userId: dailyCheckins.userId,
      lastAt: sql<string>`max(${dailyCheckins.createdAt})`,
    })
    .from(dailyCheckins)
    .where(inArray(dailyCheckins.userId, studentIds))
    .groupBy(dailyCheckins.userId)

  const lastCheckinByUser = Object.fromEntries(lastCheckinRows.map((r) => [r.userId, r.lastAt]))

  // 7. Changes-requested submissions (for awaiting_resubmit flag)
  const changesRequestedRows = await db
    .select({
      studentId: submissions.studentId,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .where(
      and(
        inArray(submissions.studentId, studentIds),
        eq(submissions.status, 'changes_requested'),
      ),
    )

  const changesRequestedByUser = new Set(changesRequestedRows.map((r) => r.studentId))
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const changesOldByUser = new Set(
    changesRequestedRows
      .filter((r) => r.submittedAt < threeDaysAgo)
      .map((r) => r.studentId),
  )

  // 8. Assemble per-student row
  const result: admin.AdminStudentRow[] = studentUsers
    .map((u) => {
      const myEnrollments = studentEnrollments.filter((e) => e.studentId === u.id)
      const totalXp = xpByUser[u.id] ?? 0
      const level = levelFromXp(totalXp)
      const coursesEnrolled = myEnrollments.length
      const coursesCompleted = myEnrollments.filter((e) => e.status === 'completed').length
      const avgProgressPct =
        coursesEnrolled > 0
          ? Math.round(myEnrollments.reduce((acc, e) => acc + e.progressPct, 0) / coursesEnrolled)
          : 0

      // lastActiveAt = max of submissions, checkins
      const candidates = [lastSubmitByUser[u.id], lastCheckinByUser[u.id]].filter(Boolean)
      const lastActiveAt = candidates.length > 0 ? candidates.sort().at(-1)! : null

      // Compute flags
      const flags: admin.StudentFlag[] = []

      // overdue: mandatory course with dueAt < now and not completed
      const hasOverdue = myEnrollments.some(
        (e) =>
          e.courseTrack === 'mandatory' &&
          e.courseDueAt !== null &&
          e.courseDueAt < now &&
          e.status !== 'completed',
      )
      if (hasOverdue) flags.push('overdue')

      // inactive: no activity in last 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastActive = lastActiveAt ? new Date(lastActiveAt) : null
      if (!lastActive || lastActive < sevenDaysAgo) flags.push('inactive')

      // stalled: progressPct < 25 on a course enrolled > 14 days ago and not completed
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const hasStalled = myEnrollments.some(
        (e) =>
          e.progressPct < 25 &&
          e.enrolledAt < fourteenDaysAgo &&
          e.status !== 'completed',
      )
      if (hasStalled) flags.push('stalled')

      // awaiting_resubmit: changes_requested submission older than 3 days
      if (changesOldByUser.has(u.id)) flags.push('awaiting_resubmit')

      // Apply flag filter if requested
      if (input.flag && !flags.includes(input.flag)) return null

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        image: u.image ?? null,
        cohortYear: u.cohortYear ?? '',
        campus: u.campus ?? '',
        totalXp,
        level,
        coursesEnrolled,
        coursesCompleted,
        avgProgressPct,
        lastActiveAt: lastActiveAt ?? null,
        pendingSubmissions: pendingByUser[u.id] ?? 0,
        flags,
      } satisfies admin.AdminStudentRow
    })
    .filter((s): s is admin.AdminStudentRow => s !== null)

  return { students: result }
}

// ============================================================================
// Single Student Performance Breakdown
// ============================================================================

export async function studentPerformance(
  input: z.infer<(typeof admin.studentPerformance)['input']>,
): Promise<z.infer<(typeof admin.studentPerformance)['output']>> {
  // Reuse listStudents for the aggregated student row
  const { students } = await listStudents({ limit: 1, q: input.userId })
  // If not found by q search, try direct ID lookup
  const [userRow] = await db.select().from(user).where(eq(user.id, input.userId)).limit(1)
  if (!userRow) throw new ApiError('NOT_FOUND', `Student "${input.userId}" not found`)

  // Compute the student row directly
  const { students: [studentRow] } = await listStudents({ limit: 100 })
  // Actually let's just do direct lookups

  const myEnrollments = await db
    .select({
      courseId: enrollments.courseId,
      courseTitle: courses.title,
      track: courses.track,
      progressPct: enrollments.progressPct,
      xpEarned: enrollments.xpEarned,
      status: enrollments.status,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, input.userId))

  const mySubmissions = await db
    .select({
      id: submissions.id,
      assessmentTitle: assessments.title,
      courseTitle: courses.title,
      status: submissions.status,
      maxScore: assessments.maxScore,
      score: submissions.finalScore,
      xpAwarded: submissions.finalXp,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .where(eq(submissions.studentId, input.userId))
    .orderBy(desc(submissions.submittedAt))

  // Evaluations = mentor-approved submissions with notes
  const myEvaluations = await db
    .select({
      id: submissions.id,
      assessmentTitle: assessments.title,
      score: submissions.finalScore,
      xpAwarded: submissions.finalXp,
      feedback: submissions.mentorNote,
      evaluatedAt: submissions.reviewedAt,
    })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .where(
      and(
        eq(submissions.studentId, input.userId),
        eq(submissions.status, 'mentor_approved'),
      ),
    )
    .orderBy(desc(submissions.reviewedAt))

  // Build student summary
  const xpRows = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, input.userId))

  const totalXp = xpRows[0]?.total ?? 0

  const studentSummary: admin.AdminStudentRow = {
    userId: userRow.id,
    name: userRow.name,
    email: userRow.email,
    image: userRow.image ?? null,
    cohortYear: userRow.cohortYear ?? '',
    campus: userRow.campus ?? '',
    totalXp,
    level: levelFromXp(totalXp),
    coursesEnrolled: myEnrollments.length,
    coursesCompleted: myEnrollments.filter((e) => e.status === 'completed').length,
    avgProgressPct:
      myEnrollments.length > 0
        ? Math.round(myEnrollments.reduce((a, e) => a + e.progressPct, 0) / myEnrollments.length)
        : 0,
    lastActiveAt: null,
    pendingSubmissions: mySubmissions.filter((s) =>
      ['submitted', 'ai_reviewed'].includes(s.status),
    ).length,
    flags: [],
  }

  return {
    student: studentSummary,
    enrollments: myEnrollments.map((e) => ({
      courseId: e.courseId,
      courseTitle: e.courseTitle,
      track: e.track as admin.CourseTrack,
      progressPct: e.progressPct,
      xpEarned: e.xpEarned,
      status: e.status as admin.EnrollmentStatus,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    })),
    submissions: mySubmissions.map((s) => ({
      id: s.id,
      assessmentTitle: s.assessmentTitle,
      courseTitle: s.courseTitle,
      status: s.status as admin.SubmissionStatus,
      maxScore: s.maxScore,
      score: s.score ?? null,
      xpAwarded: s.xpAwarded ?? null,
      submittedAt: s.submittedAt.toISOString(),
    })),
    evaluations: myEvaluations
      .filter((e) => e.evaluatedAt !== null)
      .map((e) => ({
        id: e.id,
        assessmentTitle: e.assessmentTitle,
        score: e.score ?? 0,
        xpAwarded: e.xpAwarded ?? 0,
        feedback: e.feedback || '',
        evaluatedAt: e.evaluatedAt!.toISOString(),
      })),
  }
}

// ============================================================================
// Evaluations Monitoring
// ============================================================================

export async function listEvaluations(
  input: z.infer<(typeof admin.listEvaluations)['input']>,
): Promise<{ evaluations: admin.AdminEvaluationRow[] }> {
  const conditions = [
    input.status ? eq(submissions.status, input.status as any) : undefined,
    input.courseId ? eq(assessments.courseId, input.courseId) : undefined,
    input.studentId ? eq(submissions.studentId, input.studentId) : undefined,
  ].filter(Boolean) as any[]

  const rows = await db
    .select({
      submissionId: submissions.id,
      studentId: submissions.studentId,
      studentName: user.name,
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      courseTitle: courses.title,
      score: submissions.finalScore,
      xpAwarded: submissions.finalXp,
      status: submissions.status,
      feedback: submissions.mentorNote,
      submittedAt: submissions.submittedAt,
      evaluatedAt: submissions.reviewedAt,
    })
    .from(submissions)
    .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .innerJoin(user, eq(submissions.studentId, user.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(submissions.submittedAt))
    .limit(input.limit ?? 100)

  return {
    evaluations: rows.map((r) => ({
      submissionId: r.submissionId,
      studentId: r.studentId,
      studentName: r.studentName,
      assessmentId: r.assessmentId,
      assessmentTitle: r.assessmentTitle,
      courseTitle: r.courseTitle,
      score: r.score ?? null,
      xpAwarded: r.xpAwarded ?? null,
      status: r.status as admin.SubmissionStatus,
      feedback: r.feedback || null,
      submittedAt: r.submittedAt.toISOString(),
      evaluatedAt: r.evaluatedAt ? r.evaluatedAt.toISOString() : null,
    })),
  }
}
