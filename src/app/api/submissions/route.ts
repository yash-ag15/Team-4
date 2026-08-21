import * as submissions from '@/contracts/submissions'
import { defineRoute } from '@/server/route'
import { create } from '@/server/submissions'

// Live. `user!` is safe: the contract's auth level is 'user', so defineRoute has already
// returned 401 when there is no session.
export const POST = defineRoute(submissions.create, (input, { user }) => create(user!.id, input))
