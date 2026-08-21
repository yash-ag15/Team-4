// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
//
// Registered here => the endpoint appears in `api.<key>.<op>()` and at /dev/api.
import * as aiCoach from './ai-coach'
import * as users from './users'

export const contracts = { aiCoach, users }
export type Contracts = typeof contracts
