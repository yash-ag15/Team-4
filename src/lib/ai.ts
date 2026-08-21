import { ApiError, GoogleGenAI } from '@google/genai'
import { z } from 'zod'

/**
 * The ONLY place an LLM SDK is constructed or called. (AGENTS.md rule 12.)
 *
 * Owner: Yash — `feature/ai-coach-backend`.
 *
 * PROVIDER: Google Gemini, on the free tier. We moved off Anthropic because the API is
 * pay-as-you-go with no free tier and the team had no credits. Gemini's free tier covers
 * a hackathon comfortably.
 *
 * This file is deliberately provider-shaped so that NOTHING else in the codebase is.
 * `src/server/ai-coach.ts` calls `generateJson()` and never imports `@google/genai`, so
 * swapping provider again is one file, not five. The zod contract is untouched either
 * way — that is the whole point of contract-first.
 */

export const DEFAULT_MODEL = 'gemini-2.5-flash'

/**
 * Free-tier friendly. Flash models have the most generous free quota and are fast enough
 * that a review lands well inside `maxDuration = 60`.
 *
 * Override with GEMINI_MODEL in .env.local without touching code. Use the API model id
 * (`gemini-3.5-flash`), NOT the display name ("Gemini 3.5 Flash") — run
 * `npm run ai:smoke -- --list` to see exactly which ids your key can reach.
 *
 * A FUNCTION, not a const, for the same reason `getAI()` is lazy: a module-level const is
 * evaluated at import time, which in a script is BEFORE `loadEnvConfig()` has run, so the
 * override would be silently ignored and you would debug the wrong model.
 */
export const getModel = (): string => process.env.GEMINI_MODEL || DEFAULT_MODEL

export const AI_MAX_TOKENS = 8192

/** Grading against a fixed rubric wants consistency, not creativity. */
export const AI_TEMPERATURE = 0.3

/** Shown in the review card header when we served a mock instead of a real call. */
export const MOCK_MODEL_LABEL = 'mock (GEMINI_API_KEY not set)'

/**
 * False when GEMINI_API_KEY is unset. Every entry point checks this and falls back to the
 * contract mock rather than throwing — that is what lets Riya build the entire review UI
 * before a key exists, and what stops a missing key from 500-ing the demo.
 */
export const aiEnabled = (): boolean => Boolean(process.env.GEMINI_API_KEY)

let client: GoogleGenAI | null = null

/**
 * LAZY ON PURPOSE — do not "simplify" this to a module-scope `new GoogleGenAI(...)`.
 *
 * ESM hoists every import and evaluates it before any statement in the importing module
 * runs. A module-scope client therefore reads process.env at import time, which is BEFORE
 * a script has called `loadEnvConfig()`. The client then captures an empty key while
 * `aiEnabled()` still returns true, because it reads process.env when called. That split
 * is confusing enough to lose half an hour to — it already cost us one debugging round.
 *
 * Next.js loads env before route handlers run, so an eager client happens to work in the
 * app and fails only in scripts (`ai:smoke`, `db:seed`). Lazy works in both.
 */
export const getAI = (): GoogleGenAI =>
  (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }))

// ---------------------------------------------------------------------------
// Schema translation
// ---------------------------------------------------------------------------

/**
 * zod -> JSON Schema, sanitised for Gemini's `responseJsonSchema`.
 *
 * Two things zod 4 emits that are noise or worse here:
 *   - `$schema`, a dialect declaration Gemini has no use for.
 *   - `minimum`/`maximum` of ±2^53 on every `z.number().int()`, which is zod describing a
 *     JS safe integer. Harmless semantically, but it bloats the schema the model has to
 *     read, and a bloated schema measurably degrades adherence.
 *
 * Everything else — required, enum, minItems, nested objects — passes through, so the
 * contract really is the schema the model is held to.
 */
const SAFE_INT_MAX = 9007199254740991

const sanitise = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(sanitise)
  if (node === null || typeof node !== 'object') return node

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === '$schema') continue
    if ((key === 'minimum' || key === 'maximum') && Math.abs(Number(value)) === SAFE_INT_MAX) continue
    out[key] = sanitise(value)
  }
  return out
}

export const toResponseSchema = (schema: z.ZodTypeAny): unknown => sanitise(z.toJSONSchema(schema))

// ---------------------------------------------------------------------------
// The one call the rest of the app makes
// ---------------------------------------------------------------------------

