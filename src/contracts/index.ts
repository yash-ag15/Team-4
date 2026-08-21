// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
import * as admin from './admin'
import * as courses from './courses'
import * as mentor from './mentor'
import * as sessions from './sessions'
import * as users from './users'
import * as userDashboard from './user-dashboard'

export const contracts = { admin, courses, mentor, sessions, users, userDashboard }
export type Contracts = typeof contracts
