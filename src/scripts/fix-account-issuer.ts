import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from '../db/index'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Fixing account table issuer column in Neon Postgres...')
  
  await db.execute(sql`
    ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;
    ALTER TABLE "account" ALTER COLUMN "issuer" SET DEFAULT 'default';
  `)
  
  console.log('✅ Successfully made account.issuer nullable with default "default"')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error executing migration:', err)
    process.exit(1)
  })
