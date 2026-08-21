import { z } from 'zod'
import { defineContract } from './_kit'

// ============================================================================
// Enums & Shared Schemas
// ============================================================================

export const SystemRole = z.enum(['student', 'mentor', 'admin'])
export type SystemRole = z.infer<typeof SystemRole>

export const StudentFlag = z.enum(['overdue', 'inactive', 'stalled', 'awaiting_resubmit'])
export type StudentFlag = z.infer<typeof StudentFlag>

export const CourseCategory = z.enum([
  'technical',
  'business',
  'communication',
  'leadership',
  'wellbeing',
])
export type CourseCategory = z.infer<typeof CourseCategory>

export const CourseTrack = z.enum(['mandatory', 'optional'])
export type CourseTrack = z.infer<typeof CourseTrack>

export const CourseDifficulty = z.enum(['beginner', 'intermediate', 'advanced'])
export type CourseDifficulty = z.infer<typeof CourseDifficulty>

export const CourseStatus = z.enum(['draft', 'published', 'archived'])
export type CourseStatus = z.infer<typeof CourseStatus>

export const EnrollmentStatus = z.enum(['active', 'completed', 'dropped'])
export type EnrollmentStatus = z.infer<typeof EnrollmentStatus>

export const SubmissionStatus = z.enum([
  'draft',
  'submitted',
  'ai_reviewed',
  'mentor_approved',
  'changes_requested',
])
export type SubmissionStatus = z.infer<typeof SubmissionStatus>

export const TaskStatus = z.enum(['active', 'inactive'])
export type TaskStatus = z.infer<typeof TaskStatus>

export const EvaluationCriterion = z.object({
  name: z.string().min(1),
  description: z.string(),
  weight: z.number().int().min(1).max(100),
})
export type EvaluationCriterion = z.infer<typeof EvaluationCriterion>

// ============================================================================
// 1. Admin Reports & Metrics
// ============================================================================

export const AdminReportRow = z.object({
  studentId: z.string(),
  studentName: z.string(),
  cohortYear: z.string(),
  campus: z.string(),
  courseTitle: z.string(),
  track: CourseTrack,
  status: EnrollmentStatus,
  progressPct: z.number().int().min(0).max(100),
  xpEarned: z.number().int(),
  enrolledAt: z.string(),
  completedAt: z.string().nullable(),
  lastActiveAt: z.string().nullable(),
})
export type AdminReportRow = z.infer<typeof AdminReportRow>

export const AdminReportTotals = z.object({
  students: z.number().int(),
  enrollments: z.number().int(),
  completed: z.number().int(),
  completionRate: z.number().int().min(0).max(100),
  totalXp: z.number().int(),
  avgXp: z.number().int(),
  activeThisMonth: z.number().int(),
  engagementRate: z.number().int().min(0).max(100),
})
export type AdminReportTotals = z.infer<typeof AdminReportTotals>

export const getReport = defineContract({
  method: 'GET',
  path: '/api/admin/report',
  auth: 'admin',
  summary: 'Admin consolidated cohort and engagement report with totals',
  input: z.object({
    cohortYear: z.string().optional(),
    courseId: z.string().optional(),
    track: CourseTrack.optional(),
    category: z.string().optional(),
    status: EnrollmentStatus.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
  }),
  output: z.object({
    rows: z.array(AdminReportRow),
    totals: AdminReportTotals,
  }),
  mock: () => ({
    rows: [
      {
        studentId: 'user-1',
        studentName: 'Aarav Patel',
        cohortYear: '2026',
        campus: 'Mumbai',
        courseTitle: 'Data Foundations & SQL Mastery',
        track: 'mandatory' as const,
        status: 'active' as const,
        progressPct: 75,
        xpEarned: 350,
        enrolledAt: '2026-01-10T08:00:00.000Z',
        completedAt: null,
        lastActiveAt: '2026-08-20T14:30:00.000Z',
      },
      {
        studentId: 'user-2',
        studentName: 'Diya Sharma',
        cohortYear: '2026',
        campus: 'Bengaluru',
        courseTitle: 'Frontend Engineering with Next.js',
        track: 'optional' as const,
        status: 'completed' as const,
        progressPct: 100,
        xpEarned: 600,
        enrolledAt: '2026-01-15T09:00:00.000Z',
        completedAt: '2026-02-10T16:00:00.000Z',
        lastActiveAt: '2026-08-19T11:20:00.000Z',
      },
      {
        studentId: 'user-3',
        studentName: 'Rohan Gupta',
        cohortYear: '2025',
        campus: 'Pune',
        courseTitle: 'Business Communication & Presentation',
        track: 'mandatory' as const,
        status: 'active' as const,
        progressPct: 40,
        xpEarned: 180,
        enrolledAt: '2026-02-01T10:00:00.000Z',
        completedAt: null,
        lastActiveAt: '2026-08-12T09:15:00.000Z',
      },
    ],
    totals: {
      students: 45,
      enrollments: 120,
      completed: 84,
      completionRate: 70,
      totalXp: 42500,
      avgXp: 944,
      activeThisMonth: 38,
      engagementRate: 84,
    },
  }),
})

