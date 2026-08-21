import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'

export const maxDuration = 60

export const GET = defineRoute(aiCoach.brief)
