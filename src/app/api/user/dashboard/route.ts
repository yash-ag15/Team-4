import * as userDashboard from '@/contracts/user-dashboard'
import { defineRoute } from '@/server/route'
import { getDashboard } from '@/server/progress'

// Live — backed by the Katalyst DB tables.
// Precondition: Siddesh must run npm run db:generate + npm run db:migrate
// before this handler can return real data. Until then, use ?__mock=1 or
// set API_MODE=mock in .env.local to force mock mode.
export const GET = defineRoute(userDashboard.dashboard, (_input, { user }) =>
  getDashboard(user!.id),
)
