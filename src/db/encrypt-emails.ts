/**
 * One-shot backfill: converts every plaintext `user.email` already in the database to
 * the encrypted `enc:v1:` form.
 *
 *   npm run db:encrypt-emails
 *
 * Safe to run more than once — rows that are already encrypted are skipped, and
 * `encryptEmail` is a no-op on ciphertext.
 *
 * Until this runs, sign-in still works for those accounts: the adapter queries
 * `email IN (ciphertext, plaintext)` precisely so nobody is locked out mid-migration.
 * After it runs, the plaintext arm simply stops matching anything.
 */
import { loadEnvConfig } from '@next/env'

// Env must be loaded BEFORE `@/db` and `@/lib/crypto` are imported — the drizzle client
// reads DATABASE_URL, and the crypto module reads EMAIL_ENCRYPTION_KEY, both at
// module-evaluation time. Hence the dynamic imports below. (Same reason as db/seed.ts.)
loadEnvConfig(process.cwd())

async function main() {
  const { eq } = await import('drizzle-orm')
  const { db } = await import('@/db')
  const { user } = await import('@/db/schema')
  const { encryptEmail, isEncrypted, normalizeEmail } = await import('@/lib/crypto')

  const rows = await db.select({ id: user.id, email: user.email }).from(user)

  // Encrypting normalises to lowercase, so two rows differing only in case would
  // collide on the UNIQUE index. Catch that here rather than as a raw Postgres error
  // halfway through the loop, with some rows already converted.
  const seen = new Map<string, string>()
  const collisions: string[] = []
  for (const row of rows) {
    if (isEncrypted(row.email)) continue
    const key = normalizeEmail(row.email)
    const previous = seen.get(key)
    if (previous) collisions.push(`${key}: rows ${previous} and ${row.id}`)
    else seen.set(key, row.id)
  }

  if (collisions.length) {
    console.error('Refusing to run — these rows would collide once addresses are lowercased:')
    for (const c of collisions) console.error(`  ${c}`)
    process.exit(1)
  }

  let encrypted = 0
  let skipped = 0
  for (const row of rows) {
    if (isEncrypted(row.email)) {
      skipped += 1
      continue
    }
    await db
      .update(user)
      .set({ email: encryptEmail(row.email), updatedAt: new Date() })
      .where(eq(user.id, row.id))
    encrypted += 1
  }

  console.log(`Encrypted ${encrypted} address(es); ${skipped} already encrypted.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
