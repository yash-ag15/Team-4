# 10 — Student Dashboard (Personal Learning Command Center)

> **Feature ID:** 10 · **Priority:** MUST · **Gate:** C (P0 Spine: Gate A & B)  
> **Target Audience Role:** `USER` (Learner / Student)  
> **Staff / Admin Role:** `PROGRAMME_STAFF` (Mentor / Admin / Ops)  
> **Contract:** `src/contracts/progress.ts` (`overview`), `src/contracts/user-dashboard.ts`  
> **Server Handlers:** `src/server/progress.ts`, `src/server/xp.ts`, `src/server/gamification.ts`, `src/server/ai-coach.ts`  
> **Page Routes:** `src/app/(student)/dashboard`, `src/app/(student)/tasks`, `src/app/(student)/study-plan`, `src/app/(student)/achievements`, `src/app/(student)/leaderboard`  
> **Global Layout / AppShell:** `src/app/(student)/layout.tsx`, `src/components/app/*`

---

## 1. PRODUCT CONTEXT & OBJECTIVE

The **Student Dashboard** transforms the Katalyst learning experience from a conventional static LMS into a **gamified personal learning command center**.

### Core Roles & Invariants
1. **Two Application Roles Only:**
   * `USER` (Student / Learner): Consumes the dashboard, tracks progress, submits assessments, maintains streaks, earns XP, and interacts with their assigned mentor and the AI Coach.
   * `PROGRAMME_STAFF` (Staff / Admin / Mentor): Authors curriculum, inspects cohort health, reviews submissions, and makes the final authoritative XP award decisions.
2. **Mentor is an Assignment, Not a Separate Role:**
   * A `USER` may have a mentor assigned via `courses.mentorId` or `mentor_assignments`. No separate mentor authentication role is required for the MVP.
3. **The Core Demo Spine (The USP):**
   * *A student submits work $\rightarrow$ AI Coach reviews it against a structured rubric, highlighting strengths/weaknesses and predicting score & XP $\rightarrow$ The mentor verifies and awards the final XP in one click.*
4. **Hard Invariant:**
   * The AI Coach writes exclusively to `ai_reviews`. Only the XP engine (`src/server/xp.ts` $\rightarrow$ `awardXp()`) writes to the immutable `xp_events` ledger using unique `idempotencyKey` values.

---

## 2. THE SIX CORE DASHBOARD QUESTIONS (UX MAPPING)

Upon opening the dashboard, a student must get immediate visual answers to six fundamental questions within 3 seconds:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE STUDENT COMMAND CENTER                                    │
├───────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│ 1. How am I doing?                │ → Total XP, Level Badge, Level Ring, Overall Completion %   │
│ 2. What should I do next?         │ → Assigned Tasks (Overdue/Due Soon), Resume Active Course   │
│ 3. Am I maintaining momentum?     │ → Active Streak (🔥), Freeze Shields, Daily Check-In CTA    │
│ 4. What have I achieved?          │ → Badges (Earned Color vs Locked Silhouettes), Certificates │
│ 5. How am I performing vs peers?  │ → Monthly Cohort Leaderboard, Sticky "My Rank" card         │
│ 6. Who is supporting me?          │ → Assigned Mentor Card, AI Coach Weekly Brief               │
└───────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. PERSISTENT GLOBAL NAVBAR & APPSHELL

The Global Navbar persists across all student-facing routes (`/dashboard`, `/learn/*`, `/catalog`, `/tasks`, `/study-plan`, `/achievements`, `/leaderboard`).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Katalyst   Dashboard  My Learning  Tasks  Study Plan  Achievements  │ [ 🔍 Search... (⌘K) ] │ 🔥 12  ⭐ 2,450 XP  🔔(3)  [Avatar ▾] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Left: Brand & Navigation
* **Logo & Brand:** Katalyst logo with cohort badge.
* **Navigation Links:**
  * **Dashboard (`/dashboard`):** The primary command center.
  * **My Learning (`/learn` / `/dashboard/learning`):** Enrolled courses, active lessons, and player resume.
  * **Tasks (`/tasks`):** Filterable to-do list across all assignments and projects.
  * **Study Plan (`/study-plan`):** Weekly roadmap, goals, and required vs. optional breakdown.
  * **Achievements (`/achievements`):** Full badge catalog, unlock progress, and certificate gallery.

### 3.2 Center: Global Unified Search
* **Search Input:** Expandable input with `Ctrl+K` / `Cmd+K` keyboard shortcut.
* **Debounce:** Frontend debounces keystrokes by 300ms before triggering `GET /api/search?q=:query`.
* **Search Coverage:**
  1. Courses (Mandatory & Optional tracks)
  2. Training Sessions
  3. Assignments & Quizzes
  4. Projects & Capstones
  5. Mentoring Activities & Sessions
  6. Milestones

