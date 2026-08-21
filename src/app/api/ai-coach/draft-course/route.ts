import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'

export const maxDuration = 60

// GOOD-TO-HAVE (feature 13). Live as a mock so the authoring wizard can be built,
// but do not write the handler before Gate C is green.
export const POST = defineRoute(aiCoach.draftCourse)
