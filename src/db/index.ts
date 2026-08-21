import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { loadEnvConfig } from '@next/env'
import ws from 'ws'

loadEnvConfig(process.cwd())

import * as schema from './schema'

neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/**
 * Neon WebSocket driver — NOT `drizzle-orm/neon-http`.
 *
 * The HTTP driver cannot do interactive transactions, and whether the Better Auth
 * drizzle adapter opens one is unverified. The WebSocket driver sidesteps the question
 * entirely for the cost of `ws` + `bufferutil`. If it later turns out transactions are
 * never needed, switching is a one-line import change.
 *
 * Node runtime only. Never add `export const runtime = 'edge'` to anything that imports
 * this module.
 */
export const db = drizzle({ client: pool, schema })