// ============================================================================
// 2. User & Role Management
// ============================================================================

export const AdminUserRow = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  systemRole: SystemRole,
  cohortYear: z.string(),
  campus: z.string(),
  createdAt: z.string(),
})
export type AdminUserRow = z.infer<typeof AdminUserRow>

export const listUsers = defineContract({
  method: 'GET',
  path: '/api/admin/users',
  auth: 'admin',
  summary: 'List all users with role and profile filtering',
  input: z.object({
    role: SystemRole.optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    users: z.array(AdminUserRow),
  }),
  mock: () => ({
    users: [
      {
        id: 'user-admin-1',
        name: 'Admin Katalyst',
        email: 'admin@katalyst.test',
        image: null,
        systemRole: 'admin' as const,
        cohortYear: '2025',
        campus: 'Mumbai',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'user-mentor-1',
        name: 'Siddesh Mentor',
        email: 'mentor@katalyst.test',
        image: null,
        systemRole: 'mentor' as const,
        cohortYear: '2025',
        campus: 'Pune',
        createdAt: '2026-01-05T00:00:00.000Z',
      },
      {
        id: 'user-student-1',
        name: 'Aarav Patel',
        email: 'student1@katalyst.test',
        image: null,
        systemRole: 'student' as const,
        cohortYear: '2026',
        campus: 'Mumbai',
        createdAt: '2026-01-10T00:00:00.000Z',
      },
    ],
  }),
})

export const setRole = defineContract({
  method: 'POST',
  path: '/api/admin/users/:id/role',
  auth: 'admin',
  summary: 'Change a user system role (e.g. promote to mentor)',
  input: z.object({
    id: z.string(),
    role: SystemRole,
  }),
  output: z.object({
    user: AdminUserRow,
  }),
  mock: ({ id, role }) => ({
    user: {
      id,
      name: 'Promoted User',
      email: 'user@katalyst.test',
      image: null,
      systemRole: role,
      cohortYear: '2026',
      campus: 'Mumbai',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  }),
})

// ============================================================================
// 3. Admin Student Roster & Performance
// ============================================================================

export const AdminStudentRow = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  cohortYear: z.string(),
  campus: z.string(),
  totalXp: z.number().int(),
  level: z.number().int(),
  coursesEnrolled: z.number().int(),
  coursesCompleted: z.number().int(),
  avgProgressPct: z.number().int(),
  lastActiveAt: z.string().nullable(),
  pendingSubmissions: z.number().int(),
  flags: z.array(StudentFlag),
})
export type AdminStudentRow = z.infer<typeof AdminStudentRow>

export const listStudents = defineContract({
  method: 'GET',
  path: '/api/admin/students',
  auth: 'admin',
  summary: 'List all students with aggregates and intervention flags',
  input: z.object({
    cohortYear: z.string().optional(),
    campus: z.string().optional(),
    flag: StudentFlag.optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    students: z.array(AdminStudentRow),
  }),
  mock: () => ({
    students: [
      {
        userId: 'user-student-1',
        name: 'Aarav Patel',
        email: 'student1@katalyst.test',
        image: null,
        cohortYear: '2026',
        campus: 'Mumbai',
        totalXp: 850,
        level: 3,
        coursesEnrolled: 3,
        coursesCompleted: 1,
        avgProgressPct: 68,
        lastActiveAt: '2026-08-20T14:30:00.000Z',
        pendingSubmissions: 1,
        flags: [],
      },
      {
        userId: 'user-student-2',
        name: 'Diya Sharma',
        email: 'student2@katalyst.test',
        image: null,
        cohortYear: '2026',
        campus: 'Bengaluru',
        totalXp: 420,
        level: 2,
        coursesEnrolled: 2,
        coursesCompleted: 0,
        avgProgressPct: 20,
        lastActiveAt: '2026-08-05T10:00:00.000Z',
        pendingSubmissions: 0,
        flags: ['inactive' as const, 'stalled' as const],
      },
    ],
  }),
})

