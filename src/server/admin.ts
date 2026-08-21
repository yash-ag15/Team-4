import { eq, desc, asc, and, inArray } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import * as admin from '@/contracts/admin'
import { db } from '@/db'
import { courses, courseSections, lessons, assessments, user } from '@/db/schema'
import { validateVideoContent, extractYouTubeVideoId } from '@/lib/video'

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
