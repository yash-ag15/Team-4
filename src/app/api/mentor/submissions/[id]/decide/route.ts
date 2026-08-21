import * as mentor from '@/contracts/mentor'
import { defineRoute } from '@/server/route'
import { decide } from '@/server/mentor'

// `user!` is safe: the contract's auth level is 'user', so defineRoute has already
// returned 401 if there is no session.
export const POST = defineRoute(mentor.decide, (input, { user }) => decide(user!, input))
