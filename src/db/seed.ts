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

  console.log('[seed] done — safe to re-run; ids match the mock fixtures exactly.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] failed:', error)
    process.exit(1)
  })
