import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(admin.getTask, (input) =>
  adminServer.getTask(input),
)
export const PUT = defineRoute(admin.updateTask, (input) =>
  adminServer.updateTask(input),
)
