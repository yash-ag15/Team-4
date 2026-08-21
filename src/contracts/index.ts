// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
//
// Registered here => the endpoint appears in `api.<key>.<op>()` and at /dev/api.
import * as admin from './admin'
import * as aiCoach from './ai-coach'
import * as courses from './courses'
import * as sessions from './sessions'
import * as users from './users'
import * as userDashboard from './user-dashboard'

// Union of both sides: this branch's aiCoach plus main's admin/courses/sessions/
// userDashboard. Every module listed here exists in src/contracts.
export const contracts = { admin, aiCoach, courses, sessions, users, userDashboard }
export type Contracts = typeof contracts
