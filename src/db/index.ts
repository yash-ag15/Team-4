import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from './schema'

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
export const db = drizzle(process.env.DATABASE_URL!, { schema })