### 3.3 Right: Real-time Gamification & User State
* **🔥 Streak Indicator (Always Visible):**
  * Shows active streak count (e.g. `🔥 12 day streak` or `🔥 12`).
  * Hover popover displays weekly activity dots (Mon–Sun), Freeze shields remaining (`🧊 2 left`), and next deadline.
* **⭐ XP & Level Indicator (Always Visible):**
  * Shows lifetime XP (e.g. `⭐ 2,450 XP`) and level badge (`Lvl 5 · Specialist`).
  * Hover popover displays XP progress to next level (`2,450 / 3,000 XP`).
* **🔔 Notification Bell:**
  * Dynamic unread badge counter (`count > 0`).
  * Popover dropdown displays latest notifications (XP earned, mentor feedback, overdue warnings, AI nudges).
* **👤 User Profile Avatar & Menu:**
  * User avatar with fallback initials.
  * Dropdown: Profile details, Theme toggle, Sign out.

### 3.4 Responsive Navbar Behavior (< 768px)
* Navigation links collapse into a slide-over mobile drawer (`Sheet`).
* **XP and Streak badges remain permanently pinned in the top bar** alongside the notification bell and avatar.
* Search collapses into an icon button that opens a full-screen overlay modal.

---

## 4. DASHBOARD HOMEPAGE LAYOUT & WIDGET HIERARCHY

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HERO BANNER                                                                                                │
│ Good morning, Priya! ⚡ Level 5 · Specialist (2,450 XP)                     [ 🔥 Check-In Today (+10 XP) ]  │
├───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│ PRIMARY COLUMN (65% Desktop Width)            │ SECONDARY COLUMN (35% Desktop Width)                        │
├───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. AI COACH WEEKLY BRIEF                      │ 2. DAILY STREAK & HABIT TRACKER                             │
│    "Strengths in Data analysis. Need focus    │    Current: 🔥 12 Days | Freeze Shields: 🧊 2               │
│     on recommendations before Friday."        │    [M] [T] [W] [T] [F] [S] [S]                              │
│    [ → Continue Lesson 4 ] [ → Retry Task ]   │                                                             │
├───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 3. RESUME LEARNING (Active Course)            │ 4. XP & LEVEL PROGRESSION                                   │
│    📘 Data Foundations (68% Complete)         │    Level 5 [████████████░░░░] Level 6 (550 XP to go)        │
│    Next: Lesson 8 · Data Modeling Techniques  │    Yearly XP: 2,450 XP | Monthly XP: 680 XP                 │
│    [ Continue Learning ➔ ]                    │                                                             │
├───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 5. ASSIGNED TASKS & TO-DO (Priority Order)    │ 6. ASSIGNED MENTOR CARD                                     │
│    ⚠️ [Overdue] REST API Project (Due 2d ago) │    Dr. Rajesh Sharma · Tech Lead                            │
│    📅 [Due Soon] Ethics Reflection (+150 XP)  │    Next 1:1: Thursday @ 4:00 PM                            │
│    📝 [Assigned] Weekly Quiz 3                │    Feedback: "Great progress on schema design!"             │
├───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 7. STUDY PLAN ROADMAP                         │ 8. LEADERBOARD PEEK                                         │
│    [REQUIRED] 2 Courses | [RECOMMENDED] 1 Cr  │    Rank #4 · Priya Nair (2,450 XP)                          │
│    Weekly Goal: 4 of 5 Lessons Completed      │    1. Arjun (2,800) 2. Sana (2,650) 3. Rahul (2,500)        │
│                                               │    [ View Full Leaderboard ➔ ]                              │
├───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 9. ACTIVE ENROLLMENTS                         │ 10. BADGES & ACHIEVEMENTS PREVIEW                           │
│    • Machine Learning (Mandatory) - 45%       │    🏆 6 of 12 Unlocked                                      │
│    • Business Strategy (1.5x XP) - 80%        │    [🌱] [🔥] [📝] [🎓] [🔒] [🔒]                            │
│    • Communication Skills - 100% (Certified) │                                                             │
└───────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 5. FEATURE SPECIFICATIONS & BUSINESS RULES

### 5.1 Profile & Hero Overview
* **Fields:** Name, Email, Cohort Year (`2026`), Campus (`Pune`), Level Title (`Specialist`), Level Number (`5`), Streak (`12`), Lifetime XP (`2,450`), Yearly XP (`2,450`), Monthly XP (`680`).
* **Source:** Better Auth session + `GET /api/xp/summary`.

