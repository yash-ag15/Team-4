import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'

// maxDuration is NOT optional here. A review takes 10-25s; the default Vercel Function
// timeout kills it. See plans/katalyst/ai-coach.md.
export const maxDuration = 60

// No handler yet -> serves contract.mock. Add the second argument
// (`(input, { user }) => preview(user!.id, input)`) when src/server/ai-coach.ts exists.
export const POST = defineRoute(aiCoach.preview)
