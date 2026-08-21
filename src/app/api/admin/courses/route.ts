import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.createCourse, (input) => adminServer.createCourse(input))
export const GET = defineRoute(admin.listCourses, (input) => adminServer.listCourses(input))