### 5.2 Authoritative XP Engine & Progression Math
* **Level Formula:**
  $$\text{Level} = \lfloor\sqrt{\max(0, \text{totalXp}) / 100}\rfloor + 1$$
  $$\text{XP for Level } L = (L - 1)^2 \times 100$$
  $$\text{XP to Next Level} = L^2 \times 100 - \text{totalXp}$$
* **Level Progression Ramp:**
  * `Lvl 1`: Explorer (0 XP)
  * `Lvl 2`: Builder (100 XP)
  * `Lvl 3`: Contributor (400 XP)
  * `Lvl 4`: Specialist (900 XP)
  * `Lvl 5`: Catalyst (1,600 XP)
  * `Lvl 6`: Mentor-in-Training (2,500 XP)
  * `Lvl 7+`: Luminary (3,600+ XP)
* **Authoritative Award Table:**

| Trigger Event | Base XP | Multiplier | Idempotency Key Format |
|---|---|---|---|
| Complete Lesson | 10 XP | 1.5x on Optional Track | `lesson:<enrollmentId>:<lessonId>` |
| Complete Section | 50 XP | 1.5x on Optional Track | `section:<enrollmentId>:<sectionId>` |
| Complete Full Course | 100 XP | 1.5x on Optional Track | `course:<enrollmentId>` |
| Complete Certificate Course | +200 XP | 1.5x on Optional Track | `certificate:<enrollmentId>` |
| Assessment Final Award | Up to `maxScore` | 1.5x on Optional Track | `submission:<submissionId>` |
| Daily Check-in | 10 XP | Platform-wide (1.0x) | `checkin:<userId>:<YYYY-MM-DD>` |
| 7-Day Streak Milestone | 50 XP | Platform-wide (1.0x) | `streak:<userId>:<milestone>` |
| Challenge Completion | 100–250 XP | Platform-wide (1.0x) | `challenge:<challengeId>:<userId>` |
| Badge Unlock | 25–150 XP | Platform-wide (1.0x) | `badge:<userId>:<badgeId>` |

* **XP Invariants:**
  * Every award is processed exclusively via `awardXp()` in `src/server/xp.ts` inserting into `xp_events` with `onConflictDoNothing({ target: idempotencyKey })`.
  * Frontend never updates or calculates XP directly.

### 5.3 Streak System & Daily Check-In
* **Meaningful Learning Activities:**
  1. 1-Click Daily Check-in (`+10 XP`).
  2. Lesson completed (`lesson_progress`).
  3. Assessment submitted (`submissions`).
  4. Attending live mentoring/training.
* **Streak Freeze Shield:**
  * 2 freezes provided per user (`freezesLeft: 2`).
  * Forgives 1 missed day automatically.
  * 2 consecutive missed days reset streak to 1.
* **Timezone Standard:** Fixed to **Indian Standard Time (IST / Asia/Kolkata)**.

### 5.4 Progress & Completion Rate Engine
* **Formulas:**
  $$\text{Course Progress \%} = \left\lfloor\frac{\text{Completed Lessons in Course}}{\text{Total Lessons in Course}} \times 100\right\rfloor$$
  $$\text{Program Completion \%} = \left\lfloor\frac{\text{Completed Mandatory Activities}}{\text{Total Mandatory Activities}} \times 100\right\rfloor$$
* **Display Metrics:**
  * Enrolled Courses count, Completed Courses count, Completed Lessons count, Pending Submissions count, Overall Completion %.

### 5.5 Assigned Tasks Engine (Prioritized To-Do)
* **Aggregation:** Collects pending course assessments, capstone project deliverables, and mentor-assigned homework.
* **Priority Sorting:**
  1. `OVERDUE` (Red chip, past deadline, sorted oldest first).
  2. `DUE SOON` (Amber chip, due within 72h).
  3. `UPCOMING` (Blue chip, scheduled future).

### 5.6 Study Plan & Roadmap
* **Track Distinctions:**
  * `REQUIRED`: Mandatory core curriculum (has hard `dueAt`).
  * `RECOMMENDED`: AI/Mentor personalized recommendations based on previous review weaknesses.
  * `OPTIONAL`: Self-driven accelerators earning **1.5x XP**.
* **Weekly Goals:** Target lessons/week counter (`4 / 5 lessons completed`) and target XP bar.

### 5.7 Badges & Achievements (12 Core Badges)
* **Earned:** Rendered in vibrant color with timestamp and rarity chip (`common`, `rare`, `epic`, `legendary`).
* **Locked:** Rendered as grey silhouettes showing criteria and real-time counter (e.g. `3 / 5 Sections`).
* **Core Roster:** `first-steps` (25 XP), `first-submission` (25 XP), `section-sweeper` (50 XP), `week-warrior` (50 XP), `fortnight` (100 XP), `course-complete` (75 XP), `certified` (150 XP), `self-driven` (150 XP), `perfect-score` (100 XP), `top-ten` (100 XP), `early-bird` (50 XP), `comeback` (50 XP).