export const studentPerformance = defineContract({
  method: 'GET',
  path: '/api/admin/students/:userId/performance',
  auth: 'admin',
  summary: 'Detailed performance breakdown for a single student',
  input: z.object({
    userId: z.string(),
  }),
  output: z.object({
    student: AdminStudentRow,
    enrollments: z.array(
      z.object({
        courseId: z.string(),
        courseTitle: z.string(),
        track: CourseTrack,
        progressPct: z.number().int(),
        xpEarned: z.number().int(),
        status: EnrollmentStatus,
        enrolledAt: z.string(),
        completedAt: z.string().nullable(),
      }),
    ),
    submissions: z.array(
      z.object({
        id: z.string(),
        assessmentTitle: z.string(),
        courseTitle: z.string(),
        status: SubmissionStatus,
        maxScore: z.number().int(),
        score: z.number().int().nullable(),
        xpAwarded: z.number().int().nullable(),
        submittedAt: z.string(),
      }),
    ),
    evaluations: z.array(
      z.object({
        id: z.string(),
        assessmentTitle: z.string(),
        score: z.number().int(),
        xpAwarded: z.number().int(),
        feedback: z.string(),
        evaluatedAt: z.string(),
      }),
    ),
  }),
  mock: ({ userId }) => ({
    student: {
      userId,
      name: 'Aarav Patel',
      email: 'student1@katalyst.test',
      image: null,
      cohortYear: '2026',
      campus: 'Mumbai',
      totalXp: 850,
      level: 3,
      coursesEnrolled: 2,
      coursesCompleted: 1,
      avgProgressPct: 75,
      lastActiveAt: '2026-08-20T14:30:00.000Z',
      pendingSubmissions: 0,
      flags: [],
    },
    enrollments: [
      {
        courseId: 'course-1',
        courseTitle: 'Data Foundations & SQL Mastery',
        track: 'mandatory' as const,
        progressPct: 100,
        xpEarned: 500,
        status: 'completed' as const,
        enrolledAt: '2026-01-10T08:00:00.000Z',
        completedAt: '2026-02-15T10:00:00.000Z',
      },
      {
        courseId: 'course-2',
        courseTitle: 'Advanced React Architecture',
        track: 'optional' as const,
        progressPct: 50,
        xpEarned: 350,
        status: 'active' as const,
        enrolledAt: '2026-02-20T08:00:00.000Z',
        completedAt: null,
      },
    ],
    submissions: [
      {
        id: 'sub-1',
        assessmentTitle: 'Design Database Schema for E-Commerce',
        courseTitle: 'Data Foundations & SQL Mastery',
        status: 'mentor_approved' as const,
        maxScore: 100,
        score: 92,
        xpAwarded: 150,
        submittedAt: '2026-02-14T12:00:00.000Z',
      },
    ],
    evaluations: [
      {
        id: 'eval-1',
        assessmentTitle: 'Design Database Schema for E-Commerce',
        score: 92,
        xpAwarded: 150,
        feedback: 'Excellent normalization and indexing strategy. Minor improvement on foreign keys.',
        evaluatedAt: '2026-02-15T09:30:00.000Z',
      },
    ],
  }),
})

// ============================================================================
// 4. Admin Evaluations Monitoring
// ============================================================================

export const AdminEvaluationRow = z.object({
  submissionId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string(),
  courseTitle: z.string(),
  score: z.number().int().nullable(),
  xpAwarded: z.number().int().nullable(),
  status: SubmissionStatus,
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  evaluatedAt: z.string().nullable(),
})
export type AdminEvaluationRow = z.infer<typeof AdminEvaluationRow>

