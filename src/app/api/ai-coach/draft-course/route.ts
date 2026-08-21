import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'
import { draftCourse } from '@/server/ai-coach'

export const maxDuration = 60

// GOOD-TO-HAVE (feature 13). Live, but do not build the authoring UI against it before
// Gate C is green. The mentor/admin check lives in src/server/ai-coach.ts.
export const POST = defineRoute(aiCoach.draftCourse, (input, { user }) =>
  draftCourse((user as { systemRole?: string } | null)?.systemRole ?? 'student', input),
)