### 5.8 Leaderboard & Sticky User Rank
* **Authoritative Query:** Computed server-side from `xp_events`.
* **Scopes:** `month` (default, resets monthly for fair engagement), `all` (all-time).
* **Sticky "Me" Card:** Always pins the logged-in student's rank at the bottom of the widget (e.g. `Rank #18 · Priya (680 XP) · 40 XP behind Arjun`) so non-top-10 students stay motivated.

### 5.9 Assigned Mentor Interaction
* **Data Model:** Linked via `courses.mentorId` or `mentor_assignments`.
* **Card Details:** Mentor Name, Avatar, Domain Expertise, Next scheduled 1:1 session (date/time/link), and Recent Mentor Notes on submissions.
* **Empty State:** Friendly guidance message when no mentor is assigned.

### 5.10 AI Coach Integration
* **3 Touchpoints:**
  1. **Weekly Dashboard Brief (`GET /api/ai-coach/brief`):** Personalized headline, strengths, focus areas, and next actions (cached 1 hour).
  2. **Assessment Draft Preview (`POST /api/ai-coach/preview`):** Instant feedback, rubric breakdown, and predicted score/XP before final submission.
  3. **Automated Submission Review (`POST /api/ai-coach/review`):** Attached automatically on submit for mentor review.
* **Security & Fallback:** Anthropic API keys are strictly server-side. Missing key gracefully falls back to contract mock (`source: 'mock'`) without 500 errors.

### 5.11 Notifications (Computed on Read)
* **Categories:** `overdue`, `due_soon`, `xp_awarded`, `review_ready`, `challenge`, `nudge`.
* **Actions:** Popover list, Unread badge, Mark as read (`POST /api/notifications/read`).

---

## 6. FRONTEND COMPONENT ARCHITECTURE

```text
src/
├── app/
│   ├── (student)/
│   │   ├── layout.tsx                    # Student AppShell, auth boundary, global navbar
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Server component orchestrator (fetches dashboard data)
│   │   │   └── dashboard-client.tsx      # Client interactivity, optimistic toasts
│   │   ├── tasks/page.tsx                # Full tasks page
│   │   ├── study-plan/page.tsx           # Full study plan page
│   │   ├── achievements/page.tsx         # Full badge & certificate catalog
│   │   └── leaderboard/page.tsx          # Full cohort leaderboard
├── components/
│   ├── app/
│   │   ├── app-shell.tsx                 # AppShell layout container
│   │   ├── navbar.tsx                    # Persistent navigation header
│   │   ├── global-search.tsx             # Debounced typeahead search dialog
│   │   ├── streak-badge.tsx              # Navbar streak indicator + popover
│   │   ├── xp-badge.tsx                  # Navbar XP & level badge + popover
│   │   ├── notification-bell.tsx         # Notification popover dropdown
│   │   └── user-menu.tsx                 # Profile avatar dropdown
│   ├── dashboard/
│   │   ├── hero-banner.tsx               # Greeting, Level status, Check-In CTA
│   │   ├── continue-learning-card.tsx    # Resume active course + next lesson
│   │   ├── tasks-widget.tsx              # Priority to-do list (Overdue/Due Soon)
│   │   ├── progress-overview-card.tsx    # Completion rate and breakdown stats
│   │   ├── study-plan-widget.tsx         # Roadmap preview (Required/Recommended/Optional)
│   │   ├── mentor-card.tsx               # Assigned mentor and next session
│   │   ├── leaderboard-peek.tsx          # Top 3 + sticky user rank
│   │   └── achievement-preview.tsx       # 12 badge progress grid
│   ├── ai/
│   │   ├── coach-brief-card.tsx          # Weekly AI brief widget
│   │   ├── review-card.tsx               # AI review container
│   │   ├── predicted-score.tsx           # Score & suggested XP gauge
│   │   └── strengths-weaknesses.tsx      # Dual column feedback
│   └── game/
│       ├── check-in-button.tsx           # 1-click check-in with micro-animation
│       ├── level-ring.tsx                # SVG circular level progress ring
│       ├── streak-flame.tsx              # Dynamic animated flame asset
│       ├── badge-card.tsx                # Badge item (earned / locked)
│       └── xp-toast.tsx                  # Floating XP reward toast
```

---

## 7. UI STATES MATRIX (LOADING, EMPTY, ERROR)

