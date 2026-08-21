import { z } from 'zod'
import { defineContract } from './_kit'

// ============================================================================
// Enums
// ============================================================================

export const CourseTrack = z.enum(['mandatory', 'optional'])
export type CourseTrack = z.infer<typeof CourseTrack>

export const CourseCategory = z.enum([
  'technical',
  'business',
  'communication',
  'leadership',
  'wellbeing',
])
export type CourseCategory = z.infer<typeof CourseCategory>

export const CourseDifficulty = z.enum(['beginner', 'intermediate', 'advanced'])
export type CourseDifficulty = z.infer<typeof CourseDifficulty>

export const CourseStatus = z.enum(['draft', 'published', 'archived'])
export type CourseStatus = z.infer<typeof CourseStatus>

export const LessonKind = z.enum(['video', 'reading', 'link'])
export type LessonKind = z.infer<typeof LessonKind>

// ============================================================================
// Schemas
// ============================================================================

export const Lesson = z.object({
  id: z.string(),
  sectionId: z.string(),
  title: z.string(),
  kind: LessonKind,
  contentUrl: z.string(),
  contentBody: z.string(),
  durationMin: z.number().int(),
  orderIndex: z.number().int(),
  xpAward: z.number().int(),
})
export type Lesson = z.infer<typeof Lesson>

export const Section = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  summary: z.string(),
  orderIndex: z.number().int(),
  xpAward: z.number().int(),
  lessons: z.array(Lesson).default([]),
})
export type Section = z.infer<typeof Section>

export const Course = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  coverEmoji: z.string(),
  category: CourseCategory,
  track: CourseTrack,
  difficulty: CourseDifficulty,
  certificateEligible: z.boolean(),
  estimatedHours: z.number().int(),
  xpBonusOnComplete: z.number().int(),
  totalXp: z.number().int(),
  dueAt: z.string().nullable(),
  status: CourseStatus,
  mentorId: z.string(),
  mentorName: z.string().default(''),
  sectionCount: z.number().int().default(0),
  lessonCount: z.number().int().default(0),
  enrolledCount: z.number().int().default(0),
  createdAt: z.string(),
})
export type Course = z.infer<typeof Course>

// ============================================================================
// Contracts
// ============================================================================

