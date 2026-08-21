import * as mentor from '@/contracts/mentor'
import { defineRoute } from '@/server/route'
import { getForReview } from '@/server/mentor'

// `user!` is safe: the contract's auth level is 'user', so defineRoute has already
// returned 401 if there is no session.
export const GET = defineRoute(mentor.get, (input, { user }) => getForReview(user!, input.id))
