import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).default('draft').notNull(),
  volunteerCount: integer('volunteer_count').default(0).notNull(),
  ownerId: text('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
