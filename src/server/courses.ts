import { eq, desc, and, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { z } from 'zod'

import { ApiError } from '@/contracts/_kit'
import type * as coursesContract from '@/contracts/courses'
import { db } from '@/db'
import { courses, courseSections, lessons, user, assessments } from '@/db/schema'
import { applyTrack } from '@/lib/xp'

export type Course = z.infer<typeof coursesContract.Course>
export type CreateInput = z.infer<(typeof coursesContract.create)['input']>
export type ListInput = z.infer<(typeof coursesContract.list)['input']>
export type Section = z.infer<typeof coursesContract.Section>
export type Lesson = z.infer<typeof coursesContract.Lesson>

export async function createCourse(
  input: CreateInput,
  sessionUser?: { id: string; systemRole?: string | null } | null,
): Promise<{ course: Course }> {
  const slug =
    input.slug ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  // Check if course with same slug already exists
  const [existingSlug] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1)

  if (existingSlug) {
    throw new ApiError('CONFLICT', `A course with slug "${slug}" already exists`)
  }

  const mentorId = input.mentorId || sessionUser?.id
  if (!mentorId) {
    throw new ApiError('VALIDATION_ERROR', 'mentorId is required')
  }

  // Verify mentor exists in user table
  const [mentorRow] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, mentorId))
    .limit(1)

  if (!mentorRow) {
    throw new ApiError('NOT_FOUND', `Mentor with id "${mentorId}" not found`)
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
    throw new ApiError('INTERNAL', 'Failed to create course')
  }

  let totalSections = 0
  let totalLessons = 0
  if (input.sections && input.sections.length > 0) {
    for (const [sIdx, s] of input.sections.entries()) {
      const sectionId = `sec-${randomUUID().slice(0, 8)}`
      
      let summaryText = s.summary ?? ''
      if (s.type && s.type !== 'online_course') {
        const metaObj = {
          type: s.type,
          summary: s.summary,
          meta: s.meta ?? {},
        }
        summaryText = JSON.stringify(metaObj)
      }

      await db.insert(courseSections).values({
        id: sectionId,
        courseId: inserted.id,
        title: s.title,
        summary: summaryText,
        orderIndex: s.orderIndex ?? sIdx,
        xpAward: s.xpAward ?? 50,
      })
      totalSections++

      if (s.type === 'assignment' || s.type === 'project') {
        const assessmentId = `asmt-${randomUUID().slice(0, 8)}`
        const rubricText = s.meta?.rubric
          ? typeof s.meta.rubric === 'string'
            ? s.meta.rubric
            : JSON.stringify(s.meta.rubric)
          : 'Evaluation Rubric: Evidence (25%), Analysis (35%), Clarity (20%), Execution (20%)'

        await db.insert(assessments).values({
          id: assessmentId,
          courseId: inserted.id,
          sectionId,
          title: s.title,
          prompt: s.summary || s.title,
          rubric: rubricText,
          kind: s.type === 'project' ? 'project' : 'assignment',
          maxScore: (s.meta?.maxScore as number) ?? 100,
          xpAward: s.xpAward ?? 150,
          orderIndex: sIdx,
        })
      }

      if (s.lessons && s.lessons.length > 0) {
        for (const [lIdx, l] of s.lessons.entries()) {
          const lessonId = `les-${randomUUID().slice(0, 8)}`
          const validKind =
            l.kind === 'video' || l.kind === 'reading' || l.kind === 'link' ? l.kind : 'reading'

          await db.insert(lessons).values({
            id: lessonId,
            sectionId,
            title: l.title,
            kind: validKind,
            contentUrl: l.contentUrl ?? '',
            contentBody: l.contentBody ?? '',
            durationMin: l.durationMin ?? 10,
            orderIndex: l.orderIndex ?? lIdx,
            xpAward: l.xpAward ?? 10,
          })
          totalLessons++
        }
      }
    }
  }

  const totalXp = applyTrack(inserted.xpBonusOnComplete, inserted.track)

  return {
    course: {
      id: inserted.id,
      slug: inserted.slug,
      title: inserted.title,
      subtitle: inserted.subtitle,
      description: inserted.description,
      coverEmoji: inserted.coverEmoji,
      category: inserted.category as Course['category'],
      track: inserted.track as Course['track'],
      difficulty: inserted.difficulty as Course['difficulty'],
      certificateEligible: inserted.certificateEligible,
      estimatedHours: inserted.estimatedHours,
      xpBonusOnComplete: inserted.xpBonusOnComplete,
      totalXp: input.totalXp ?? totalXp,
      dueAt: inserted.dueAt ? inserted.dueAt.toISOString() : null,
      status: inserted.status as Course['status'],
      mentorId: inserted.mentorId,
      mentorName: mentorRow.name || 'Mentor',
      sectionCount: totalSections,
      lessonCount: totalLessons,
      enrolledCount: 0,
      createdAt: inserted.createdAt.toISOString(),
    },
  }
}