```
┌─────────────────────────┬──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ WIDGET                  │ LOADING STATE                │ EMPTY STATE                  │ ERROR STATE                  │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Global Search           │ Shimmer search results list  │ "No learning items found"    │ "Search temporarily down"    │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Daily Check-In          │ Pulse shimmer on button      │ N/A (Shows check-in state)   │ Fallback disabled button     │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Level & XP Progression  │ Skeleton circular ring       │ Level 1 Explorer (0 XP)      │ Shows cached XP + alert icon │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Continue Learning       │ Card skeleton with bar       │ "No active courses. Explore  │ "Unable to load course.      │
│                         │                              │  the Catalog ➔"              │  [Retry]"                    │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Assigned Tasks / To-Do  │ 3 stacked card skeletons     │ "You're all caught up! 🎉"   │ "Failed to load tasks.       │
│                         │                              │                              │  [Retry]"                    │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ AI Coach Brief          │ 4-line text shimmer block    │ "Complete your first lesson  │ "AI Coach unavailable.       │
│                         │                              │  to generate your AI brief"  │  Check back later."          │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Study Plan              │ Timeline row skeletons       │ "No study plan assigned yet" │ "Unable to load roadmap"     │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Badges & Achievements   │ 6 circular icon skeletons    │ 12 grey locked silhouettes   │ "Failed to load badges"      │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Leaderboard Peek        │ 3 row table skeletons        │ "Be the first on the board!  │ "Leaderboard unavailable"    │
│                         │                              │  Complete a lesson to rank"  │                              │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Mentor Card             │ Avatar + text skeleton       │ "No mentor assigned yet.     │ "Unable to reach mentor      │
│                         │                              │  Assignments open soon!"     │  service"                    │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Notifications Dropdown  │ Shimmer list items           │ "You have no notifications"  │ "Failed to load alerts"      │
└─────────────────────────┴──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 8. DATABASE SCHEMAS & DATA MODELS

Targeting **PostgreSQL (Neon)** via **Drizzle ORM**.

```
                               ┌───────────────────┐
                               │       users       │
                               └─────────┬─────────┘
                                         │ 1
                 ┌───────────────────────┼────────────────────────┐
               n │                     n │                      n │
        ┌────────┴────────┐    ┌─────────┴─────────┐    ┌─────────┴─────────┐
        │   enrollments   │    │     xp_events     │    │  daily_checkins   │
        └────────┬────────┘    └───────────────────┘    └───────────────────┘
                 │ 1
                 │
                 ├────────────────────────┐
               n │                      n │
        ┌────────┴────────┐      ┌────────┴────────┐
        │ lesson_progress │      │   submissions   │
        └─────────────────┘      └────────┬────────┘
                                          │ 1
                                          │
                                        1 │
                                 ┌────────┴────────┐
                                 │   ai_reviews    │
                                 └─────────────────┘
