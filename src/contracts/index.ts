// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
import * as admin from './admin'
import * as courses from './courses'
import * as sessions from './sessions'
import * as users from './users'
import * as userDashboard from './user-dashboard'

// Union of both sides of the merge: origin/main's admin + courses + sessions, and this
// branch's userDashboard. The starter's `projects`/`tasks` are deliberately NOT here —
// their tables were dropped from src/db/schema, and HEAD listed them in this object
// without importing them, so that side did not compile.
export const contracts = { admin, courses, sessions, users, userDashboard }
export type Contracts = typeof contracts
