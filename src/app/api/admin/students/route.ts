import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(admin.listStudents, (input) =>
  adminServer.listStudents(input),
)
