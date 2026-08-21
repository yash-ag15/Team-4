import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const PATCH = defineRoute(admin.setContentStatus, (input) =>
  adminServer.setContentStatus(input.contentId, input.status),
)
