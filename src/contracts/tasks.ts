/**
 * tasks.ts — NGO starter contract (placeholder).
 *
 * This contract is part of the hackathon-starter template and is NOT part of
 * the Katalyst learning platform domain. It exists solely to satisfy the
 * import in src/contracts/index.ts and the type imports in src/mocks/factories.ts
 * so that `npm run dev` and `npm run typecheck` can resolve without errors.
 *
 * Owner: starter template — do not build real product logic here.
 * Katalyst assessment/submission contracts live in src/contracts/submissions.ts (Ayush).
 */
import { z } from 'zod'
import { defineContract } from './_kit'

import { mockTasks } from '@/mocks/factories'

/** The shape used by mockTasks in src/mocks/factories.ts. */
export const Task = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(), // ISO string
})
export type Task = z.infer<typeof Task>

export const Pagination = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
})

export const list = defineContract({
  method: 'GET',
  path: '/api/tasks',
  auth: 'user',
  summary: 'List tasks, optionally filtered by project (starter placeholder)',
  input: z.object({
    projectId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  output: z.object({
    tasks: z.array(Task),
    pagination: Pagination,
  }),
  mock: ({ projectId, page = 1, limit = 20 }) => {
    const items = projectId ? mockTasks.filter((t) => t.projectId === projectId) : mockTasks
    const total = items.length
    const start = (page - 1) * limit
    const sliced = items.slice(start, start + limit)
    const hasMore = start + limit < total
    return {
      tasks: sliced,
      pagination: { page, limit, total, hasMore },
    }
  },
})

export const get = defineContract({
  method: 'GET',
  path: '/api/tasks/:id',
  auth: 'user',
  summary: 'Get a single task (starter placeholder)',
  input: z.object({ id: z.string() }),
  output: z.object({ task: Task }),
  mock: () => ({
    task: {
      id: 'task-1',
      projectId: 'project-1',
      title: 'Placeholder Task',
      done: false,
      createdAt: new Date().toISOString(),
    },
  }),
})
