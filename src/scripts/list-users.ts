import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from '../db/index'
import { user } from '../db/schema/index'

async function main() {
  const users = await db.select({
    id: user.id,
    email: user.email,
    name: user.name,
    systemRole: user.systemRole,
  }).from(user).limit(20)

  if (users.length === 0) {
    console.log('No users in database yet. Sign up first, then run make-admin.')
    return
  }

  console.table(users)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
