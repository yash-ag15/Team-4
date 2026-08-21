import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'
import { review } from '@/server/ai-coach'

export const maxDuration = 60

// Normally invoked server-side by src/server/submissions.ts right after the submission
// row commits. Exposed as a route so a student can retry a review that failed.
export const POST = defineRoute(aiCoach.review, (input) => review(input))
