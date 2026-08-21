import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const notificationKindEnum = pgEnum('notification_kind', ['due_soon', 'overdue', 'xp_awarded', 'review_ready', 'challenge', 'nudge', 'escalation']);

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  kind: notificationKindEnum('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  href: text('href').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cohortYear: text('cohort_year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id').references(() => teams.id).notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
});
