// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
import * as admin from './admin'
import * as courses from './courses'
import * as users from './users'

export const contracts = { admin, courses, users }
export type Contracts = typeof contracts
