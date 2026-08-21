import { pgTable, text, timestamp, boolean, integer, pgEnum, date } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { courses } from './courses';

export const xpEventReasonEnum = pgEnum('xp_event_reason', ['lesson_complete', 'section_complete', 'course_complete', 'certificate', 'assessment_award', 'daily_checkin', 'streak_bonus', 'challenge_complete', 'badge_award', 'manual_adjust']);

export const xpEvents = pgTable('xp_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(),
  reason: xpEventReasonEnum('reason').notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  courseId: text('course_id').references(() => courses.id),
  awardedBy: text('awarded_by').references(() => user.id),
  note: text('note').default('').notNull(),
  idempotencyKey: text('idempotency_key').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const streaks = pgTable('streaks', {
  userId: text('user_id').primaryKey().references(() => user.id),
  current: integer('current').default(0).notNull(),
  longest: integer('longest').default(0).notNull(),
  lastCheckinDate: date('last_checkin_date'),
  freezesLeft: integer('freezes_left').default(2).notNull(),
});

export const dailyCheckins = pgTable('daily_checkins', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  checkinDate: date('checkin_date').notNull(),
  streakAfter: integer('streak_after').notNull(),
  xpAwarded: integer('xp_awarded').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const badgeRarityEnum = pgEnum('badge_rarity', ['common', 'rare', 'epic', 'legendary']);

export const badges = pgTable('badges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  emoji: text('emoji').notNull(),
  criteria: text('criteria').notNull(),
  xpReward: integer('xp_reward').default(25).notNull(),
  rarity: badgeRarityEnum('rarity').notNull(),
  sortIndex: integer('sort_index').notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  badgeId: text('badge_id').references(() => badges.id).notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const challengeKindEnum = pgEnum('challenge_kind', ['course', 'weekly', 'global']);
export const challengeTargetTypeEnum = pgEnum('challenge_target_type', ['lessons_completed', 'xp_earned', 'submissions', 'checkin_streak']);

export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  kind: challengeKindEnum('kind').notNull(),
  targetType: challengeTargetTypeEnum('target_type').notNull(),
  targetValue: integer('target_value').notNull(),
  xpReward: integer('xp_reward').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  active: boolean('active').default(true).notNull(),
});

export const challengeProgress = pgTable('challenge_progress', {
  id: text('id').primaryKey(),
  challengeId: text('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  current: integer('current').default(0).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
