import { pgTable, text, timestamp, integer, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { courses, courseSections, lessons, assessments } from './courses';

export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped']);

export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id).notNull(),
  studentId: text('student_id').references(() => user.id).notNull(),
  status: enrollmentStatusEnum('status').notNull(),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  progressPct: integer('progress_pct').default(0).notNull(),
  xpEarned: integer('xp_earned').default(0).notNull(),
});

export const lessonProgress = pgTable('lesson_progress', {
  id: text('id').primaryKey(),
  enrollmentId: text('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  lessonId: text('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sectionProgress = pgTable('section_progress', {
  id: text('id').primaryKey(),
  enrollmentId: text('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  sectionId: text('section_id').references(() => courseSections.id, { onDelete: 'cascade' }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  xpAwarded: integer('xp_awarded').notNull(),
});

export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'ai_reviewed', 'mentor_approved', 'changes_requested']);

export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').references(() => assessments.id).notNull(),
  studentId: text('student_id').references(() => user.id).notNull(),
  enrollmentId: text('enrollment_id').references(() => enrollments.id).notNull(),
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url').default('').notNull(),
  status: submissionStatusEnum('status').notNull(),
  aiScore: integer('ai_score'),
  aiXpSuggested: integer('ai_xp_suggested'),
  finalScore: integer('final_score'),
  finalXp: integer('final_xp'),
  mentorId: text('mentor_id').references(() => user.id),
  mentorNote: text('mentor_note').default('').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiReviewConfidenceEnum = pgEnum('ai_review_confidence', ['low', 'medium', 'high']);

export const aiReviews = pgTable('ai_reviews', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  model: text('model').notNull(),
  summary: text('summary').notNull(),
  strengths: jsonb('strengths').$type<string[]>().notNull(),
  weaknesses: jsonb('weaknesses').$type<string[]>().notNull(),
  actionItems: jsonb('action_items').$type<string[]>().notNull(),
  rubricBreakdown: jsonb('rubric_breakdown').notNull(),
  suggestedScore: integer('suggested_score').notNull(),
  suggestedXp: integer('suggested_xp').notNull(),
  confidence: aiReviewConfidenceEnum('confidence').notNull(),
  isPreview: boolean('is_preview').default(false).notNull(),
  latencyMs: integer('latency_ms').notNull(),
  tokensIn: integer('tokens_in').notNull(),
  tokensOut: integer('tokens_out').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
