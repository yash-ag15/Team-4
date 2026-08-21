import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(admin.getModule, (input) =>
  adminServer.getModule(input),
)
export const PUT = defineRoute(admin.updateModule, (input) =>
  adminServer.updateModule(input),
)
