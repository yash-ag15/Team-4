/**
 * XP constants and pure functions. THE single source of every XP number in the app.
 *
 * Owner: Yash. Landed here because `src/contracts/ai-coach.ts` needs
 * `suggestedXpFromScore()` — the rest of the XP engine (`src/server/xp.ts`, `awardXp()`)
 * is feature 06 on `feature/xp-back`.
 *
 * This module is imported by CLIENT components (the level ring, the XP badge, the 1.5x
 * chip), so it must contain:
 *   - no import from `@/db`
 *   - no import from `@/lib/auth`
 *   - no `server-only`, no secrets
 * Pure numbers and pure functions, nothing else.
 *
 * Never retype one of these values in a component. The demo dies the moment the dashboard
 * says "50 XP to go" and the ledger says 75.
 *
 * Rules: plans/katalyst/xp-and-gamification.md
 */

export const XP = {
  /** Defaults when an author leaves the field alone. Real values come from the row. */
  LESSON_DEFAULT: 10,
  SECTION_DEFAULT: 50,
  COURSE_BONUS_DEFAULT: 100,
  ASSESSMENT_DEFAULT: 150,

  CERTIFICATE_BONUS: 200,

  DAILY_CHECKIN: 10,
  STREAK_MILESTONE: 50,
  STREAK_MILESTONE_EVERY: 7,
  STREAK_FREEZES: 2,

  BADGE_DEFAULT: 25,
} as const

export type CourseTrackValue = 'mandatory' | 'optional'

/**
 * Optional courses earn more. This is how self-driven learning becomes the attractive
 * choice instead of the thing nobody does.
 *
 * Applies to the FIVE course-derived awards only: lesson, section, course, certificate,
 * assessment. NOT to check-in, streak, challenge or badge XP — those are platform-wide,
 * and multiplying them would let a student farm XP by touching an optional course once.
 */
export const OPTIONAL_TRACK_MULTIPLIER = 1.5

export const applyTrack = (base: number, track: CourseTrackValue): number =>
  track === 'optional' ? Math.round(base * OPTIONAL_TRACK_MULTIPLIER) : Math.round(base)

// ---------------------------------------------------------------------------
// Levels — a square curve, so the first three levels are reachable inside a demo
// and later ones take real work.
//
//   level  1    2    3    4     5     6     7
//   XP     0  100  400  900  1600  2500  3600
// ---------------------------------------------------------------------------

export const levelFromXp = (xp: number): number => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1

/** Total XP required to reach `level`. `xpForLevel(1) === 0`. */
export const xpForLevel = (level: number): number => (Math.max(1, level) - 1) ** 2 * 100

/** XP still needed to reach the next level from `xp`. */
export const xpToNextLevel = (xp: number): number => xpForLevel(levelFromXp(xp) + 1) - Math.max(0, xp)

/** XP earned since entering the current level — the numerator of the level ring. */
export const xpIntoLevel = (xp: number): number => Math.max(0, xp) - xpForLevel(levelFromXp(xp))

/** The span of the current level — the denominator of the level ring. */
export const levelSpan = (xp: number): number => {
  const level = levelFromXp(xp)
  return xpForLevel(level + 1) - xpForLevel(level)
}

export const LEVEL_NAMES = [
  'Explorer',
  'Builder',
  'Contributor',
  'Specialist',
  'Catalyst',
  'Mentor-in-Training',
  'Luminary',
] as const

export const levelName = (level: number): string =>
  LEVEL_NAMES[Math.min(Math.max(1, level), LEVEL_NAMES.length) - 1]

// ---------------------------------------------------------------------------
// Idempotency keys. Every award goes through awardXp() with one of these.
//
// Do NOT append a timestamp or a random suffix to any of them — the whole point is that
// the same logical award always produces the same key, so a double-clicked button, a
// retry and a page refresh are all no-ops.
// ---------------------------------------------------------------------------

export const xpKey = {
  lesson: (enrollmentId: string, lessonId: string) => `lesson:${enrollmentId}:${lessonId}`,
  section: (enrollmentId: string, sectionId: string) => `section:${enrollmentId}:${sectionId}`,
  course: (enrollmentId: string) => `course:${enrollmentId}`,
  certificate: (enrollmentId: string) => `certificate:${enrollmentId}`,
  submission: (submissionId: string) => `submission:${submissionId}`,
  checkin: (userId: string, isoDate: string) => `checkin:${userId}:${isoDate}`,
  streak: (userId: string, milestone: number) => `streak:${userId}:${milestone}`,
  challenge: (challengeId: string, userId: string) => `challenge:${challengeId}:${userId}`,
  badge: (userId: string, badgeId: string) => `badge:${userId}:${badgeId}`,
} as const

/** Clamp a mentor's award to [0, ceiling]. Applied SERVER-SIDE in src/server/mentor.ts. */
export const clampXp = (value: number, ceiling: number): number =>
  Math.max(0, Math.min(Math.round(value), Math.round(ceiling)))

/**
 * The AI Coach's suggested XP is arithmetic, not a model output — the model GRADES, code
 * converts. Letting the model pick both invites it to hand back an XP number that
 * disagrees with the score it just gave.
 */
export const suggestedXpFromScore = (
  score: number,
  maxScore: number,
  xpAward: number,
  track: CourseTrackValue,
): number => (maxScore <= 0 ? 0 : applyTrack(xpAward * (score / maxScore), track))
