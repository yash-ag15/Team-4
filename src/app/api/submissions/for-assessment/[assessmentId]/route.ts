import * as submissions from '@/contracts/submissions'
import { defineRoute } from '@/server/route'
import { forAssessment } from '@/server/submissions'

// Scoped to the signed-in student — a submission id is never taken from the client here.
export const GET = defineRoute(submissions.forAssessment, ({ assessmentId }, { user }) =>
  forAssessment(user!.id, assessmentId),
)
