import * as courses from '@/contracts/courses'
import * as coursesServer from '@/server/courses'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(courses.get, (input, ctx) =>
  coursesServer.getCourse(input.slug, ctx.user),
)
