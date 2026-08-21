import { z } from 'zod'
import { defineContract } from './_kit'

// ============================================================================
// Enums & Shared Schemas
// ============================================================================

export const CourseCategory = z.enum([
  'technical',
  'business',
  'communication',
  'leadership',
  'wellbeing',
])
export type CourseCategory = z.infer<typeof CourseCategory>

export const CourseTrack = z.enum(['mandatory', 'optional'])
export type CourseTrack = z.infer<typeof CourseTrack>

export const CourseDifficulty = z.enum(['beginner', 'intermediate', 'advanced'])
export type CourseDifficulty = z.infer<typeof CourseDifficulty>

export const CourseStatus = z.enum(['draft', 'published', 'archived'])
export type CourseStatus = z.infer<typeof CourseStatus>

export const ModuleType = z.enum([
  'training_session',
  'online_course',
  'mentoring_task',
  'project',
  'assignment',
  'milestone',
])
export type ModuleType = z.infer<typeof ModuleType>

export const LessonKind = z.enum([
  'video',
  'reading',
  'link',
  'session',
  'assignment',
  'project',
  'mentoring',
  'milestone',
])
export type LessonKind = z.infer<typeof LessonKind>

// ============================================================================
// Schemas
// ============================================================================

export const Lesson = z.object({
  id: z.string(),
  sectionId: z.string().optional(),
  title: z.string(),
  kind: LessonKind,
  contentUrl: z.string().nullable().optional(),
  contentBody: z.string().nullable().optional(),
  durationMin: z.number().int().default(10),
  orderIndex: z.number().int().default(0),
  xpAward: z.number().int().default(10),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type Lesson = z.infer<typeof Lesson>

export const Section = z.object({
  id: z.string(),
  courseId: z.string().optional(),
  title: z.string(),
  summary: z.string().default(''),
  type: ModuleType.default('online_course').optional(),
  orderIndex: z.number().int().default(0),
  xpAward: z.number().int().default(50),
  meta: z.record(z.string(), z.unknown()).optional(),
  lessons: z.array(Lesson).default([]),
})
export type Section = z.infer<typeof Section>

export const Course = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().default(''),
  description: z.string().default(''),
  coverEmoji: z.string().default('📘'),
  category: CourseCategory,
  track: CourseTrack,
  difficulty: CourseDifficulty,
  certificateEligible: z.boolean().default(false),
  estimatedHours: z.number().int().default(0),
  xpBonusOnComplete: z.number().int().default(100),
  totalXp: z.number().int().default(100),
  dueAt: z.string().nullable().default(null),
  status: CourseStatus.default('published'),
  mentorId: z.string().default('user-1'),
  mentorName: z.string().default(''),
  sectionCount: z.number().int().default(0),
  lessonCount: z.number().int().default(0),
  enrolledCount: z.number().int().default(0),
  createdAt: z.string(),
})
export type Course = z.infer<typeof Course>

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    slug: 'data-foundations',
    title: 'Data Foundations & SQL Mastery',
    subtitle: 'Learn relational data modeling, SQL queries, and cohort retention metrics',
    description: 'Comprehensive SQL course from scratch to advanced queries and analytics.',
    coverEmoji: '📊',
    category: 'technical',
    track: 'mandatory',
    difficulty: 'beginner',
    certificateEligible: true,
    estimatedHours: 12,
    xpBonusOnComplete: 100,
    totalXp: 350,
    dueAt: '2026-09-01T00:00:00.000Z',
    status: 'published',
    mentorId: 'user-mentor-1',
    mentorName: 'Siddesh Mentor',
    sectionCount: 3,
    lessonCount: 9,
    enrolledCount: 42,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'course-2',
    slug: 'web-development-basics',
    title: 'Web Development Basics',
    subtitle: 'Build modern responsive interfaces with HTML, Tailwind, and React',
    description: 'A practical introduction to modern web frontend engineering and component architecture.',
    coverEmoji: '💻',
    category: 'technical',
    track: 'mandatory',
    difficulty: 'beginner',
    certificateEligible: false,
    estimatedHours: 6,
    xpBonusOnComplete: 80,
    totalXp: 300,
    dueAt: '2026-09-15T00:00:00.000Z',
    status: 'published',
    mentorId: 'user-mentor-1',
    mentorName: 'Dr. Rajesh Khanna',
    sectionCount: 2,
    lessonCount: 6,
    enrolledCount: 34,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'course-3',
    slug: 'advanced-analytics-python',
    title: 'Advanced Analytics with Python',
    subtitle: 'Data science pipelines, Pandas wrangling, and predictive modeling',
    description: 'Self-driven optional track for students looking to specialize in data science and predictive analysis.',
    coverEmoji: '🐍',
    category: 'technical',
    track: 'optional',
    difficulty: 'advanced',
    certificateEligible: true,
    estimatedHours: 12,
    xpBonusOnComplete: 150,
    totalXp: 600,
    dueAt: null,
    status: 'published',
    mentorId: 'user-mentor-1',
    mentorName: 'Dr. Rajesh Khanna',
    sectionCount: 4,
    lessonCount: 12,
    enrolledCount: 14,
    createdAt: '2026-01-20T00:00:00.000Z',
  },
]

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
    total: z.number().int().optional(),
  }),
  mock: ({ track, category, difficulty, status, q, limit }) => {
    let result = MOCK_COURSES
    if (track) result = result.filter((c) => c.track === track)
    if (category) result = result.filter((c) => c.category === category)
    if (difficulty) result = result.filter((c) => c.difficulty === difficulty)
    if (status) result = result.filter((c) => c.status === status)
    if (q) {
      const query = q.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.subtitle.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query),
      )
    }
    if (limit) result = result.slice(0, limit)
    return { courses: result, total: result.length }
  },
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
  mock: ({ slug }) => {
    const course = MOCK_COURSES.find((c) => c.slug === slug) ?? MOCK_COURSES[0]
    return {
      course,
      sections: [
        {
          id: 'sec-1',
          courseId: course.id,
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
    }
  },
})

