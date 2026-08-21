import { z } from 'zod'
import { defineContract } from './_kit'

export const Task = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  done: z.boolean().default(false),
  createdAt: z.string(),
})
export type Task = z.infer<typeof Task>

export const list = defineContract({
  method: 'GET',
  path: '/api/tasks',
  auth: 'public',
  summary: 'List tasks with pagination',
  input: z.object({
    projectId: z.string().optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(20),
  }),
  output: z.object({
    tasks: z.array(Task),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      hasMore: z.boolean(),
    }),
  }),
  mock: ({ page = 1, limit = 20 }) => ({
    tasks: [],
    pagination: {
      page,
      limit,
      total: 0,
      hasMore: false,
    },
  }),
})