export const listEvaluations = defineContract({
  method: 'GET',
  path: '/api/admin/evaluations',
  auth: 'admin',
  summary: 'Monitor AI and mentor evaluations across all submissions',
  input: z.object({
    status: SubmissionStatus.optional(),
    courseId: z.string().optional(),
    studentId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    evaluations: z.array(AdminEvaluationRow),
  }),
  mock: () => ({
    evaluations: [
      {
        submissionId: 'sub-101',
        studentId: 'user-student-1',
        studentName: 'Aarav Patel',
        assessmentId: 'asm-1',
        assessmentTitle: 'Full-Stack Architecture Plan',
        courseTitle: 'Full-Stack Engineering',
        score: 95,
        xpAwarded: 150,
        status: 'mentor_approved' as const,
        feedback: 'Outstanding system design, clean separation of concerns.',
        submittedAt: '2026-08-18T10:00:00.000Z',
        evaluatedAt: '2026-08-18T11:15:00.000Z',
      },
      {
        submissionId: 'sub-102',
        studentId: 'user-student-2',
        studentName: 'Diya Sharma',
        assessmentId: 'asm-2',
        assessmentTitle: 'Async JavaScript & Event Loop',
        courseTitle: 'Frontend Engineering with Next.js',
        score: 82,
        xpAwarded: 120,
        status: 'ai_reviewed' as const,
        feedback: 'Good grasp of microtasks. Please expand on web workers.',
        submittedAt: '2026-08-19T14:20:00.000Z',
        evaluatedAt: '2026-08-19T14:21:00.000Z',
      },
    ],
  }),
})

// ============================================================================
// 5. Module & Task Management (Course / Task Authoring)
// ============================================================================

export const AdminModule = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: CourseDifficulty,
  durationMin: z.number().int(),
  category: z.string(),
  track: CourseTrack,
  status: CourseStatus,
  createdAt: z.string(),
})
export type AdminModule = z.infer<typeof AdminModule>

export const createModule = defineContract({
  method: 'POST',
  path: '/api/admin/modules',
  auth: 'admin',
  summary: 'Admin creates a new learning module/course',
  input: z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(2000).default(''),
    difficulty: CourseDifficulty.default('beginner'),
    durationMin: z.number().int().min(1).default(60),
    category: z.string().default('technical'),
    track: CourseTrack.default('mandatory'),
  }),
  output: z.object({
    module: AdminModule,
  }),
  mock: (input) => ({
    module: {
      id: 'module-new',
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      durationMin: input.durationMin,
      category: input.category,
      track: input.track,
      status: 'draft' as const,
      createdAt: '2026-08-21T10:00:00.000Z',
    },
  }),
})

export const listModules = defineContract({
  method: 'GET',
  path: '/api/admin/modules',
  auth: 'admin',
  summary: 'Admin lists all modules',
  input: z.object({
    status: CourseStatus.optional(),
    track: CourseTrack.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    modules: z.array(AdminModule),
  }),
  mock: () => ({
    modules: [
      {
        id: 'module-1',
        title: 'Data Structures & Algorithms',
        description: 'Core concepts in trees, graphs, and dynamic programming.',
        difficulty: 'intermediate' as const,
        durationMin: 180,
        category: 'technical',
        track: 'mandatory' as const,
        status: 'published' as const,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
      {
        id: 'module-2',
        title: 'Professional Communication',
        description: 'Email etiquette, presentations, and stakeholder management.',
        difficulty: 'beginner' as const,
        durationMin: 120,
        category: 'communication',
        track: 'optional' as const,
        status: 'published' as const,
        createdAt: '2026-01-15T00:00:00.000Z',
      },
    ],
  }),
})

export const getModule = defineContract({
  method: 'GET',
  path: '/api/admin/modules/:id',
  auth: 'admin',
  summary: 'Admin fetches single module details',
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    module: AdminModule,
  }),
  mock: ({ id }) => ({
    module: {
      id,
      title: 'Data Structures & Algorithms',
      description: 'Core concepts in trees, graphs, and dynamic programming.',
      difficulty: 'intermediate' as const,
      durationMin: 180,
      category: 'technical',
      track: 'mandatory' as const,
      status: 'published' as const,
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  }),
})

