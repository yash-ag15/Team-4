import { z } from 'zod'
import { defineContract } from './_kit'

export const Project = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  volunteerCount: z.number().default(0),
  ownerId: z.string().optional(),
  createdAt: z.string(),
})
export type Project = z.infer<typeof Project>

export const list = defineContract({
  method: 'GET',
  path: '/api/projects',
  auth: 'public',
  summary: 'List projects with pagination',
  input: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  }),
  output: z.object({
    projects: z.array(Project),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  }),
  mock: ({ page = 1, limit = 20 }) => ({
    projects: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  }),
})