```

### Table Definitions

#### 1. `users` (`src/db/schema/auth.ts`)
* `id` (text PK), `name` (text), `email` (text unique), `image` (text null), `systemRole` (text default `'student'`), `cohortYear` (text), `campus` (text), `phone` (text), `city` (text), `onboardingComplete` (boolean default false), `createdAt`, `updatedAt`.

#### 2. `courses` (`src/db/schema/courses.ts`)
* `id` (text PK), `slug` (text unique), `title` (text), `subtitle` (text), `description` (text), `coverEmoji` (text default `'📘'`), `category` (text), `track` (text: `'mandatory' | 'optional'`), `difficulty` (text), `certificateEligible` (boolean), `estimatedHours` (integer), `xpBonusOnComplete` (integer default 100), `dueAt` (timestamptz null), `status` (text: `'draft' | 'published' | 'archived'`), `mentorId` (text references users.id), `createdAt`, `updatedAt`.

#### 3. `course_sections`, `lessons`, `assessments` (`src/db/schema/courses.ts`)
* `course_sections`: `id` (text PK), `courseId` (references courses), `title`, `summary`, `orderIndex`, `xpAward` (default 50), `createdAt`.
* `lessons`: `id` (text PK), `sectionId` (references course_sections), `title`, `kind` (`'video' | 'reading' | 'link'`), `contentUrl`, `contentBody`, `durationMin`, `orderIndex`, `xpAward` (default 10), `createdAt`.
* `assessments`: `id` (text PK), `courseId` (references courses), `sectionId` (nullable references course_sections), `title`, `prompt`, `rubric`, `kind` (`'assignment' | 'quiz' | 'project' | 'reflection'`), `maxScore` (default 100), `xpAward` (default 150), `dueAt` (timestamptz null), `orderIndex`, `createdAt`.

#### 4. `enrollments`, `lesson_progress`, `submissions`, `ai_reviews` (`src/db/schema/learning.ts`)
* `enrollments`: `id` (text PK), `courseId`, `studentId`, `status` (`'active' | 'completed' | 'dropped'`), `progressPct` (integer default 0), `xpEarned` (integer default 0), `enrolledAt`, `completedAt`. `unique(courseId, studentId)`.
* `lesson_progress`: `id` (text PK), `enrollmentId`, `lessonId`, `completedAt`. `unique(enrollmentId, lessonId)`.
* `submissions`: `id` (text PK), `assessmentId`, `studentId`, `enrollmentId`, `content`, `attachmentUrl`, `status` (`'draft' | 'submitted' | 'ai_reviewed' | 'mentor_approved' | 'changes_requested'`), `aiScore`, `aiXpSuggested`, `finalScore`, `finalXp`, `mentorId`, `mentorNote`, `submittedAt`, `reviewedAt`.
* `ai_reviews`: `id` (text PK), `submissionId`, `model` (`'claude-opus-5'`), `summary`, `strengths` (jsonb), `weaknesses` (jsonb), `actionItems` (jsonb), `rubricBreakdown` (jsonb), `suggestedScore`, `suggestedXp`, `confidence`, `isPreview`, `latencyMs`, `tokensIn`, `tokensOut`, `createdAt`.

#### 5. `xp_events`, `streaks`, `daily_checkins`, `badges`, `user_badges` (`src/db/schema/engagement.ts`)
* `xp_events`: `id` (text PK), `userId`, `amount` (integer), `reason` (text), `sourceType` (text), `sourceId` (text), `courseId` (text null), `awardedBy` (text null), `note` (text), `idempotencyKey` (text unique not null), `createdAt` (timestamptz).
* `streaks`: `userId` (text PK), `current` (integer default 0), `longest` (integer default 0), `freezesLeft` (integer default 2), `lastCheckinDate` (date null).
* `daily_checkins`: `id` (text PK), `userId`, `checkinDate` (date), `streakAfter` (integer), `xpAwarded` (integer), `createdAt`. `unique(userId, checkinDate)`.
* `badges`: `id` (text PK), `name`, `description`, `emoji`, `criteria`, `xpReward` (default 25), `rarity`, `sortIndex`.
* `user_badges`: `id` (text PK), `userId`, `badgeId`, `earnedAt`. `unique(userId, badgeId)`.

#### 6. `notifications` (`src/db/schema/social.ts`)
* `id` (text PK), `userId`, `kind` (`'due_soon' | 'overdue' | 'xp_awarded' | 'review_ready' | 'challenge' | 'nudge'`), `title`, `body`, `href`, `readAt`, `createdAt`.

---

## 9. API CONTRACTS & ROUTE SPECIFICATIONS

### 9.1 Composite Dashboard API (`GET /api/user/dashboard`)
* **Method:** `GET`
* **Path:** `/api/user/dashboard`
* **Auth:** `user`
* **Summary:** Aggregates full command center state in a single round trip to eliminate client waterfall requests.

```json
{
  "ok": true,
  "source": "live",
  "data": {
    "user": {
      "id": "usr-me",
      "name": "Priya Nair",
      "email": "priya@katalyst.test",
      "image": null,
      "cohortYear": "2026",
      "campus": "Pune",
      "systemRole": "student"
    },
    "xp": {
      "totalXp": 2450,
      "yearXp": 2450,
      "monthXp": 680,
      "level": 5,
      "levelName": "Catalyst",
      "xpIntoLevel": 850,
      "xpToNextLevel": 550,
      "nextLevelAt": 3000,
      "rank": 4
    },
    "streak": {
      "current": 12,
      "longest": 15,
      "freezesLeft": 2,
      "checkedInToday": true,
      "lastCheckinDate": "2026-08-21",
      "last14": [true, true, true, true, false, true, true, true, true, true, true, true, true, true]
    },
    "progress": {
      "overallCompletionPct": 72,
      "enrolledCoursesCount": 3,
      "completedCoursesCount": 1,
      "completedLessonsCount": 28,
      "totalLessonsCount": 42,
      "pendingSubmissionsCount": 1
    },
    "continueWith": {
      "enrollmentId": "enr-1",
      "courseId": "course-1",
      "slug": "data-foundations",
      "title": "Data Foundations",
      "coverEmoji": "📘",
      "track": "optional",
      "progressPct": 68,
      "nextLesson": {
        "id": "les-8",
        "title": "Data Modeling Techniques",
        "sectionTitle": "Relational Architecture"
      }
    },
    "tasks": [
      {
        "id": "task-101",
        "title": "Build REST API Assessment",
        "type": "assignment",
        "courseTitle": "Data Foundations",
        "dueAt": "2026-08-19T18:30:00.000Z",
        "priority": "high",
        "status": "overdue",
        "xpReward": 150,
        "href": "/learn/data-foundations/assessments/task-101"
      },
      {
        "id": "task-102",
        "title": "Ethics & Governance Reflection",
        "type": "assessment",
        "courseTitle": "Business Communication",
        "dueAt": "2026-08-23T18:30:00.000Z",
        "priority": "medium",
        "status": "due_soon",
        "xpReward": 100,
        "href": "/learn/business-communication/assessments/task-102"
      }
    ],
    "coachBrief": {
      "headline": "Great momentum on Data Foundations! Solid evidence cited.",
      "strengths": ["Consistent citations in submissions", "12-day streak"],
      "focusAreas": ["Connect analysis to business recommendations"],
      "nextActions": [
        { "label": "Finish Lesson 8", "href": "/learn/data-foundations/lessons/les-8" }
      ],
      "nudge": "550 XP to Level 6!"
    },
    "mentor": {
      "id": "men-1",
      "name": "Dr. Rajesh Sharma",
      "image": null,
      "expertise": "Lead Architect & Data Strategist",
      "nextSession": "2026-08-25T11:30:00.000Z",
      "recentFeedback": "Excellent depth on your data normalization schema."
    },
    "badgesSummary": {
      "unlockedCount": 6,
      "totalCount": 12,
      "recent": [
        { "id": "week-warrior", "name": "Week Warrior", "emoji": "🔥", "rarity": "rare" },
        { "id": "first-submission", "name": "First Submission", "emoji": "📝", "rarity": "common" }
      ]
    },
    "leaderboardPeek": {
      "myRank": 4,
      "myXp": 680,
      "top3": [
        { "rank": 1, "name": "Arjun Mehta", "xp": 1150 },
        { "rank": 2, "name": "Sana Qureshi", "xp": 980 },
        { "rank": 3, "name": "Rahul Verma", "xp": 820 }
      ]
    },
    "unreadNotificationsCount": 3
  }
}
```

### 9.2 Specialized Endpoints

| Op | Method | Path | Auth | Input | Output Summary |
|---|---|---|---|---|---|
| `summary` | GET | `/api/xp/summary` | user | `{}` | Total, yearly, monthly XP, level math, breakdown |
| `checkIn` | POST | `/api/gamification/checkin` | user | `{}` | Updated streak, 10 XP award, `alreadyCheckedIn` |
| `streak` | GET | `/api/gamification/streak` | user | `{}` | Current/longest streak, freezes, last 14 days |
| `tasks` | GET | `/api/user/tasks` | user | `?status=&limit=` | Prioritized task list (overdue, due soon, upcoming) |
| `studyPlan` | GET | `/api/user/study-plan` | user | `{}` | Required, recommended, optional roadmap items |
| `badges` | GET | `/api/gamification/badges` | user | `{}` | All 12 badges with live progress and unlock status |
| `leaderboard` | GET | `/api/xp/leaderboard` | user | `?scope=month\|all` | Top 20 ranking + sticky `me` row |
| `brief` | GET | `/api/ai-coach/brief` | user | `{}` | Cached 1-hour personalized AI summary |
| `search` | GET | `/api/search` | user | `?q=&type=` | Debounced search across courses, tasks, sessions |
| `notifications` | GET | `/api/notifications` | user | `{}` | Unread alerts list |
| `markRead` | POST | `/api/notifications/read` | user | `{ id }` | Updates notification `readAt` timestamp |

---

## 10. RESPONSIVE DESIGN & MOBILE LAYOUT RULES

* **Desktop ($\ge 1280\text{px}$):**
  * 2-column layout (Primary: 65%, Secondary: 35%).
  * Full navbar: Brand, Links, Search Input, Streak badge, XP badge, Notifications, Profile.
* **Tablet ($768\text{px} - 1279\text{px}$):**
  * Single-column vertical stack with optimized card order.
  * Search collapses into an icon button opening a search dialog.
* **Mobile ($< 768\text{px}$):**
  * Top navigation collapses into a compact top bar: `[Drawer Toggle] [Logo] | 🔥 12  ⭐ 2,450 XP  🔔  [Avatar]`.
  * Navigation links move into a slide-over `Sheet`.
  * Cards span 100% viewport width with touch targets $\ge 44\text{px} \times 44\text{px}$.

---

## 11. HACKATHON MVP PRIORITY MATRIX

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ P0 — MUST HAVE (Gate A & Gate B Target)                                               │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ • Better Auth session verification and role boundary enforcement                      │
│ • Persistent Global Navbar with real-time Streak (🔥) & XP (⭐) metrics              │
│ • Authoritative XP Engine with idempotent ledger (`awardXp`)                          │
│ • 1-Click Daily Check-in & Streak roll-forward algorithm (IST Timezone)               │
│ • Composite Dashboard Aggregation API (`GET /api/user/dashboard`)                     │
│ • Continue Learning Card with next lesson deep link                                   │
│ • Priority Tasks Engine (Overdue, Due Soon, Upcoming)                                 │
│ • AI Coach Submission Review Round-trip (Submit → AI Review → Mentor Decision)       │
│ • Basic Badges Display (12 badges with grey silhouettes for locked)                  │
│ • Cohort Leaderboard (Monthly default + sticky "Me" row)                              │
└───────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────┐
│ P1 — IMPORTANT (Gate C Target)                                                        │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ • AI Coach Dashboard Weekly Brief (`/api/ai-coach/brief`)                             │
│ • Global Unified Search across courses, tasks, and mentoring                          │
│ • Assigned Mentor Card with next session schedule & feedback history                  │
│ • In-App Notification Center (Computed on read with unread badge counter)             │
│ • Study Plan Weekly Goals & Roadmap View                                              │
│ • Gamification Micro-interactions (Confetti on level up, flame animations)            │
└───────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────┐
│ P2 — GOOD TO HAVE (Post-Freeze Buffer)                                                │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ • Staff Course Authoring Copilot via AI                                               │
│ • Interactive AI Coach Chat Assistant                                                 │
│ • Team-based Cohort Competitions                                                      │
│ • Downloadable PDF Skill Certificates                                                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. DEVELOPER IMPLEMENTATION CHECKLIST

- [ ] **Navbar & AppShell:**
  - [ ] Implement `src/components/app/navbar.tsx` with responsive drawer toggle.
  - [ ] Implement `src/components/app/streak-badge.tsx` (real-time streak + hover popover).
  - [ ] Implement `src/components/app/xp-badge.tsx` (level title + progress popover).
  - [ ] Implement `src/components/app/global-search.tsx` (300ms debouncing, `Cmd+K` listener).
  - [ ] Implement `src/components/app/notification-bell.tsx` (unread count badge + popover).
  - [ ] Implement `src/components/app/user-menu.tsx` (avatar, profile routing, sign out).
- [ ] **Student Dashboard Homepage & Widgets:**
  - [ ] Build `src/app/(student)/dashboard/page.tsx` server component fetching composite data.
  - [ ] Build `HeroBanner` with greeting, level title, and check-in button CTA.
  - [ ] Build `ContinueLearningCard` with cover emoji, progress bar, and next lesson deep link.
  - [ ] Build `TasksWidget` displaying Overdue (red), Due Soon (amber), and Upcoming tasks.
  - [ ] Build `CoachBriefCard` rendering AI-generated strengths, weaknesses, and next actions.
  - [ ] Build `ProgressOverviewCard` displaying overall completion percentage ring and breakdown.
  - [ ] Build `StudyPlanWidget` distinguishing Required, Recommended, and Optional tracks.
  - [ ] Build `AchievementPreview` displaying 12 badge progress grid.
  - [ ] Build `LeaderboardPeek` showing top 3 cohort leaders and sticky user rank.
  - [ ] Build `MentorCard` displaying assigned mentor, next 1:1 session, and recent notes.
- [ ] **Backend Engine & API Handlers:**
  - [ ] Implement `src/server/xp.ts` with `awardXp()` and strict `idempotencyKey` uniqueness.
  - [ ] Implement `src/server/gamification.ts` check-in logic enforcing IST date boundaries and 2 freeze shields.
  - [ ] Implement `src/lib/xp.ts` pure mathematical utilities (`levelFromXp`, `xpToNextLevel`, `applyTrack`).
  - [ ] Implement `src/server/ai-coach.ts` for structured reviews via Claude Opus 5 with fallback mock.
  - [ ] Implement `checkBadges(userId)` evaluated automatically after every XP transaction.
  - [ ] Register and implement composite endpoint `GET /api/user/dashboard`.
  - [ ] Register and implement all modular endpoints in `src/contracts/`.
- [ ] **Security, QA & Verification:**
  - [ ] Verify zero-enrolment empty state on a freshly signed-up account (no walls of zeroes).
  - [ ] Verify responsive layout across 375px (mobile), 768px (tablet), and 1366px (desktop).
  - [ ] Verify double-clicking check-in or lesson completion never awards duplicate XP.
  - [ ] Verify `npm run typecheck` and `npm run build` pass cleanly with zero errors.
