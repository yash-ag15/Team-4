import * as userDashboard from '@/contracts/user-dashboard'
import { defineRoute } from '@/server/route'

// Stub — serves contract mock until src/server/progress.ts is implemented.
// The real handler depends on schema tables (courses.ts, learning.ts, engagement.ts)
// that are owned by Siddesh and not yet migrated. Add the handler argument here
// once those tables exist and progress.getDashboard(userId) is ready.
//
// TODO(Ayush): wire handler once DB schema is live:
//   import { getDashboard } from '@/server/progress'
//   export const GET = defineRoute(userDashboard.dashboard, (_input, { user }) =>
//     getDashboard(user!.id),
//   )
export const GET = defineRoute(userDashboard.dashboard)
