import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from '../db/index'
import { user } from '../db/schema/index'
import { eq } from 'drizzle-orm'

async function main() {
  // Fix systemRole 'user' -> 'student' (Better Auth default mismatch for email sign-up)
  const fixed = await db
    .update(user)
    .set({ systemRole: 'student' })
    .where(eq(user.systemRole, 'user' as any))
    .returning({ email: user.email })

  if (fixed.length > 0) {
    console.log(`✅ Fixed ${fixed.length} users from 'user' → 'student':`, fixed.map(u => u.email).join(', '))
  } else {
    console.log('ℹ️  No users with role "user" to fix.')
  }

  // Promote these emails to admin
  const admins = ['yash@gmail.com', 'makarand9@gmail.com']
  for (const email of admins) {
    const [r] = await db
      .update(user)
      .set({ systemRole: 'admin' })
      .where(eq(user.email, email))
      .returning({ email: user.email })
    if (r) console.log(`✅ Promoted to admin: ${r.email}`)
    else console.log(`⚠️  Not found: ${email}`)
  }

  console.log('\nDone. Sign out and sign back in for role changes to take effect.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
