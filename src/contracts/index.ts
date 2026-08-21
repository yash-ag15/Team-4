// The registry. Append-only: a new feature is one import line and one key,
// so two people adding features on the same day touch two different lines.
//
// Registered here => the endpoint appears in `api.<key>.<op>()` and at /dev/api.
import * as admin from './admin'
import * as aiCoach from './ai-coach'
import * as courses from './courses'
import * as enrollments from './enrollments'
import * as sessions from './sessions'
import * as submissions from './submissions'
import * as users from './users'
import * as userDashboard from './user-dashboard'

// Union of both sides: this branch's aiCoach plus main's admin / courses / enrollments /
// sessions / userDashboard. Every module named here exists in src/contracts.
// The starter's `projects` / `tasks` are deliberately absent — their schema tables are
// gone, so registering them would expose endpoints backed by nothing.
export const contracts = { admin, aiCoach, courses, enrollments, sessions, submissions, users, userDashboard }
export type Contracts = typeof contracts
