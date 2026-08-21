import * as mentor from '@/contracts/mentor'
import { defineRoute } from '@/server/route'
import { students } from '@/server/mentor'

// `user!` is safe: the contract's auth level is 'user', so defineRoute has already
// returned 401 if there is no session.
export const GET = defineRoute(mentor.students, (input, { user }) => students(user!, input))