export class AiError extends Error {
  constructor(
    public kind: 'rate_limited' | 'auth' | 'quota' | 'blocked' | 'unreadable' | 'unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'AiError'
  }
}

export type GenerateJsonResult<T> = {
  data: T
  model: string
  latencyMs: number
  tokensIn: number
  tokensOut: number
}

/**
 * Ask the model for JSON matching a zod schema, and return it validated.
 *
 * The zod schema does double duty: it constrains generation (via `responseJsonSchema`)
 * AND it is the acceptance test on the way back. Structured-output modes reduce malformed
 * responses; they do not eliminate them, so the `safeParse` is not belt-and-braces, it is
 * the actual guarantee. Never return unvalidated model output to a caller.
 */
export async function generateJson<T extends z.ZodTypeAny>(opts: {
  system: string
  prompt: string
  schema: T
  signal?: AbortSignal
}): Promise<GenerateJsonResult<z.infer<T>>> {
  const startedAt = Date.now()

  let response
  try {
    response = await getAI().models.generateContent({
      model: getModel(),
      contents: opts.prompt,
      config: {
        systemInstruction: opts.system,
        temperature: AI_TEMPERATURE,
        maxOutputTokens: AI_MAX_TOKENS,
        responseMimeType: 'application/json',
        responseJsonSchema: toResponseSchema(opts.schema),
        abortSignal: opts.signal,
      },
    })
  } catch (e) {
    throw translate(e)
  }

  const latencyMs = Date.now() - startedAt

  // Safety filters and truncation both arrive as a finishReason, not an exception.
  const finishReason = response.candidates?.[0]?.finishReason
  if (finishReason && finishReason !== 'STOP') {
    if (finishReason === 'MAX_TOKENS') {
      throw new AiError('unreadable', 'The response was cut off before it finished.')
    }
    throw new AiError('blocked', `The model declined to respond (${finishReason}).`)
  }

  const text = response.text
  if (!text) throw new AiError('unreadable', 'The model returned an empty response.')

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    console.error('[ai] response was not valid JSON:', text.slice(0, 800))
    throw new AiError('unreadable', 'The model returned malformed JSON.')
  }

  const check = opts.schema.safeParse(parsed)
  if (!check.success) {
    console.error('[ai] response did not match the contract schema:', check.error.issues.slice(0, 8))
    throw new AiError('unreadable', 'The model returned a response in the wrong shape.')
  }

  const usage = response.usageMetadata
  return {
    data: check.data,
    model: getModel(),
    latencyMs,
    tokensIn: usage?.promptTokenCount ?? 0,
    // Thinking tokens are billed and generated but are not part of candidatesTokenCount.
    tokensOut: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
  }
}

/** Map SDK/transport failures onto the small set of cases the coach reacts to. */
function translate(e: unknown): AiError {
  if (e instanceof AiError) return e

  if (e instanceof ApiError) {
    const message = String(e.message ?? '')

    if (e.status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) {
      // The free tier is per-minute AND per-day. Say which, because the fix differs:
      // wait 60s, versus wait until tomorrow or add billing.
      console.error('[ai] rate limited / quota exhausted —', message.slice(0, 300))
      return new AiError('rate_limited', 'The coach is busy right now — try again in a minute.')
    }
    if (e.status === 401 || e.status === 403) {
      console.error('[ai] GEMINI_API_KEY was rejected —', message.slice(0, 300))
      return new AiError('auth', 'The coach is unavailable right now.')
    }
    if (e.status === 400 && /quota|billing/i.test(message)) {
      console.error('[ai] quota/billing —', message.slice(0, 300))
      return new AiError('quota', 'The coach is temporarily unavailable — your work is saved.')
    }
    console.error(`[ai] API error ${e.status} —`, message.slice(0, 300))
    return new AiError('unavailable', 'The coach could not review this right now — your work is saved.')
  }

  console.error('[ai] unexpected failure', e)
  return new AiError('unavailable', 'The coach could not be reached — your work is saved.')
}

/** Diagnostic for `npm run ai:smoke -- --list`. Which models can this key actually reach? */
export async function listModels(): Promise<string[]> {
  const names: string[] = []
  const pager = await getAI().models.list()
  for await (const model of pager) {
    if (model.name) names.push(model.name.replace(/^models\//, ''))
  }
  return names
}
