import { defineConfig } from 'drizzle-kit'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

/**
 * `drizzle-kit push` is BANNED on this project — the database is shared by the whole
 * team and `push` mutates it with no history. Use:
 *
 *   npx drizzle-kit generate   # writes versioned SQL into drizzle/ — COMMIT IT
 *   npx drizzle-kit migrate    # one person applies it to the shared DATABASE_URL
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
