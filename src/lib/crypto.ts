import { createCipheriv, createDecipheriv, createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

/**
 * Deterministic, authenticated encryption for the `user.email` column.
 *
 * WHY DETERMINISTIC and not a random IV: Better Auth looks a user up with
 * `WHERE email = ?` on every sign-in, and the column carries a UNIQUE index. Random
 * IVs would produce a different ciphertext for the same address every time, so the
 * lookup would never match and the unique constraint would stop catching duplicate
 * signups. So the IV is derived from the plaintext (an SIV-style construction):
 * same address -> same ciphertext -> equality lookups and UNIQUE both keep working.
 *
 * The trade-off is the one every searchable-encryption scheme makes: an attacker who
 * reads the table can tell that two rows share an address, and can confirm a guessed
 * address by encrypting it. What they cannot do is read an address out of a stolen
 * dump without the key. That is the threat this is for.
 *
 * NEVER use these helpers for passwords. Better Auth hashes those with scrypt; a
 * reversible cipher would be a downgrade.
 */

const PREFIX = 'enc:v1:'

/** `:` cannot appear in an unquoted email address, so this can never collide with one. */
export const isEncrypted = (value: string): boolean => value.startsWith(PREFIX)

/**
 * Addresses are normalised before encryption, not after — `Foo@Example.com` and
 * `foo@example.com` must land on the same ciphertext or the same person gets two rows.
 */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

let cachedKeys: { encKey: Buffer; ivKey: Buffer } | null = null

function keys() {
  if (cachedKeys) return cachedKeys

  // EMAIL_ENCRYPTION_KEY is the real knob. Falling back to BETTER_AUTH_SECRET keeps a
  // freshly cloned repo working — but rotating BETTER_AUTH_SECRET would then make every
  // stored address undecryptable, which is why .env.example tells you to set both.
  const secret = process.env.EMAIL_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error(
      'EMAIL_ENCRYPTION_KEY (or BETTER_AUTH_SECRET) must be set — email encryption cannot run without a key.',
    )
  }

  // Two independent subkeys from one secret: one enciphers, one derives the IV. Reusing
  // a single key for both is the classic way to leak structure.
  const encKey = Buffer.from(hkdfSync('sha256', secret, 'katalyst.email.enc', 'aes-256-gcm', 32))
  const ivKey = Buffer.from(hkdfSync('sha256', secret, 'katalyst.email.iv', 'synthetic-iv', 32))

  cachedKeys = { encKey, ivKey }
  return cachedKeys
}

/**
 * Plaintext address -> `enc:v1:<base64url(iv | tag | ciphertext)>`.
 *
 * Already-encrypted input is returned untouched, so calling this twice is safe — the
 * adapter and the backfill script both rely on that.
 */
export function encryptEmail(email: string): string {
  if (isEncrypted(email)) return email

  const { encKey, ivKey } = keys()
  const plaintext = Buffer.from(normalizeEmail(email), 'utf8')

  // Synthetic IV: HMAC of the plaintext, truncated to GCM's 12-byte nonce.
  const iv = createHmac('sha256', ivKey).update(plaintext).digest().subarray(0, 12)

  const cipher = createCipheriv('aes-256-gcm', encKey, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64url')
}

/**
 * The inverse. Anything without the `enc:v1:` prefix is passed straight through, which
 * is what lets an existing database of plaintext addresses keep working while
 * `npm run db:encrypt-emails` has not been run yet.
 *
 * A value that IS prefixed but fails to decrypt throws — that means the key changed or
 * the row was tampered with, and silently returning ciphertext would put it on screen.
 */
export function decryptEmail(stored: string): string {
  if (!isEncrypted(stored)) return stored

  const { encKey, ivKey } = keys()
  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64url')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ciphertext = raw.subarray(28)

  const decipher = createDecipheriv('aes-256-gcm', encKey, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  // GCM already authenticated the ciphertext; this additionally proves the IV was the
  // synthetic one, so a row cannot be re-pointed at another user's ciphertext.
  const expectedIv = createHmac('sha256', ivKey).update(plaintext).digest().subarray(0, 12)
  if (!timingSafeEqual(iv, expectedIv)) throw new Error('Email ciphertext failed IV verification')

  return plaintext.toString('utf8')
}

/** Never throws. For display paths where a bad row must not take the whole page down. */
export function decryptEmailSafe(stored: string, fallback = ''): string {
  try {
    return decryptEmail(stored)
  } catch {
    return fallback
  }
}

/** `a***@example.com` — for the session list, where the address is only a hint. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '•••'
  const head = local.slice(0, 1)
  return `${head}${'•'.repeat(Math.max(local.length - 1, 2))}@${domain}`
}
