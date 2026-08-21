/**
 * Idempotent database seed.
 *
 *   npx tsx src/db/seed.ts        (or `npm run db:seed` once the script is added)
 *
 * Data source is `src/mocks/factories.ts` — the SAME fixtures the contract mocks serve.
 * One definition of "what a project looks like" for mocks, seeds and UI, so flipping a
 * route from mock to live is a non-event instead of a surprise.
 *
 * Idempotency: every row is written with the fixture's own stable id (`project-1` …), so
 * re-running updates instead of duplicating. Run it as many times as you like.
 *
 * Because `projects.id` / `tasks.id` are `text`, seeded rows carry the EXACT ids the
 * contract mocks serve — so a URL that worked against mock data still works against the
 * real database. Do not change these columns to `uuid` without reading the note in
 * `src/db/schema/projects.ts`.
 */
import { loadEnvConfig } from '@next/env'
import { sql } from 'drizzle-orm'

// Env must be loaded BEFORE `@/db` is imported — the drizzle client reads
// process.env.DATABASE_URL at module-evaluation time. Hence the dynamic imports below.
loadEnvConfig(process.cwd())

/** Structural shapes we rely on from the fixtures. Kept loose on purpose. */
type MockProject = {
  id: string
  name: string
  description?: string
  status?: 'draft' | 'active' | 'archived'
  volunteerCount?: number
  createdAt?: string | Date
  ownerId?: string
}

type MockTask = {
  id: string
  projectId: string
  title: string
  done?: boolean
  createdAt?: string | Date
}

/**
 * TODO(auth): once `src/db/schema/auth.ts` exists and `projects.ownerId` gets its FK back,
 * this must point at a real row in the generated `user` table (seed a user first, or reuse
 * an id you signed up with). Until then `owner_id` is an unconstrained text column, so any
 * stable value works.
 */
const SEED_OWNER_ID = process.env.SEED_OWNER_ID ?? 'user-1'

/** `excluded.<column>` — the row Postgres *would* have inserted, for ON CONFLICT updates. */
const excluded = (column: string) => sql.raw(`excluded."${column}"`)

const toDate = (value: string | Date | undefined): Date =>
  value === undefined ? new Date() : value instanceof Date ? value : new Date(value)

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — add it to .env.local before seeding.')
  }

  const { db } = await import('@/db')
  const schema = (await import('@/db/schema')) as Record<string, any>
  const projects = schema.projects
  const tasks = schema.tasks

  const factories = (await import('@/mocks/factories')) as {
    mockProjects?: MockProject[]
    mockTasks?: MockTask[]
  }

  const mockProjects = factories.mockProjects ?? []
  const mockTasks = factories.mockTasks ?? []

  console.log(
    `[seed] source fixtures: ${mockProjects.length} projects, ${mockTasks.length} tasks`,
  )

  if (projects && mockProjects.length > 0) {
    const rows = mockProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      status: p.status ?? ('draft' as const),
      volunteerCount: p.volunteerCount ?? 0,
      ownerId: p.ownerId ?? SEED_OWNER_ID,
      createdAt: toDate(p.createdAt),
    }))

    const inserted = await db
      .insert(projects)
      .values(rows)
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: excluded('name'),
          description: excluded('description'),
          status: excluded('status'),
          volunteerCount: excluded('volunteer_count'),
          ownerId: excluded('owner_id'),
          createdAt: excluded('created_at'),
        },
      })
      .returning({ id: projects.id, name: projects.name })

    console.log(`[seed] projects upserted: ${inserted.length}`)
    for (const row of inserted) console.log(`         · ${row.name} (${row.id})`)
  }

  if (tasks && mockTasks.length > 0) {
    // Only keep tasks whose project actually got seeded — the FK is real.
    const seededProjectIds = new Set(mockProjects.map((p) => p.id))

    const rows = mockTasks
      .filter((t) => seededProjectIds.has(t.projectId))
      .map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        done: t.done ?? false,
        createdAt: toDate(t.createdAt),
      }))

    const skipped = mockTasks.length - rows.length
    if (skipped > 0) {
      console.warn(`[seed] skipped ${skipped} task(s) referencing an unseeded project`)
    }

    if (rows.length > 0) {
      const inserted = await db
        .insert(tasks)
        .values(rows)
        .onConflictDoUpdate({
          target: tasks.id,
          set: {
            projectId: excluded('project_id'),
            title: excluded('title'),
            done: excluded('done'),
            createdAt: excluded('created_at'),
          },
        })
        .returning({ id: tasks.id, title: tasks.title })

      console.log(`[seed] tasks upserted: ${inserted.length}`)
      for (const row of inserted) console.log(`         · ${row.title} (${row.id})`)
    }
  }

  console.log('[seed] done — safe to re-run; ids match the mock fixtures exactly.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] failed:', error)
    process.exit(1)
  })
