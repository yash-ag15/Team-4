import type { DBAdapter, Where } from 'better-auth/types'

import { encryptEmail, decryptEmail, normalizeEmail } from '@/lib/crypto'

/**
 * Wraps the Drizzle adapter so `user.email` is ciphertext at rest and plaintext
 * everywhere above it.
 *
 * Better Auth never sees the encryption: it hands the adapter a plaintext address and
 * gets a plaintext address back. Every translation happens in this one file, which is
 * why nothing else in the app had to change to make email encryption work.
 *
 * Three directions to cover, and missing any one of them silently breaks sign-in:
 *  1. WRITE  — `data.email` on create/update gets encrypted.
 *  2. QUERY  — `where` clauses on `email` get their value encrypted, or the
 *              `WHERE email = 'a@b.com'` lookup matches zero rows.
 *  3. READ   — rows coming back get `email` decrypted, including a `user` joined onto
 *              another model. That last case is the one that hides: every server
 *              component's session user arrives that way.
 */

const EMAIL_FIELD = 'email'

/** Key a joined user arrives under — `join: { user: true }` nests it by model name. */
const EMAIL_JOIN_KEY = 'user'

/** Only the user table stores an address. Sessions/accounts/verifications do not. */
const isUserModel = (model: string) => model === 'user' || model === 'users'

const encryptData = (model: string, data: Record<string, unknown> | undefined) => {
  if (!data || !isUserModel(model)) return data
  if (typeof data[EMAIL_FIELD] !== 'string') return data
  return { ...data, [EMAIL_FIELD]: encryptEmail(data[EMAIL_FIELD] as string) }
}

/**
 * Equality on email becomes `IN (ciphertext, plaintext)`.
 *
 * The plaintext arm is a migration ramp, not decoration: a database that already holds
 * plaintext addresses would otherwise lock every existing user out the moment this
 * wrapper is switched on. `npm run db:encrypt-emails` converts those rows; until it
 * has run, both forms resolve. Once it has, the plaintext arm simply never matches.
 */
const encryptWhere = (model: string, where: Where[] | undefined): Where[] | undefined => {
  if (!where || !isUserModel(model)) return where

  return where.map((clause) => {
    if (clause.field !== EMAIL_FIELD) return clause

    const op = clause.operator ?? 'eq'

    if (op === 'eq' && typeof clause.value === 'string') {
      const plain = normalizeEmail(clause.value)
      return { ...clause, operator: 'in', value: [encryptEmail(plain), plain] }
    }

    if ((op === 'in' || op === 'not_in') && Array.isArray(clause.value)) {
      const values = (clause.value as string[]).flatMap((v) =>
        typeof v === 'string' ? [encryptEmail(v), normalizeEmail(v)] : [v],
      )
      return { ...clause, value: values as string[] }
    }

    // contains / starts_with / ends_with cannot work on ciphertext — there is no
    // order-preserving property to exploit, and pretending otherwise would return
    // silently empty results. Left untouched and flagged loudly in dev.
    if (process.env.NODE_ENV !== 'production' && op !== 'ne') {
      console.warn(
        `[auth-adapter] '${op}' on the encrypted email column cannot match — use 'eq' or add a blind index.`,
      )
    }
    return clause
  })
}

const decryptEmailField = (record: Record<string, unknown>): Record<string, unknown> =>
  typeof record[EMAIL_FIELD] === 'string'
    ? { ...record, [EMAIL_FIELD]: decryptEmail(record[EMAIL_FIELD] as string) }
    : record

/**
 * Decrypts `email` on a returned row — at the top level when the row IS a user, and
 * inside a joined `user` payload whatever the outer model is.
 *
 * The joined case is not a nicety. `getSession()` resolves the cookie with
 * `findOne({ model: 'session', join: { user: true } })`, so the signed-in user object
 * every server component reads arrives nested under a `user` key on a *session* row.
 * Decrypting only when `model === 'user'` misses it, and the address renders as
 * `enc:v1:…` on every page that greets the user by email.
 */
const decryptRow = <T>(model: string, row: T): T => {
  if (!row || typeof row !== 'object') return row

  let record = row as Record<string, unknown>
  if (isUserModel(model)) record = decryptEmailField(record)

  const joined = record[EMAIL_JOIN_KEY]
  if (Array.isArray(joined)) {
    record = {
      ...record,
      [EMAIL_JOIN_KEY]: joined.map((entry) =>
        entry && typeof entry === 'object' ? decryptEmailField(entry as Record<string, unknown>) : entry,
      ),
    }
  } else if (joined && typeof joined === 'object') {
    record = { ...record, [EMAIL_JOIN_KEY]: decryptEmailField(joined as Record<string, unknown>) }
  }

  return record as T
}

export function withEmailEncryption(adapter: DBAdapter): DBAdapter {
  const wrapped: DBAdapter = {
    ...adapter,

    create: async ({ model, data, ...rest }) =>
      decryptRow(model, await adapter.create({ model, data: encryptData(model, data) as never, ...rest })),

    findOne: async ({ model, where, ...rest }) =>
      decryptRow(model, await adapter.findOne({ model, where: encryptWhere(model, where)!, ...rest })),

    // Written long-hand with an explicit `<T>`: destructuring in a concise arrow drops
    // the generic and the row type collapses to `unknown`.
    findMany: async <T,>({
      model,
      where,
      ...rest
    }: Parameters<DBAdapter['findMany']>[0]): Promise<T[]> => {
      const rows = await adapter.findMany<T>({ model, where: encryptWhere(model, where), ...rest })
      return rows.map((row) => decryptRow(model, row))
    },

    count: ({ model, where }) => adapter.count({ model, where: encryptWhere(model, where) }),

    update: async ({ model, where, update }) =>
      decryptRow(
        model,
        await adapter.update({
          model,
          where: encryptWhere(model, where)!,
          update: encryptData(model, update as Record<string, unknown>) as Record<string, unknown>,
        }),
      ),

    updateMany: ({ model, where, update }) =>
      adapter.updateMany({
        model,
        where: encryptWhere(model, where)!,
        update: encryptData(model, update as Record<string, unknown>) as Record<string, unknown>,
      }),

    delete: ({ model, where }) => adapter.delete({ model, where: encryptWhere(model, where)! }),

    deleteMany: ({ model, where }) =>
      adapter.deleteMany({ model, where: encryptWhere(model, where)! }),

    consumeOne: async ({ model, where }) =>
      decryptRow(model, await adapter.consumeOne({ model, where: encryptWhere(model, where)! })),

    incrementOne: async ({ model, where, ...rest }) =>
      decryptRow(model, await adapter.incrementOne({ model, where: encryptWhere(model, where)!, ...rest })),

    // A transaction hands the callback a *raw* adapter, so it has to be wrapped too —
    // otherwise any user write inside a transaction would store a plaintext address and
    // break the unique index against the encrypted rows.
    transaction: (callback) =>
      adapter.transaction((trx) => callback(withEmailEncryption(trx as DBAdapter))),
  }

  return wrapped
}
