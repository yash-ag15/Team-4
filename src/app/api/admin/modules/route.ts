import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.createModule, (input, ctx) =>
  adminServer.createModule(input, ctx.user!.id),
)
export const GET = defineRoute(admin.listModules, (input) =>
  adminServer.listModules(input),
)
