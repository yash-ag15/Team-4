import { defineRoute } from '@/server/route'
import * as aiCoach from '@/contracts/ai-coach'
import { review } from '@/server/ai-coach'
import { assertOwnsSubmission } from '@/server/submissions'

export const maxDuration = 60

/**
 * Review a SUBMITTED assessment. This is the only AI path a student reaches after
 * submitting to the mentor — `aiCoach.preview` is the draft-time one.
 *
 * The ownership check is not optional: the input is a bare `submissionId`, and a review
 * quotes the submission's own text back in its strengths and weaknesses. Without it any
 * signed-in user could post someone else's id and read their work.
 */
export const POST = defineRoute(aiCoach.review, async (input, { user }) => {
  await assertOwnsSubmission(user!.id, input.submissionId)
  return review(input)
})
