import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.createTask, (input) =>
  adminServer.createTask(input),
)
export const GET = defineRoute(admin.listTasks, (input) =>
  adminServer.listTasks(input),
)
