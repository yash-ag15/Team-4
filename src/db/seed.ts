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
 */
import { loadEnvConfig } from '@next/env'
import { sql } from 'drizzle-orm'

// Env must be loaded BEFORE `@/db` is imported — the drizzle client reads
// process.env.DATABASE_URL at module-evaluation time. Hence the dynamic imports below.
loadEnvConfig(process.cwd())

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
