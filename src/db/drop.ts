import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DROP TABLE IF EXISTS "user" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "session" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "account" CASCADE;`;
  await sql`DROP TABLE IF EXISTS "verification" CASCADE;`;
  console.log("Dropped auth tables");
}

main().catch(console.error);
