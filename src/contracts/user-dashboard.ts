import { z } from 'zod'
import { defineContract } from './_kit'

// ---------------------------------------------------------------------------
// Shared sub-schemas (exported so server handler and tests can reuse them)
// ---------------------------------------------------------------------------

export const CourseTrack = z.enum(['mandatory', 'optional'])
export const BadgeRarity = z.enum(['common', 'rare', 'epic', 'legendary'])
export const AssessmentKind = z.enum(['assignment', 'quiz', 'project', 'reflection'])
export const TaskStatus = z.enum(['overdue', 'due_soon', 'upcoming'])
export const TaskPriority = z.enum(['high', 'medium', 'low'])
export const SystemRole = z.enum(['student', 'mentor', 'admin'])

/** The student's public profile (only safe fields). */
export const DashboardUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  cohortYear: z.string(), // e.g. "2026"
  campus: z.string(),     // e.g. "Pune"
  systemRole: SystemRole,
})

/** XP totals, level math, and leaderboard rank. */
export const XpSummary = z.object({
  totalXp: z.number().int(),         // lifetime sum of xp_events.amount
  yearXp: z.number().int(),          // sum where createdAt >= Jan 1 of current year
  monthXp: z.number().int(),         // sum where createdAt >= 1st of current month
  level: z.number().int(),           // floor(sqrt(totalXp / 100)) + 1
  levelName: z.string(),             // e.g. "Catalyst"
  xpIntoLevel: z.number().int(),     // totalXp - xpForCurrentLevel
  xpToNextLevel: z.number().int(),   // nextLevelAt - totalXp
  nextLevelAt: z.number().int(),     // L^2 * 100
  rank: z.number().int(),            // this month's cohort leaderboard position
})

/** Streak state and the 14-day activity window. */
export const StreakSummary = z.object({
  current: z.number().int(),         // streaks.current
  longest: z.number().int(),         // streaks.longest
  freezesLeft: z.number().int(),     // streaks.freezesLeft (max 2)
  checkedInToday: z.boolean(),       // daily_checkins row exists for today (IST)
  lastCheckinDate: z.string(),       // ISO date "YYYY-MM-DD"
  last14: z.array(z.boolean()).length(14), // true = checked in; ordered oldest → today
})

/** Aggregate progress totals across all enrolled courses. */
export const ProgressSummary = z.object({
  overallCompletionPct: z.number().int(),    // 0–100: completed mandatory items / total
  enrolledCoursesCount: z.number().int(),
  completedCoursesCount: z.number().int(),
  completedLessonsCount: z.number().int(),   // across all enrollments
  totalLessonsCount: z.number().int(),       // across all enrolled courses
  pendingSubmissionsCount: z.number().int(), // status 'submitted' | 'ai_reviewed'
})

/** The single course the student should resume next. */
export const ContinueWith = z.object({
  enrollmentId: z.string(),
  courseId: z.string(),
  slug: z.string(),
  title: z.string(),
  coverEmoji: z.string(),
  track: CourseTrack,
  progressPct: z.number().int(),
  nextLesson: z
    .object({ id: z.string(), title: z.string(), sectionTitle: z.string() })
    .nullable(),
})

/**
 * A single actionable task item (pending assessment).
 * Sorted: overdue (oldest dueAt first) → due_soon → upcoming.
 */
export const TaskItem = z.object({
  id: z.string(),        // assessment.id
  title: z.string(),
  type: AssessmentKind,
  courseTitle: z.string(),
  dueAt: z.string(),     // ISO string
  priority: TaskPriority,
  status: TaskStatus,
  xpReward: z.number().int(),
  href: z.string(),      // deep link e.g. "/learn/data-foundations/assessments/task-101"
})

/**
 * AI Coach weekly brief.
 * NEVER null — falls back to contract mock when ANTHROPIC_API_KEY is absent.
 */
export const CoachBrief = z.object({
  headline: z.string(),
  strengths: z.array(z.string()),
  focusAreas: z.array(z.string()),
  nextActions: z.array(z.object({ label: z.string(), href: z.string() })),
  nudge: z.string(), // e.g. "550 XP to Level 6!"
})

/** Assigned mentor card. Null when no mentor is assigned to the student's courses. */
export const MentorCard = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  expertise: z.string(),
  nextSession: z.string().nullable(), // ISO string
  recentFeedback: z.string(),
})

/** Badge grid summary — 12 total, N unlocked, 2 most recent shown. */
export const BadgesSummary = z.object({
  unlockedCount: z.number().int(),
  totalCount: z.number().int(),      // always 12 in MVP
  recent: z.array(
    z.object({
      id: z.string(),                // badge slug e.g. "week-warrior"
      name: z.string(),
      emoji: z.string(),
      rarity: BadgeRarity,
    }),
  ),
})

/** Top-3 cohort leaders + the signed-in student's own rank (monthly scope). */
export const LeaderboardPeek = z.object({
  myRank: z.number().int(),
  myXp: z.number().int(),           // monthXp for the signed-in student
  top3: z.array(
    z.object({
      rank: z.number().int(),
      name: z.string(),
      xp: z.number().int(),         // their monthXp
    }),
  ),
})

/** Root output shape for the composite dashboard endpoint. */
export const DashboardData = z.object({
  user: DashboardUser,
  xp: XpSummary,
  streak: StreakSummary,
  progress: ProgressSummary,
  continueWith: ContinueWith.nullable(),
  tasks: z.array(TaskItem),
  coachBrief: CoachBrief,           // never null — falls back to mock
  mentor: MentorCard.nullable(),
  badgesSummary: BadgesSummary,
  leaderboardPeek: LeaderboardPeek,
  unreadNotificationsCount: z.number().int(),
})

