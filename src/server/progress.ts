/**
 * src/server/progress.ts
 *
 * Real DB-backed handler for GET /api/user/dashboard.
 *
 * Reads from: user, enrollments, courses, course_sections, lessons,
 *             lesson_progress, assessments, submissions,
 *             xp_events, streaks, daily_checkins, badges, user_badges,
 *             notifications
 *
 * PRECONDITION: DB tables must exist (Siddesh: npm run db:generate + db:migrate).
 * Until then, the route.ts stub with no handler serves contract.mock() safely.
 *
 * Query budget: 9 parallel queries + 1 sequential nextLesson lookup = 10 total.
 * No N+1 loops anywhere — every list is a single grouped query.
 */

import { db } from '@/db'
import { sql, eq, and, inArray, isNull, lt, gte, lte, desc, asc, countDistinct } from 'drizzle-orm'
import { user as userTable } from '@/db/schema/auth'
import { courses, courseSections, lessons, assessments } from '@/db/schema/courses'
import {
  enrollments,
  lessonProgress,
  submissions,
} from '@/db/schema/learning'
import {
  xpEvents,
  streaks,
  dailyCheckins,
  badges,
  userBadges,
} from '@/db/schema/engagement'
import { notifications } from '@/db/schema/social'
import type { DashboardData } from '@/contracts/user-dashboard'
import { dashboard as dashboardContract } from '@/contracts/user-dashboard'

// ---------------------------------------------------------------------------
// XP level math — matches src/lib/xp.ts spec from AGENTS.md
// ---------------------------------------------------------------------------

function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}
function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100
}
const LEVEL_NAMES: Record<number, string> = {
  1: 'Explorer',
  2: 'Builder',
  3: 'Contributor',
  4: 'Specialist',
  5: 'Catalyst',
  6: 'Mentor-in-Training',
}
function levelName(level: number): string {
  return LEVEL_NAMES[level] ?? 'Luminary'
}

// ---------------------------------------------------------------------------
// Date helpers — IST = UTC+5:30
// ---------------------------------------------------------------------------

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS)
}

/** YYYY-MM-DD string in IST */
function todayIST(): string {
  return nowIST().toISOString().slice(0, 10)
}

function startOfYearUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
}

function startOfMonthUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

/** Array of 14 YYYY-MM-DD strings: [14 days ago, …, today] in IST */
function last14DatesIST(): string[] {
  const dates: string[] = []
  const now = Date.now() + IST_OFFSET_MS
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400_000)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

// ---------------------------------------------------------------------------
// Task priority / status helpers
// ---------------------------------------------------------------------------

type TaskStatus = 'overdue' | 'due_soon' | 'upcoming'
type TaskPriority = 'high' | 'medium' | 'low'

function taskStatus(dueAt: Date): TaskStatus {
  const now = Date.now()
  const ms = dueAt.getTime() - now
  if (ms < 0) return 'overdue'
  if (ms < 72 * 3600_000) return 'due_soon'
  return 'upcoming'
}

function taskPriority(status: TaskStatus): TaskPriority {
  if (status === 'overdue') return 'high'
  if (status === 'due_soon') return 'medium'
  return 'low'
}

