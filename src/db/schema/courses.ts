import { pgTable, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const courseCategoryEnum = pgEnum('course_category', ['technical', 'business', 'communication', 'leadership', 'wellbeing']);
export const courseTrackEnum = pgEnum('course_track', ['mandatory', 'optional']);
export const courseDifficultyEnum = pgEnum('course_difficulty', ['beginner', 'intermediate', 'advanced']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default('').notNull(),
  description: text('description').default('').notNull(),
  coverEmoji: text('cover_emoji').default('📘').notNull(),
  category: courseCategoryEnum('category').notNull(),
  track: courseTrackEnum('track').notNull(),
  difficulty: courseDifficultyEnum('difficulty').notNull(),
  certificateEligible: boolean('certificate_eligible').default(false).notNull(),
  estimatedHours: integer('estimated_hours').default(0).notNull(),
  xpBonusOnComplete: integer('xp_bonus_on_complete').default(100).notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  status: courseStatusEnum('status').notNull(),
  mentorId: text('mentor_id').references(() => user.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courseSections = pgTable('course_sections', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  summary: text('summary').default('').notNull(),
  orderIndex: integer('order_index').notNull(),
  xpAward: integer('xp_award').default(50).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lessonKindEnum = pgEnum('lesson_kind', ['video', 'reading', 'link']);

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').references(() => courseSections.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  kind: lessonKindEnum('kind').notNull(),
  contentUrl: text('content_url').default('').notNull(),
  contentBody: text('content_body').default('').notNull(),
  durationMin: integer('duration_min').default(5).notNull(),
  orderIndex: integer('order_index').notNull(),
  xpAward: integer('xp_award').default(10).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const assessmentKindEnum = pgEnum('assessment_kind', ['assignment', 'quiz', 'project', 'reflection']);

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  sectionId: text('section_id').references(() => courseSections.id),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  rubric: text('rubric').notNull(),
  kind: assessmentKindEnum('kind').notNull(),
  maxScore: integer('max_score').default(100).notNull(),
  xpAward: integer('xp_award').default(150).notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