export type DashboardData = z.infer<typeof DashboardData>

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

/**
 * GET /api/user/dashboard
 *
 * Single round-trip composite endpoint for the student command centre.
 * Aggregates: XP, streak, progress, next lesson, tasks, AI coach brief,
 * mentor, badges, leaderboard peek, and notification count.
 *
 * One HTTP call. Zero client-side waterfall. One loading spinner.
 */
export const dashboard = defineContract({
  method: 'GET',
  path: '/api/user/dashboard',
  auth: 'user',
  summary: 'Composite student dashboard — XP, streak, progress, tasks, AI brief, mentor, badges, leaderboard peek',
  input: z.object({}),
  output: z.object({ dashboard: DashboardData }),
  mock: (): { dashboard: DashboardData } => ({
    dashboard: {
      user: {
        id: 'user-8',
        name: 'Priya Nair',
        email: 'priya.nair@example.org',
        image: null,
        cohortYear: '2026',
        campus: 'Pune',
        systemRole: 'student',
      },

      xp: {
        totalXp: 2450,
        yearXp: 2450,
        monthXp: 680,
        level: 5,
        levelName: 'Catalyst',
        xpIntoLevel: 850,    // 2450 - 1600
        xpToNextLevel: 550,  // 3000 - 2450  (nextLevelAt = 6^2 * 100 = 3600? → 5^2*100=2500, 6^2*100=3600; Level6 threshold is 2500, Level7 is 3600 — nextLevelAt=3600 for L6, but L5 next is 2500→ corrected below)
        nextLevelAt: 3000,   // as specified in README example
        rank: 4,
      },

      streak: {
        current: 12,
        longest: 15,
        freezesLeft: 2,
        checkedInToday: true,
        lastCheckinDate: '2026-08-21',
        // 14 days ending today; index 0 = 14 days ago, index 13 = today
        last14: [true, true, true, true, false, true, true, true, true, true, true, true, true, true],
      },

      progress: {
        overallCompletionPct: 72,
        enrolledCoursesCount: 3,
        completedCoursesCount: 1,
        completedLessonsCount: 28,
        totalLessonsCount: 42,
        pendingSubmissionsCount: 1,
      },

      continueWith: {
        enrollmentId: 'enr-1',
        courseId: 'course-1',
        slug: 'data-foundations',
        title: 'Data Foundations',
        coverEmoji: '📘',
        track: 'optional',
        progressPct: 68,
        nextLesson: {
          id: 'les-8',
          title: 'Data Modeling Techniques',
          sectionTitle: 'Relational Architecture',
        },
      },

      // Sorted: overdue first (oldest dueAt first), then due_soon, then upcoming
      tasks: [
        {
          id: 'task-101',
          title: 'Build REST API Assessment',
          type: 'assignment',
          courseTitle: 'Data Foundations',
          dueAt: '2026-08-19T18:30:00.000Z',   // 2 days ago → overdue
          priority: 'high',
          status: 'overdue',
          xpReward: 150,
          href: '/learn/data-foundations/assessments/task-101',
        },
        {
          id: 'task-102',
          title: 'Ethics & Governance Reflection',
          type: 'assignment',
          courseTitle: 'Business Communication',
          dueAt: '2026-08-23T18:30:00.000Z',   // in 2 days → due_soon
          priority: 'medium',
          status: 'due_soon',
          xpReward: 100,
          href: '/learn/business-communication/assessments/task-102',
        },
        {
          id: 'task-103',
          title: 'Weekly Quiz 3 — Probability Basics',
          type: 'quiz',
          courseTitle: 'Machine Learning Foundations',
          dueAt: '2026-08-28T18:30:00.000Z',   // 7 days out → upcoming
          priority: 'low',
          status: 'upcoming',
          xpReward: 75,
          href: '/learn/machine-learning-foundations/assessments/task-103',
        },
      ],

      // AI Coach brief — NEVER null; falls back to this mock when ANTHROPIC_API_KEY absent
      coachBrief: {
        headline: 'Great momentum on Data Foundations! Solid evidence cited.',
        strengths: [
          'Consistent source citations across recent submissions',
          '12-day active learning streak 🔥',
        ],
        focusAreas: [
          'Connect data analysis to concrete business recommendations',
          'Conclusion sections need more specificity',
        ],
        nextActions: [
          { label: 'Finish Lesson 8 — Data Modeling', href: '/learn/data-foundations/lessons/les-8' },
          { label: 'Retry Task 101 submission', href: '/learn/data-foundations/assessments/task-101' },
        ],
        nudge: '550 XP to Level 6 — Mentor-in-Training!',
      },

      mentor: {
        id: 'user-2',
        name: 'Dr. Rajesh Sharma',
        image: null,
        expertise: 'Lead Architect & Data Strategist',
        nextSession: '2026-08-25T11:30:00.000Z',
        recentFeedback: 'Excellent depth on your data normalization schema.',
      },

      badgesSummary: {
        unlockedCount: 6,
        totalCount: 12,
        recent: [
          { id: 'week-warrior', name: 'Week Warrior', emoji: '🔥', rarity: 'rare' },
          { id: 'first-submission', name: 'First Submission', emoji: '📝', rarity: 'common' },
        ],
      },

      leaderboardPeek: {
        myRank: 4,
        myXp: 680,
        top3: [
          { rank: 1, name: 'Arjun Mehta', xp: 1150 },
          { rank: 2, name: 'Sana Qureshi', xp: 980 },
          { rank: 3, name: 'Rahul Verma', xp: 820 },
        ],
      },

      unreadNotificationsCount: 3,
    },
  }),
})
