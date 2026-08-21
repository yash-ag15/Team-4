import { inArray } from 'drizzle-orm'
import { db } from '../db'
import { submissions, user, courses, assessments } from '../db/schema'
import { queue, getForReview, decide } from '../server/mentor'

async function test() {
  console.log('Testing Mentor Review Endpoints (Live)...')

  // Find or create test mentor
  const [mentor] = await db.select().from(user).where(inArray(user.systemRole, ['mentor', 'admin'])).limit(1)
  const sessionUser = mentor ? { id: mentor.id, systemRole: mentor.systemRole } : { id: 'admin-1', systemRole: 'admin' }

  // 1. Test Queue
  const queueResult = await queue(sessionUser, { limit: 10 })
  console.log('✅ queue() returned submissions count:', queueResult.submissions.length, 'total:', queueResult.total)

  // 2. Pick a submission or test with first submission
  const [firstSub] = await db.select({ id: submissions.id }).from(submissions).limit(1)
  if (firstSub) {
    console.log('Testing getForReview with submission ID:', firstSub.id)
    const detail = await getForReview(sessionUser, firstSub.id)
    console.log('✅ getForReview() returned submission:', detail.submission.id, 'title:', detail.submission.assessmentTitle)
    console.log('✅ AI Review score:', detail.aiReview?.score, 'suggested XP:', detail.aiReview?.suggestedXp)

    // 3. Test Decide
    const decideRes = await decide(sessionUser, {
      id: firstSub.id,
      decision: 'approve',
      finalScore: 90,
      finalXp: 50,
      mentorNote: 'Excellent work and clear explanations across all rubric criteria.',
    })
    console.log('✅ decide() succeeded with status:', decideRes.status, 'awarded XP:', decideRes.award?.amount)
  } else {
    console.log('No submissions in database to test getForReview/decide on.')
  }
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err)
    process.exit(1)
  })
