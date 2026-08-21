import * as courses from '@/contracts/courses'
import * as coursesServer from '@/server/courses'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(courses.mine, (_input, ctx) =>
  coursesServer.listMentorCourses(ctx.user),
)
