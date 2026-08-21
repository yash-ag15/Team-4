import * as sessions from '@/contracts/sessions'
import { defineRoute } from '@/server/route'
import { revokeOtherSessions } from '@/server/sessions'

// Static segment, so Next matches this before the sibling `[id]` route.
export const POST = defineRoute(sessions.revokeOthers, (_input, { user, session }) =>
  revokeOtherSessions(user!.id, session?.id ?? null),
)
