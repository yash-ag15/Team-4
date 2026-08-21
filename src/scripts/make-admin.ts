/**
 * Quick one-time script: promote a user to admin by email.
 *
 * Usage:
 *   npx tsx src/scripts/make-admin.ts your@email.com
 */
import { loadEnvConfig } from '@next/env'
import { eq } from 'drizzle-orm'
import { db } from '../db/index'
import { user } from '../db/schema/index'

loadEnvConfig(process.cwd())

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx src/scripts/make-admin.ts <email>')
  process.exit(1)
}

async function main() {
  const [updated] = await db
    .update(user)
    .set({ systemRole: 'admin' })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, systemRole: user.systemRole })

  if (!updated) {
    console.error(`❌  No user found with email "${email}"`)
    process.exit(1)
  }

  console.log(`✅  Promoted to admin:`, updated)
  console.log('    Sign out and sign back in for the new role to take effect.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
