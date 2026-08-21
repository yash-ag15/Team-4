import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { user } from './auth'

export const projectStatus = pgEnum('project_status', ['draft', 'active', 'archived'])

export const projects = pgTable('projects', {
  /**
   * `text`, not `uuid`, on purpose. Real inserts still get a UUID from $defaultFn, but a
   * text id also lets the seed write the fixtures' literal ids (`project-1` …) so that
   * seeded rows carry the SAME ids the contract mocks serve. That is what makes flipping a
   * route from mock to live a non-event: /projects/project-1 resolves in both modes.
   * A `uuid` column would force the seed to derive surrogate ids and silently break every
   * deep link that worked against mock data. Also matches Better Auth's text user ids.
   */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: projectStatus('status').notNull().default('draft'),
  volunteerCount: integer('volunteer_count').notNull().default(0),
  /** FK to the generated Better Auth `user` table, whose id is `text`. */
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