export async function listCourses(
  input: ListInput = {},
  sessionUser?: { id: string; systemRole?: string | null } | null,
): Promise<{ courses: Course[] }> {
  const conditions = []
  if (input.track) conditions.push(eq(courses.track, input.track))
  if (input.category) conditions.push(eq(courses.category, input.category))
  if (input.difficulty) conditions.push(eq(courses.difficulty, input.difficulty))

  // Students and general users only ever see 'published' courses.
  // Admins can see all or filter by requested status. Mentors can see their own courses.
  if (sessionUser?.systemRole === 'admin') {
    if (input.status) conditions.push(eq(courses.status, input.status))
  } else if (sessionUser?.systemRole === 'mentor') {
    if (input.status) {
      conditions.push(sql`(${courses.status} = ${input.status} AND ${courses.mentorId} = ${sessionUser.id}) OR ${courses.status} = 'published'`)
    } else {
      conditions.push(sql`${courses.status} = 'published' OR ${courses.mentorId} = ${sessionUser.id}`)
    }
  } else {
    // Standard student / user role: strictly published only
    conditions.push(eq(courses.status, 'published'))
  }

  const rows = await db
    .select({
      course: courses,
      mentorName: user.name,
    })
    .from(courses)
    .leftJoin(user, eq(courses.mentorId, user.id))
    .where(and(...conditions))
    .orderBy(desc(courses.createdAt))
    .limit(input.limit ?? 50)

  const result: Course[] = rows.map(({ course: c, mentorName }) => {
    const totalXp = applyTrack(c.xpBonusOnComplete, c.track)
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      coverEmoji: c.coverEmoji,
      category: c.category as Course['category'],
      track: c.track as Course['track'],
      difficulty: c.difficulty as Course['difficulty'],
      certificateEligible: c.certificateEligible,
      estimatedHours: c.estimatedHours,
      xpBonusOnComplete: c.xpBonusOnComplete,
      totalXp,
      dueAt: c.dueAt ? c.dueAt.toISOString() : null,
      status: c.status as Course['status'],
      mentorId: c.mentorId,
      mentorName: mentorName || '',
      sectionCount: 0,
      lessonCount: 0,
      enrolledCount: 0,
      createdAt: c.createdAt.toISOString(),
    }
  })

  return { courses: result }
}

export async function getCourse(
  slug: string,
  sessionUser?: { id: string; systemRole?: string | null } | null,
): Promise<{ course: Course; sections: Section[] }> {
  const [courseRow] = await db
    .select({
      course: courses,
      mentorName: user.name,
    })
    .from(courses)
    .leftJoin(user, eq(courses.mentorId, user.id))
    .where(eq(courses.slug, slug))
    .limit(1)

  if (!courseRow) {
    throw new ApiError('NOT_FOUND', `Course with slug "${slug}" not found`)
  }

  const { course: c, mentorName } = courseRow

  // If the course is not published, only an admin or the owning mentor can view it
  if (c.status !== 'published') {
    const isAuthorized =
      sessionUser && (sessionUser.systemRole === 'admin' || sessionUser.id === c.mentorId)
    if (!isAuthorized) {
      throw new ApiError('NOT_FOUND', `Course with slug "${slug}" not found or is not published`)
    }
  }

  // Fetch sections
  const secRows = await db
    .select()
    .from(courseSections)
    .where(eq(courseSections.courseId, c.id))
    .orderBy(courseSections.orderIndex)

  // Fetch lessons for all sections
  const secIds = secRows.map((s) => s.id)
  let lessonRows: (typeof lessons.$inferSelect)[] = []
  if (secIds.length > 0) {
    lessonRows = await db
      .select()
      .from(lessons)
      .where(sql`${lessons.sectionId} IN ${secIds}`)
      .orderBy(lessons.orderIndex)
  }

  const sections: Section[] = secRows.map((s) => ({
    id: s.id,
    courseId: s.courseId,
    title: s.title,
    summary: s.summary,
    orderIndex: s.orderIndex,
    xpAward: s.xpAward,
    lessons: lessonRows
      .filter((l) => l.sectionId === s.id)
      .map((l) => ({
        id: l.id,
        sectionId: l.sectionId,
        title: l.title,
        kind: l.kind as Lesson['kind'],
        contentUrl: l.contentUrl,
        contentBody: l.contentBody,
        durationMin: l.durationMin,
        orderIndex: l.orderIndex,
        xpAward: l.xpAward,
      })),
  }))

  const lessonCount = lessonRows.length
  const totalBaseXp =
    c.xpBonusOnComplete +
    secRows.reduce((acc, s) => acc + s.xpAward, 0) +
    lessonRows.reduce((acc, l) => acc + l.xpAward, 0)

  const totalXp = applyTrack(totalBaseXp, c.track)

  return {
    course: {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      coverEmoji: c.coverEmoji,
      category: c.category as Course['category'],
      track: c.track as Course['track'],
      difficulty: c.difficulty as Course['difficulty'],
      certificateEligible: c.certificateEligible,
      estimatedHours: c.estimatedHours,
      xpBonusOnComplete: c.xpBonusOnComplete,
      totalXp,
      dueAt: c.dueAt ? c.dueAt.toISOString() : null,
      status: c.status as Course['status'],
      mentorId: c.mentorId,
      mentorName: mentorName || '',
      sectionCount: secRows.length,
      lessonCount,
      enrolledCount: 0,
      createdAt: c.createdAt.toISOString(),
    },
    sections,
  }
}

export async function listMentorCourses(
  sessionUser?: { id: string; systemRole?: string | null } | null,
): Promise<{
  courses: {
    id: string
    title: string
    track: Course['track']
    enrolledCount: number
    avgProgressPct: number
    completionRate: number
  }[]
}> {
  const mentorId = sessionUser?.id
  const conditions = mentorId && sessionUser?.systemRole !== 'admin'
    ? [eq(courses.mentorId, mentorId)]
    : []

  const courseRows = await db
    .select({
      id: courses.id,
      title: courses.title,
      track: courses.track,
    })
    .from(courses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(courses.createdAt))

  return {
    courses: courseRows.map((c) => ({
      id: c.id,
      title: c.title,
      track: c.track as Course['track'],
      enrolledCount: 0,
      avgProgressPct: 0,
      completionRate: 0,
    })),
  }
}
