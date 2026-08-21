import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from '../db/index'
import { user } from '../db/schema/index'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Promoting Siddhesh sonawane and admin accounts to admin with onboardingComplete = true...')

  const updated = await db
    .update(user)
    .set({
      systemRole: 'admin',
      onboardingComplete: true,
    })
    .where(sql`name ILIKE '%Siddhesh%' OR email ILIKE '%mdk%' OR email ILIKE '%yash%'`)
    .returning({ id: user.id, name: user.name, systemRole: user.systemRole, onboardingComplete: user.onboardingComplete })

  console.table(updated)
  console.log('✅ Updated users successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
