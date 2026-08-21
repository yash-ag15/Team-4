import * as sessions from '@/contracts/sessions'
import { defineRoute } from '@/server/route'
import { revokeSession } from '@/server/sessions'

export const DELETE = defineRoute(sessions.revoke, ({ id }, { user, session }) =>
  revokeSession(user!.id, session?.id ?? null, id),
)