export const mine = defineContract({
  method: 'GET',
  path: '/api/courses/mine',
  auth: 'user',
  summary: 'Courses authored/owned by the signed-in mentor',
  input: z.object({}),
  output: z.object({
    courses: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        track: CourseTrack,
        enrolledCount: z.number().int(),
        avgProgressPct: z.number().int(),
        completionRate: z.number().int(),
      }),
    ),
  }),
  mock: () => ({
    courses: [
      {
        id: 'course-1',
        title: 'Data Foundations & Analytics',
        track: 'mandatory' as const,
        enrolledCount: 28,
        avgProgressPct: 68,
        completionRate: 64,
      },
      {
        id: 'course-3',
        title: 'Advanced Analytics with Python',
        track: 'optional' as const,
        enrolledCount: 14,
        avgProgressPct: 45,
        completionRate: 50,
      },
    ],
  }),
})

export const create = defineContract({
  method: 'POST',
  path: '/api/courses',
  auth: 'user',
  summary: 'Create a new course in draft or published status',
  input: z.object({
    id: z.string().optional(),
    slug: z.string().min(2).max(120).optional(),
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
    totalXp: z.number().int().min(0).optional(),
    dueAt: z.string().nullable().optional(),
    status: CourseStatus.default('published'),
    mentorId: z.string().optional(),
    sections: z
      .array(
        z.object({
          title: z.string().min(1),
          summary: z.string().default(''),
          type: ModuleType.optional(),
          orderIndex: z.number().int().default(0),
          xpAward: z.number().int().default(50),
          meta: z.record(z.string(), z.unknown()).optional(),
          lessons: z
            .array(
              z.object({
                title: z.string().min(1),
                kind: LessonKind,
                contentUrl: z.string().nullable().optional(),
                contentBody: z.string().nullable().optional(),
                durationMin: z.number().int().default(15),
                orderIndex: z.number().int().default(0),
                xpAward: z.number().int().default(10),
                meta: z.record(z.string(), z.unknown()).optional(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
  }),
  output: z.object({
    course: Course,
    success: z.boolean().optional(),
  }),
  mock: (input) => {
    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const created: Course = {
      id: input.id ?? `course-${Date.now()}`,
      slug,
      title: input.title,
      subtitle: input.subtitle ?? '',
      description: input.description ?? '',
      coverEmoji: input.coverEmoji || '📘',
      category: input.category,
      track: input.track ?? 'mandatory',
      difficulty: input.difficulty ?? 'beginner',
      certificateEligible: input.certificateEligible ?? false,
      estimatedHours: input.estimatedHours ?? 0,
      xpBonusOnComplete: input.xpBonusOnComplete ?? 100,
      totalXp: input.totalXp ?? (input.xpBonusOnComplete ?? 100),
      dueAt: input.track === 'mandatory' ? (input.dueAt ?? null) : null,
      status: input.status ?? 'published',
      mentorId: input.mentorId ?? 'user-1',
      mentorName: 'Dr. Rajesh Khanna',
      sectionCount: input.sections?.length || 0,
      lessonCount: input.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0,
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
    }
    return { course: created, success: true }
  },
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
