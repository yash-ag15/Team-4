import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  done: boolean('done').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