export const list = defineContract({
  method: 'GET',
  path: '/api/courses',
  auth: 'user',
  summary: 'List published courses (or all for mentor/admin) with filtering',
  input: z.object({
    track: CourseTrack.optional(),
    category: CourseCategory.optional(),
    difficulty: CourseDifficulty.optional(),
    status: CourseStatus.optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    courses: z.array(Course),
  }),
  mock: () => ({
    courses: [
      {
        id: 'course-1',
        slug: 'data-foundations',
        title: 'Data Foundations & SQL Mastery',
        subtitle: 'Learn relational data modeling and querying',
        description: 'Comprehensive SQL course from scratch to advanced queries.',
        coverEmoji: '📊',
        category: 'technical' as const,
        track: 'mandatory' as const,
        difficulty: 'beginner' as const,
        certificateEligible: true,
        estimatedHours: 12,
        xpBonusOnComplete: 100,
        totalXp: 350,
        dueAt: '2026-09-01T00:00:00.000Z',
        status: 'published' as const,
        mentorId: 'user-mentor-1',
        mentorName: 'Siddesh Mentor',
        sectionCount: 3,
        lessonCount: 9,
        enrolledCount: 42,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
    ],
  }),
})

export const get = defineContract({
  method: 'GET',
  path: '/api/courses/:slug',
  auth: 'user',
  summary: 'Get course details with nested sections and lessons',
  input: z.object({
    slug: z.string(),
  }),
  output: z.object({
    course: Course,
    sections: z.array(Section),
  }),
  mock: ({ slug }) => ({
    course: {
      id: 'course-1',
      slug,
      title: 'Data Foundations & SQL Mastery',
      subtitle: 'Learn relational data modeling and querying',
      description: 'Comprehensive SQL course from scratch to advanced queries.',
      coverEmoji: '📊',
      category: 'technical' as const,
      track: 'mandatory' as const,
      difficulty: 'beginner' as const,
      certificateEligible: true,
      estimatedHours: 12,
      xpBonusOnComplete: 100,
      totalXp: 350,
      dueAt: '2026-09-01T00:00:00.000Z',
      status: 'published' as const,
      mentorId: 'user-mentor-1',
      mentorName: 'Siddesh Mentor',
      sectionCount: 1,
      lessonCount: 2,
      enrolledCount: 42,
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    sections: [
      {
        id: 'sec-1',
        courseId: 'course-1',
        title: 'Introduction to Relational Databases',
        summary: 'Tables, keys and schemas',
        orderIndex: 0,
        xpAward: 50,
        lessons: [
          {
            id: 'les-1',
            sectionId: 'sec-1',
            title: 'What is a Database?',
            kind: 'video' as const,
            contentUrl: 'https://example.com/video1',
            contentBody: 'Introduction to databases',
            durationMin: 10,
            orderIndex: 0,
            xpAward: 10,
          },
        ],
      },
    ],
  }),
})

export const create = defineContract({
  method: 'POST',
  path: '/api/courses',
  auth: 'admin',
  summary: 'Admin creates a course in the courses table',
  input: z.object({
    id: z.string().optional(),
    slug: z.string().min(2).max(120),
    title: z.string().min(3).max(200),
    subtitle: z.string().default(''),
    description: z.string().default(''),
    coverEmoji: z.string().default('📘'),
    category: CourseCategory,
    track: CourseTrack.default('mandatory'),
    difficulty: CourseDifficulty.default('beginner'),
    certificateEligible: z.boolean().default(false),
    estimatedHours: z.number().int().min(0).default(0),
    xpBonusOnComplete: z.number().int().min(0).default(100),
    dueAt: z.string().nullable().optional(),
    status: CourseStatus.default('draft'),
    mentorId: z.string().optional(),
  }),
  output: z.object({
    course: Course,
  }),
  mock: (input) => ({
    course: {
      id: input.id ?? `course-${Date.now()}`,
      slug: input.slug,
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
      totalXp: input.xpBonusOnComplete ?? 100,
      dueAt: input.dueAt ?? null,
      status: input.status ?? 'draft',
      mentorId: input.mentorId ?? 'user-1',
      mentorName: 'Mentor',
      sectionCount: 0,
      lessonCount: 0,
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
    },
  }),
})

export const update = defineContract({
  method: 'PATCH',
  path: '/api/courses/:id',
  auth: 'admin',
  summary: 'Admin updates course details or status',
  input: z.object({
    id: z.string(),
    title: z.string().min(3).max(200).optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    coverEmoji: z.string().optional(),
    category: CourseCategory.optional(),
    track: CourseTrack.optional(),
    difficulty: CourseDifficulty.optional(),
    certificateEligible: z.boolean().optional(),
    estimatedHours: z.number().int().optional(),
    xpBonusOnComplete: z.number().int().optional(),
    dueAt: z.string().nullable().optional(),
    status: CourseStatus.optional(),
    mentorId: z.string().optional(),
  }),
  output: z.object({
    course: Course,
  }),
  mock: (input) => ({
    course: {
      id: input.id,
      slug: 'updated-course',
      title: input.title ?? 'Updated Course',
      subtitle: input.subtitle ?? '',
      description: input.description ?? '',
      coverEmoji: input.coverEmoji ?? '📘',
      category: input.category ?? ('technical' as const),
      track: input.track ?? ('mandatory' as const),
      difficulty: input.difficulty ?? ('beginner' as const),
      certificateEligible: input.certificateEligible ?? false,
      estimatedHours: input.estimatedHours ?? 0,
      xpBonusOnComplete: input.xpBonusOnComplete ?? 100,
      totalXp: input.xpBonusOnComplete ?? 100,
      dueAt: input.dueAt ?? null,
      status: input.status ?? 'published',
      mentorId: input.mentorId ?? 'user-1',
      mentorName: 'Mentor',
      sectionCount: 0,
      lessonCount: 0,
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
    },
  }),
})
