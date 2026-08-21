import * as sessions from '@/contracts/sessions'
import { defineRoute } from '@/server/route'
import { listSessions } from '@/server/sessions'

// Live. `user!` is safe — the contract's auth level is 'user', so defineRoute has
// already returned 401 when there is no session. `session` can still be null (a dev
// mock identity has no session row), in which case nothing is flagged as current.
export const GET = defineRoute(sessions.list, (_input, { user, session }) =>
  listSessions(user!.id, session?.id ?? null),
)
