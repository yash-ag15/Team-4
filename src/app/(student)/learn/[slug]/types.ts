export interface Lesson {
  lessonId: string
  title: string
  isCompleted: boolean
}

export interface Assignment {
  assignmentId: string
  title: string
  status: 'locked' | 'not_started' | 'in_progress' | 'completed'
  xpReward: number
}

export interface Module {
  moduleId: string
  title: string
  lessons: Lesson[]
  assignment: Assignment
  completedPct: number
}

export interface CourseProgress {
  courseId: string
  title: string
  overallCompletedPct: number
  xpEarned: number
  xpTotalPossible: number
  modules: Module[]
  finalAssignment: Assignment
}
