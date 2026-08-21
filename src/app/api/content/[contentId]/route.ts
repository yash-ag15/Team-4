import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(admin.getContent, ({ contentId }) =>
  adminServer.getContent(contentId),
)

export const PUT = defineRoute(admin.updateContent, (input) =>
  adminServer.updateContent(input.contentId, input),
)