export const updateModule = defineContract({
  method: 'PUT',
  path: '/api/admin/modules/:id',
  auth: 'admin',
  summary: 'Admin updates a module',
  input: z.object({
    id: z.string(),
    title: z.string().min(3).max(120).optional(),
    description: z.string().max(2000).optional(),
    difficulty: CourseDifficulty.optional(),
    durationMin: z.number().int().min(1).optional(),
    category: z.string().optional(),
    track: CourseTrack.optional(),
    status: CourseStatus.optional(),
  }),
  output: z.object({
    module: AdminModule,
  }),
  mock: (input) => ({
    module: {
      id: input.id,
      title: input.title ?? 'Updated Module',
      description: input.description ?? '',
      difficulty: input.difficulty ?? ('intermediate' as const),
      durationMin: input.durationMin ?? 120,
      category: input.category ?? 'technical',
      track: input.track ?? ('mandatory' as const),
      status: input.status ?? ('published' as const),
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  }),
})

export const AdminTask = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  description: z.string(),
  xp: z.number().int().min(0),
  maxMarks: z.number().int().min(1),
  evaluationCriteria: z.array(EvaluationCriterion),
  taskData: z.record(z.string(), z.unknown()).optional(),
  status: TaskStatus,
  createdAt: z.string(),
})
export type AdminTask = z.infer<typeof AdminTask>

export const createTask = defineContract({
  method: 'POST',
  path: '/api/admin/modules/:id/tasks',
  auth: 'admin',
  summary: 'Admin creates a task with evaluation criteria and XP',
  input: z.object({
    id: z.string(),
    title: z.string().min(3).max(150),
    description: z.string().min(5),
    xp: z.number().int().min(1).max(500).default(50),
    maxMarks: z.number().int().min(1).max(1000).default(100),
    evaluationCriteria: z.array(EvaluationCriterion).min(1),
    taskData: z.record(z.string(), z.unknown()).optional(),
  }),
  output: z.object({
    task: AdminTask,
  }),
  mock: (input) => ({
    task: {
      id: 'task-new',
      moduleId: input.id,
      title: input.title,
      description: input.description,
      xp: input.xp,
      maxMarks: input.maxMarks,
      evaluationCriteria: input.evaluationCriteria,
      taskData: input.taskData,
      status: 'active' as const,
      createdAt: '2026-08-21T10:30:00.000Z',
    },
  }),
})

export const listTasks = defineContract({
  method: 'GET',
  path: '/api/admin/modules/:id/tasks',
  auth: 'admin',
  summary: 'Admin lists all tasks for a module',
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    tasks: z.array(AdminTask),
  }),
  mock: ({ id }) => ({
    tasks: [
      {
        id: 'task-1',
        moduleId: id,
        title: 'Explain ACID Properties with Practical Transactions',
        description: 'Explain Atomicity, Consistency, Isolation, and Durability with code snippets.',
        xp: 50,
        maxMarks: 100,
        evaluationCriteria: [
          { name: 'Understanding', description: 'Accurate explanation of 4 properties', weight: 40 },
          { name: 'Examples', description: 'Realistic SQL transaction examples', weight: 30 },
          { name: 'Clarity', description: 'Clear structured response', weight: 30 },
        ],
        taskData: { topic: 'DBMS', difficulty: 'medium' },
        status: 'active' as const,
        createdAt: '2026-01-12T00:00:00.000Z',
      },
    ],
  }),
})

export const getTask = defineContract({
  method: 'GET',
  path: '/api/admin/tasks/:taskId',
  auth: 'admin',
  summary: 'Get full task details including evaluation criteria',
  input: z.object({
    taskId: z.string(),
  }),
  output: z.object({
    task: AdminTask,
  }),
  mock: ({ taskId }) => ({
    task: {
      id: taskId,
      moduleId: 'module-1',
      title: 'Explain ACID Properties with Practical Transactions',
      description: 'Explain Atomicity, Consistency, Isolation, and Durability with code snippets.',
      xp: 50,
      maxMarks: 100,
      evaluationCriteria: [
        { name: 'Understanding', description: 'Accurate explanation of 4 properties', weight: 40 },
        { name: 'Examples', description: 'Realistic SQL transaction examples', weight: 30 },
        { name: 'Clarity', description: 'Clear structured response', weight: 30 },
      ],
      taskData: { topic: 'DBMS', difficulty: 'medium' },
      status: 'active' as const,
      createdAt: '2026-01-12T00:00:00.000Z',
    },
  }),
})

