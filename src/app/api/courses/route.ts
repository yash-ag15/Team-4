import * as courses from '@/contracts/courses'
import * as coursesServer from '@/server/courses'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(courses.create, (input, ctx) =>
  coursesServer.createCourse(input, ctx.user),
)

export const GET = defineRoute(courses.list, (input, ctx) =>
  coursesServer.listCourses(input),
)
