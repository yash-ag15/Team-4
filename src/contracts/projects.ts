/**
 * projects.ts — NGO starter contract (placeholder).
 *
 * This contract is part of the hackathon-starter template and is NOT part of
 * the Katalyst learning platform domain. It exists solely to satisfy the
 * import in src/contracts/index.ts and the type imports in src/mocks/factories.ts
 * so that `npm run dev` and `npm run typecheck` can resolve without errors.
 *
 * Owner: starter template — do not build real product logic here.
 * Katalyst course/content contracts live in src/contracts/courses.ts (Siddesh).
 */
import { z } from 'zod'
import { defineContract } from './_kit'

import { mockProjects } from '@/mocks/factories'

/** The shape used by mockProjects in src/mocks/factories.ts. */
export const Project = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'active', 'archived']),
  volunteerCount: z.number().int(),
  createdAt: z.string(), // ISO string
})
export type Project = z.infer<typeof Project>

export const Pagination = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
})

export const list = defineContract({
  method: 'GET',
  path: '/api/projects',
  auth: 'user',
  summary: 'List all projects (starter placeholder)',
  input: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  output: z.object({
    projects: z.array(Project),
    pagination: Pagination,
  }),
  mock: ({ page = 1, limit = 20 }) => {
    const total = mockProjects.length
    const start = (page - 1) * limit
    const sliced = mockProjects.slice(start, start + limit)
    const hasMore = start + limit < total
    return {
      projects: sliced,
      pagination: { page, limit, total, hasMore },
    }
  },
})

export const get = defineContract({
  method: 'GET',
  path: '/api/projects/:id',
  auth: 'user',
  summary: 'Get a single project (starter placeholder)',
  input: z.object({ id: z.string() }),
  output: z.object({ project: Project }),
  mock: () => ({
    project: {
      id: 'project-1',
      name: 'Placeholder Project',
      description: '',
      status: 'draft' as const,
      volunteerCount: 0,
      createdAt: new Date().toISOString(),
    },
  }),
})
