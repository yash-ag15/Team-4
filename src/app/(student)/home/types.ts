export interface AssignedCourse {
  courseId: string
  title: string
  thumbnail: string
  completedLessons: number
  totalLessons: number
  xpEarned: number
  xpTotalPossible: number
  lastActivityAt: string | null // null = never started
  completedAt?: string | null // null = not completed
  isMandatory: boolean // true = mentor-assigned, false = self-enrolled
}

export interface RecommendedCourse {
  courseId: string
  title: string
  blurb: string
  reason: string
  thumbnail: string
}

export interface AchievementItem {
  id: string
  title: string
  icon: string
  unlocked: boolean
}
