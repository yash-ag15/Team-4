import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { projects } from './projects'

export const tasks = pgTable('tasks', {
  // text id — see the note in projects.ts: seeded ids must match the mock fixtures' ids.
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