export const updateTask = defineContract({
  method: 'PUT',
  path: '/api/admin/tasks/:taskId',
  auth: 'admin',
  summary: 'Admin updates task configuration',
  input: z.object({
    taskId: z.string(),
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(5).optional(),
    xp: z.number().int().min(1).max(500).optional(),
    maxMarks: z.number().int().min(1).max(1000).optional(),
    evaluationCriteria: z.array(EvaluationCriterion).optional(),
    taskData: z.record(z.string(), z.unknown()).optional(),
  }),
  output: z.object({
    task: AdminTask,
  }),
  mock: (input) => ({
    task: {
      id: input.taskId,
      moduleId: 'module-1',
      title: input.title ?? 'Updated Task',
      description: input.description ?? 'Updated description',
      xp: input.xp ?? 50,
      maxMarks: input.maxMarks ?? 100,
      evaluationCriteria: input.evaluationCriteria ?? [
        { name: 'Quality', description: 'Overall quality', weight: 100 },
      ],
      taskData: input.taskData,
      status: 'active' as const,
      createdAt: '2026-01-12T00:00:00.000Z',
    },
  }),
})

export const setTaskStatus = defineContract({
  method: 'PATCH',
  path: '/api/admin/tasks/:taskId/status',
  auth: 'admin',
  summary: 'Admin activates or deactivates a task without deleting historical records',
  input: z.object({
    taskId: z.string(),
    status: TaskStatus,
  }),
  output: z.object({
    task: AdminTask,
  }),
  mock: ({ taskId, status }) => ({
    task: {
      id: taskId,
      moduleId: 'module-1',
      title: 'Explain ACID Properties with Practical Transactions',
      description: 'Explain Atomicity, Consistency, Isolation, and Durability with code snippets.',
      xp: 50,
      maxMarks: 100,
      evaluationCriteria: [
        { name: 'Understanding', description: 'Accurate explanation of 4 properties', weight: 40 },
        { name: 'Examples', description: 'Realistic SQL transaction examples', weight: 30 },
        { name: 'Clarity', description: 'Clear structured response', weight: 30 },
      ],
      taskData: { topic: 'DBMS', difficulty: 'medium' },
      status,
      createdAt: '2026-01-12T00:00:00.000Z',
    },
  }),
})

// ============================================================================
// 7. Course Authoring & Management (Direct Table Integration)
// ============================================================================

export const AdminCourse = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  coverEmoji: z.string(),
  category: CourseCategory,
  track: CourseTrack,
  difficulty: CourseDifficulty,
  certificateEligible: z.boolean(),
  estimatedHours: z.number().int(),
  xpBonusOnComplete: z.number().int(),
  dueAt: z.string().nullable(),
  status: CourseStatus,
  mentorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AdminCourse = z.infer<typeof AdminCourse>

