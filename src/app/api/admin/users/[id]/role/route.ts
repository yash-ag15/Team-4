import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.setRole, (input, ctx) =>
  adminServer.setRole(input, ctx.user!.id),
)
