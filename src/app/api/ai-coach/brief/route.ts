import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'
import { brief } from '@/server/ai-coach'

export const maxDuration = 60

export const GET = defineRoute(aiCoach.brief, (_input, { user }) => brief(user!.id))