export const createCourse = defineContract({
  method: 'POST',
  path: '/api/admin/courses',
  auth: 'admin',
  summary: 'Admin creates a new course in the courses table',
  input: z.object({
    id: z.string().optional(),
    slug: z.string().min(2).max(120),
    title: z.string().min(3).max(200),
    subtitle: z.string().default(''),
    description: z.string().default(''),
    coverEmoji: z.string().default('📘'),
    category: CourseCategory,
    track: CourseTrack.default('mandatory'),
    difficulty: CourseDifficulty.default('beginner'),
    certificateEligible: z.boolean().default(false),
    estimatedHours: z.number().int().min(0).default(0),
    xpBonusOnComplete: z.number().int().min(0).default(100),
    dueAt: z.string().nullable().optional(),
    status: CourseStatus.default('draft'),
    mentorId: z.string(),
  }),
  output: z.object({
    course: AdminCourse,
  }),
  mock: (input) => ({
    course: {
      id: input.id ?? `course-${Date.now()}`,
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle ?? '',
      description: input.description ?? '',
      coverEmoji: input.coverEmoji ?? '📘',
      category: input.category,
      track: input.track ?? 'mandatory',
      difficulty: input.difficulty ?? 'beginner',
      certificateEligible: input.certificateEligible ?? false,
      estimatedHours: input.estimatedHours ?? 0,
      xpBonusOnComplete: input.xpBonusOnComplete ?? 100,
      dueAt: input.dueAt ?? null,
      status: input.status ?? 'draft',
      mentorId: input.mentorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
})

export const listCourses = defineContract({
  method: 'GET',
  path: '/api/admin/courses',
  auth: 'admin',
  summary: 'Admin lists all courses in the courses table',
  input: z.object({
    status: CourseStatus.optional(),
    track: CourseTrack.optional(),
    category: CourseCategory.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    courses: z.array(AdminCourse),
  }),
  mock: () => ({
    courses: [
      {
        id: 'course-1',
        slug: 'data-foundations',
        title: 'Data Foundations & SQL Mastery',
        subtitle: 'Learn relational data modeling and SQL',
        description: 'Comprehensive SQL course from scratch to advanced queries.',
        coverEmoji: '📊',
        category: 'technical' as const,
        track: 'mandatory' as const,
        difficulty: 'beginner' as const,
        certificateEligible: true,
        estimatedHours: 12,
        xpBonusOnComplete: 100,
        dueAt: '2026-09-01T00:00:00.000Z',
        status: 'published' as const,
        mentorId: 'user-mentor-1',
        createdAt: '2026-01-10T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
      },
    ],
  }),
})

// ============================================================================
// 8. Module Content Management (Task, YouTube Video, Cloud Video)
// ============================================================================

export const ContentType = z.enum(['VIDEO', 'TASK'])
export type ContentType = z.infer<typeof ContentType>

export const VideoSource = z.enum(['YOUTUBE', 'CLOUD'])
export type VideoSource = z.infer<typeof VideoSource>

export const ContentStatus = z.enum(['ACTIVE', 'INACTIVE'])
export type ContentStatus = z.infer<typeof ContentStatus>

export const AdminContentItem = z.object({
  id: z.string(),
  moduleId: z.string(),
  type: ContentType,
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
  status: ContentStatus,
  createdAt: z.string(),
  // For VIDEO
  source: VideoSource.optional(),
  url: z.string().optional(),
  videoId: z.string().optional(),
  durationMin: z.number().int().optional(),
  // For TASK
  xp: z.number().int().optional(),
  maxMarks: z.number().int().optional(),
  evaluationCriteria: z.array(EvaluationCriterion).optional(),
  taskData: z.record(z.string(), z.unknown()).optional(),
})
export type AdminContentItem = z.infer<typeof AdminContentItem>

export const createContent = defineContract({
  method: 'POST',
  path: '/api/admin/modules/:id/content',
  auth: 'admin',
  summary: 'Admin adds content (Video: YouTube/Cloud, or Task) to a module',
  input: z.object({
    id: z.string(),
    type: ContentType,
    title: z.string().min(1).max(200),
    description: z.string().default(''),
    order: z.number().int().min(0).optional(),
    // Video specific
    source: VideoSource.optional(),
    url: z.string().optional(),
    durationMin: z.number().int().min(1).default(5).optional(),
    // Task specific
    xp: z.number().int().min(1).max(1000).default(50).optional(),
    maxMarks: z.number().int().min(1).max(1000).default(100).optional(),
    evaluationCriteria: z.array(EvaluationCriterion).optional(),
    taskData: z.record(z.string(), z.unknown()).optional(),
  }),
  output: z.object({
    content: AdminContentItem,
  }),
  mock: (input) => ({
    content: {
      id: `content-${Date.now()}`,
      moduleId: input.id,
      type: input.type,
      title: input.title,
      description: input.description,
      order: input.order ?? 1,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      source: input.source,
      url: input.url,
      videoId: input.source === 'YOUTUBE' ? 'mockVideo123' : undefined,
      durationMin: input.durationMin ?? 5,
      xp: input.xp ?? 50,
      maxMarks: input.maxMarks ?? 100,
      evaluationCriteria: input.evaluationCriteria,
      taskData: input.taskData,
    },
  }),
})

export const listContent = defineContract({
  method: 'GET',
  path: '/api/admin/modules/:id/content',
  auth: 'admin',
  summary: 'Admin retrieves all content items of a module ordered sequentially',
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    content: z.array(AdminContentItem),
  }),
  mock: ({ id }) => ({
    content: [
      {
        id: 'content_1',
        moduleId: id,
        type: 'VIDEO' as const,
        title: 'Introduction to Transactions',
        description: 'Learn the basics of database transactions.',
        source: 'YOUTUBE' as const,
        videoId: 'abc12345',
        url: 'https://www.youtube.com/watch?v=abc12345',
        durationMin: 10,
        order: 1,
        status: 'ACTIVE' as const,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
      {
        id: 'content_2',
        moduleId: id,
        type: 'VIDEO' as const,
        title: 'Advanced Storage & Concurrency',
        description: 'Cloud video on storage architecture.',
        source: 'CLOUD' as const,
        url: 'https://storage.example.com/videos/transactions.mp4',
        durationMin: 15,
        order: 2,
        status: 'ACTIVE' as const,
        createdAt: '2026-01-11T00:00:00.000Z',
      },
      {
        id: 'content_3',
        moduleId: id,
        type: 'TASK' as const,
        title: 'Explain ACID Properties with Practical Examples',
        description: 'Explain ACID properties with examples.',
        xp: 50,
        maxMarks: 100,
        evaluationCriteria: [
          { name: 'Understanding', description: 'Accurate explanation', weight: 40 },
          { name: 'Examples', description: 'Real SQL transactions', weight: 30 },
          { name: 'Clarity', description: 'Structured clarity', weight: 30 },
        ],
        order: 3,
        status: 'ACTIVE' as const,
        createdAt: '2026-01-12T00:00:00.000Z',
      },
    ],
  }),
})

export const getContent = defineContract({
  method: 'GET',
  path: '/api/admin/content/:contentId',
  auth: 'admin',
  summary: 'Admin gets details of a single content item',
  input: z.object({
    contentId: z.string(),
  }),
  output: z.object({
    content: AdminContentItem,
  }),
  mock: ({ contentId }) => ({
    content: {
      id: contentId,
      moduleId: 'module-1',
      type: 'VIDEO' as const,
      title: 'Introduction to Transactions',
      description: 'Learn the basics of database transactions.',
      source: 'YOUTUBE' as const,
      videoId: 'abc12345',
      url: 'https://www.youtube.com/watch?v=abc12345',
      durationMin: 10,
      order: 1,
      status: 'ACTIVE' as const,
      createdAt: '2026-01-10T00:00:00.000Z',
    },
  }),
})

export const updateContent = defineContract({
  method: 'PUT',
  path: '/api/admin/content/:contentId',
  auth: 'admin',
  summary: 'Admin updates a content item (video URL/source or task configuration)',
  input: z.object({
    contentId: z.string(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
    // Video updates
    source: VideoSource.optional(),
    url: z.string().optional(),
    durationMin: z.number().int().min(1).optional(),
    // Task updates
    xp: z.number().int().min(1).max(1000).optional(),
    maxMarks: z.number().int().min(1).max(1000).optional(),
    evaluationCriteria: z.array(EvaluationCriterion).optional(),
    taskData: z.record(z.string(), z.unknown()).optional(),
  }),
  output: z.object({
    content: AdminContentItem,
  }),
  mock: (input) => ({
    content: {
      id: input.contentId,
      moduleId: 'module-1',
      type: 'VIDEO' as const,
      title: input.title ?? 'Updated Content',
      description: input.description ?? '',
      order: input.order ?? 1,
      status: 'ACTIVE' as const,
      createdAt: '2026-01-10T00:00:00.000Z',
      source: input.source ?? ('YOUTUBE' as const),
      url: input.url ?? 'https://www.youtube.com/watch?v=abc12345',
      videoId: 'abc12345',
      durationMin: input.durationMin ?? 10,
    },
  }),
})

export const setContentStatus = defineContract({
  method: 'PATCH',
  path: '/api/admin/content/:contentId/status',
  auth: 'admin',
  summary: 'Admin activates or deactivates content without deleting progress',
  input: z.object({
    contentId: z.string(),
    status: ContentStatus,
  }),
  output: z.object({
    content: AdminContentItem,
  }),
  mock: ({ contentId, status }) => ({
    content: {
      id: contentId,
      moduleId: 'module-1',
      type: 'VIDEO' as const,
      title: 'Content Item',
      description: 'Description',
      order: 1,
      status,
      createdAt: '2026-01-10T00:00:00.000Z',
      source: 'YOUTUBE' as const,
      videoId: 'abc12345',
      url: 'https://www.youtube.com/watch?v=abc12345',
    },
  }),
})

export const reorderContent = defineContract({
  method: 'PATCH',
  path: '/api/admin/modules/:id/content/reorder',
  auth: 'admin',
  summary: 'Admin reorders content items inside a module',
  input: z.object({
    id: z.string(),
    items: z.array(
      z.object({
        contentId: z.string(),
        order: z.number().int().min(0),
      }),
    ),
  }),
  output: z.object({
    success: z.boolean(),
    reorderedCount: z.number().int(),
  }),
  mock: (input) => ({
    success: true,
    reorderedCount: input.items.length,
  }),
})

