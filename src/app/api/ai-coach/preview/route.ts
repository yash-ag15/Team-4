import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'
import { preview } from '@/server/ai-coach'

// NOT optional. A review takes 10-25s and the default Vercel Function timeout kills it.
export const maxDuration = 60

export const POST = defineRoute(aiCoach.preview, (input, { user }) => preview(user!.id, input))
