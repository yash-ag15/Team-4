import { z } from 'zod'
import { defineContract } from './_kit'

export const Enrollment = z.object({
  id: z.string(),
  courseId: z.string(),
  userId: z.string(),
  enrolledAt: z.string(),
})
export type Enrollment = z.infer<typeof Enrollment>

export const enroll = defineContract({
  method: 'POST',
  path: '/api/enrollments',
  auth: 'user',
  summary: 'Enroll in a course',
  input: z.object({
    courseId: z.string(),
  }),
  output: z.object({
    enrollment: Enrollment,
  }),
  mock: ({ courseId }) => ({
    enrollment: {
      id: `enr-${Date.now()}`,
      courseId,
      userId: 'user-1',
      enrolledAt: new Date().toISOString(),
    },
  }),
})