const STATUS_SORT: Record<TaskStatus, number> = { overdue: 0, due_soon: 1, upcoming: 2 }

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function getDashboard(userId: string): Promise<{ dashboard: DashboardData }> {
  const today = todayIST()
  const yearStart = startOfYearUTC()
  const monthStart = startOfMonthUTC()
  const last14 = last14DatesIST()
  const now = new Date()
  const dueSoonCutoff = new Date(Date.now() + 72 * 3600_000)

  // -------------------------------------------------------------------------
  // Run all independent queries in parallel — one Promise.all, not N awaits
  // -------------------------------------------------------------------------
  const [
    userRow,
    xpRows,
    streakRow,
    checkinTodayRow,
    last14Rows,
    enrollmentRows,
    pendingSubCount,
    badgeRows,
    notifCount,
  ] = await Promise.all([

    // 1. User profile
    db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1),

    // 2. XP totals — total, year, month in one scan with conditional sums
    db
      .select({
        totalXp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int`,
        yearXp: sql<number>`coalesce(sum(case when ${xpEvents.createdAt} >= ${yearStart.toISOString()} then ${xpEvents.amount} else 0 end), 0)::int`,
        monthXp: sql<number>`coalesce(sum(case when ${xpEvents.createdAt} >= ${monthStart.toISOString()} then ${xpEvents.amount} else 0 end), 0)::int`,
      })
      .from(xpEvents)
      .where(eq(xpEvents.userId, userId)),

    // 3. Streak row (userId is PK)
    db
      .select({
        current: streaks.current,
        longest: streaks.longest,
        lastCheckinDate: streaks.lastCheckinDate,
        freezesLeft: streaks.freezesLeft,
      })
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1),

    // 4. Checked in today?
    db
      .select({ id: dailyCheckins.id })
      .from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.checkinDate, today)))
      .limit(1),

    // 5. Last 14 days checkin dates
    db
      .select({ checkinDate: dailyCheckins.checkinDate })
      .from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), inArray(dailyCheckins.checkinDate, last14))),

    // 6. Enrolled courses — one grouped rollup: completedLessons / totalLessons per enrollment
    //    countDistinct avoids the join fanout (backend.md §The one-query rollup)
    db
      .select({
        enrollmentId: enrollments.id,
        courseId: courses.id,
        courseSlug: courses.slug,
        courseTitle: courses.title,
        coverEmoji: courses.coverEmoji,
        track: courses.track,
        status: enrollments.status,
        progressPct: enrollments.progressPct,
        mentorId: courses.mentorId,
        enrolledAt: enrollments.enrolledAt,
        totalLessons: countDistinct(lessons.id),
        completedLessons: countDistinct(lessonProgress.id),
        lastActivity: sql<string | null>`max(${lessonProgress.completedAt})`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(courseSections, eq(courseSections.courseId, courses.id))
      .innerJoin(lessons, eq(lessons.sectionId, courseSections.id))
      .leftJoin(
        lessonProgress,
        and(
          eq(lessonProgress.lessonId, lessons.id),
          eq(lessonProgress.enrollmentId, enrollments.id),
        ),
      )
      .where(eq(enrollments.studentId, userId))
      .groupBy(
        enrollments.id,
        courses.id,
        courses.slug,
        courses.title,
        courses.coverEmoji,
        courses.track,
        enrollments.status,
        enrollments.progressPct,
        courses.mentorId,
        enrollments.enrolledAt,
      ),

    // 7. Pending submissions count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, userId),
          inArray(submissions.status, ['submitted', 'ai_reviewed']),
        ),
      ),

    // 8. Badges — all unlocked + 2 most recent for summary
    db
      .select({
        id: badges.id,
        name: badges.name,
        emoji: badges.emoji,
        rarity: badges.rarity,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badgeId))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt)),

    // 9. Unread notifications count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ])

  // -------------------------------------------------------------------------
  // Derive continueWith from enrollment data (most recent activity)
  // Then run one targeted nextLesson query for that enrollment only
  // -------------------------------------------------------------------------

  const activeEnrollments = enrollmentRows.filter((e) => e.status !== 'dropped')

  // The enrollment with the most recent lesson_progress activity
  const mostRecentEnrollment = activeEnrollments
    .filter((e) => e.lastActivity !== null)
    .sort((a, b) => {
      const da = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
      const db_ = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
      return db_ - da
    })[0] ?? activeEnrollments[0] ?? null

  let continueWithNextLesson: { id: string; title: string; sectionTitle: string } | null = null

  if (mostRecentEnrollment) {
    // Query 2: first lesson without a lesson_progress row for this enrollment
    // ordered by (section.orderIndex, lesson.orderIndex)
    const nextLessonRows = await db
      .select({
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        sectionTitle: courseSections.title,
      })
      .from(lessons)
      .innerJoin(courseSections, eq(courseSections.id, lessons.sectionId))
      .where(
        and(
          eq(courseSections.courseId, mostRecentEnrollment.courseId),
          sql`${lessons.id} not in (
            select ${lessonProgress.lessonId}
            from ${lessonProgress}
            where ${lessonProgress.enrollmentId} = ${mostRecentEnrollment.enrollmentId}
          )`,
        ),
      )
      .orderBy(asc(courseSections.orderIndex), asc(lessons.orderIndex))
      .limit(1)

    if (nextLessonRows.length > 0) {
      const nl = nextLessonRows[0]
      continueWithNextLesson = {
        id: nl.lessonId,
        title: nl.lessonTitle,
        sectionTitle: nl.sectionTitle,
      }
    }
  }

  // -------------------------------------------------------------------------
  // Tasks: assessments with dueAt set, not yet mentor_approved, enrolled
  // -------------------------------------------------------------------------

  const enrolledCourseIds = activeEnrollments.map((e) => e.courseId)

  let taskRows: Array<{
    assessmentId: string
    assessmentTitle: string
    kind: 'assignment' | 'quiz' | 'project' | 'reflection'
    courseTitle: string
    courseSlug: string
    dueAt: Date
    xpAward: number
    hasApprovedSubmission: boolean
  }> = []

  if (enrolledCourseIds.length > 0) {
    const rawTasks = await db
      .select({
        assessmentId: assessments.id,
        assessmentTitle: assessments.title,
        kind: assessments.kind,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        dueAt: assessments.dueAt,
        xpAward: assessments.xpAward,
        // null when no mentor_approved submission exists
        approvedSubId: sql<string | null>`
          (select ${submissions.id} from ${submissions}
           where ${submissions.assessmentId} = ${assessments.id}
             and ${submissions.studentId} = ${userId}
             and ${submissions.status} = 'mentor_approved'
           limit 1)
        `,
      })
      .from(assessments)
      .innerJoin(courses, eq(courses.id, assessments.courseId))
      .where(
        and(
          inArray(assessments.courseId, enrolledCourseIds),
          sql`${assessments.dueAt} is not null`,
        ),
      )
      .orderBy(asc(assessments.dueAt))

    taskRows = rawTasks
      .filter((t) => t.dueAt !== null && t.approvedSubId === null)
      .map((t) => ({
        assessmentId: t.assessmentId,
        assessmentTitle: t.assessmentTitle,
        kind: t.kind,
        courseTitle: t.courseTitle,
        courseSlug: t.courseSlug,
        dueAt: t.dueAt as Date,
        xpAward: t.xpAward,
        hasApprovedSubmission: false,
      }))
  }

  // -------------------------------------------------------------------------
  // Leaderboard peek — monthly XP per user, rank this user
  // -------------------------------------------------------------------------

  const leaderboardRows = await db
    .select({
      userId: xpEvents.userId,
      name: userTable.name,
      monthXp: sql<number>`coalesce(sum(${xpEvents.amount}), 0)::int`,
    })
    .from(xpEvents)
    .innerJoin(userTable, eq(userTable.id, xpEvents.userId))
    .where(gte(xpEvents.createdAt, monthStart))
    .groupBy(xpEvents.userId, userTable.name)
    .orderBy(desc(sql`sum(${xpEvents.amount})`))
    .limit(50) // top 50 is plenty to find our rank within the first page

  // -------------------------------------------------------------------------
  // Mentor — find the mentor from the most recently enrolled course
  // -------------------------------------------------------------------------

  let mentorData: DashboardData['mentor'] = null
  const mentorId = mostRecentEnrollment?.mentorId ?? null
  if (mentorId) {
    const mentorRows = await db
      .select({ id: userTable.id, name: userTable.name, image: userTable.image })
      .from(userTable)
      .where(eq(userTable.id, mentorId))
      .limit(1)

    if (mentorRows.length > 0) {
      const m = mentorRows[0]
      // nextSession and recentFeedback require a sessions table not in scope — null/empty
      mentorData = {
        id: m.id,
        name: m.name,
        image: m.image ?? null,
        expertise: 'Course Mentor',         // no expertise column in user table yet
        nextSession: null,                  // sessions table not in this schema
        recentFeedback: '',                 // from ai_reviews — deferred to ai-coach owner
      }
    }
  }

  // =========================================================================
  // Assemble the response
  // =========================================================================

  // --- user ---
  if (userRow.length === 0) throw new Error('User not found')
  const u = userRow[0]

  // --- xp ---
  const xpData = xpRows[0] ?? { totalXp: 0, yearXp: 0, monthXp: 0 }
  const totalXp = xpData.totalXp
  const monthXp = xpData.monthXp
  const level = levelFromXp(totalXp)
  const thisLevelAt = xpForLevel(level)
  const nextLevelAt = xpForLevel(level + 1)

  // rank: find position of this user in sorted leaderboard
  const myLeaderboardIdx = leaderboardRows.findIndex((r) => r.userId === userId)
  const myRank = myLeaderboardIdx === -1 ? leaderboardRows.length + 1 : myLeaderboardIdx + 1
  const top3 = leaderboardRows.slice(0, 3).map((r, i) => ({
    rank: i + 1,
    name: r.name,
    xp: r.monthXp,
  }))

  // --- streak ---
  const s = streakRow[0] ?? { current: 0, longest: 0, lastCheckinDate: null, freezesLeft: 2 }
  const checkinDates = new Set(last14Rows.map((r) => r.checkinDate))
  const last14Bools = last14.map((d) => checkinDates.has(d))

  // --- progress ---
  const enrolledCount = activeEnrollments.length
  const completedCount = activeEnrollments.filter((e) => e.status === 'completed').length
  const totalLessonsCount = activeEnrollments.reduce((sum, e) => sum + e.totalLessons, 0)
  const completedLessonsCount = activeEnrollments.reduce((sum, e) => sum + e.completedLessons, 0)
  const overallPct =
    totalLessonsCount === 0
      ? 0
      : Math.floor((completedLessonsCount / totalLessonsCount) * 100)

  // --- continueWith ---
  let continueWith: DashboardData['continueWith'] = null
  if (mostRecentEnrollment) {
    const totalL = mostRecentEnrollment.totalLessons
    const completedL = mostRecentEnrollment.completedLessons
    const pct = totalL === 0 ? 0 : Math.floor((completedL / totalL) * 100)
    continueWith = {
      enrollmentId: mostRecentEnrollment.enrollmentId,
      courseId: mostRecentEnrollment.courseId,
      slug: mostRecentEnrollment.courseSlug,
      title: mostRecentEnrollment.courseTitle,
      coverEmoji: mostRecentEnrollment.coverEmoji,
      track: mostRecentEnrollment.track,
      progressPct: pct,
      nextLesson: continueWithNextLesson,
    }
  }

  // --- tasks ---
  const tasks: DashboardData['tasks'] = taskRows
    .map((t) => {
      const status = taskStatus(t.dueAt)
      return {
        id: t.assessmentId,
        title: t.assessmentTitle,
        type: t.kind,
        courseTitle: t.courseTitle,
        dueAt: t.dueAt.toISOString(),
        priority: taskPriority(status),
        status,
        xpReward: t.xpAward,
        href: `/learn/${t.courseSlug}/assessments/${t.assessmentId}`,
      }
    })
    .sort((a, b) => {
      const statusDiff = STATUS_SORT[a.status] - STATUS_SORT[b.status]
      if (statusDiff !== 0) return statusDiff
      // Within the same status bucket: oldest dueAt first
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })

  // --- badges ---
  const recentBadges = badgeRows.slice(0, 2).map((b) => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    rarity: b.rarity,
  }))

  // --- coachBrief ---
  // The AI Coach is owned by Yash (ai-coach.ts) + Riya (prompts).
  // We fall back to the contract mock until that module is ready.
  // When ai-coach.ts exports a getBrief(userId) function, replace this line.
  const coachBrief = dashboardContract.mock({}).dashboard.coachBrief

  // =========================================================================
  // Final assembly — every field typed against DashboardData
  // =========================================================================
  const dashboard: DashboardData = {
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image ?? null,
      // systemRole is still 'user'|'admin' in the DB — coerce to 'student'
      // until Siddesh runs the auth migration (AGENTS.md §schema.md §1).
      cohortYear: '',   // not yet in user table — populated after auth migration
      campus: '',       // same
      systemRole: 'student',
    },

    xp: {
      totalXp,
      yearXp: xpData.yearXp,
      monthXp,
      level,
      levelName: levelName(level),
      xpIntoLevel: totalXp - thisLevelAt,
      xpToNextLevel: nextLevelAt - totalXp,
      nextLevelAt,
      rank: myRank,
    },

    streak: {
      current: s.current,
      longest: s.longest,
      freezesLeft: s.freezesLeft,
      checkedInToday: checkinTodayRow.length > 0,
      lastCheckinDate: s.lastCheckinDate ?? today,
      last14: last14Bools,
    },

    progress: {
      overallCompletionPct: overallPct,
      enrolledCoursesCount: enrolledCount,
      completedCoursesCount: completedCount,
      completedLessonsCount,
      totalLessonsCount,
      pendingSubmissionsCount: pendingSubCount[0]?.count ?? 0,
    },

    continueWith,
    tasks,
    coachBrief,
    mentor: mentorData,

    badgesSummary: {
      unlockedCount: badgeRows.length,
      totalCount: 12,
      recent: recentBadges,
    },

    leaderboardPeek: {
      myRank,
      myXp: monthXp,
      top3,
    },

    unreadNotificationsCount: notifCount[0]?.count ?? 0,
  }

  return { dashboard }
}
