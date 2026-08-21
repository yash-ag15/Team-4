export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  cohortYear?: string;
  campus?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
}

export interface ProgressSummary {
  overallPct: number;
  courses: { completed: number; total: number };
  assignments: { completed: number; total: number };
  projects: { completed: number; total: number };
  mentoring: { completed: number; total: number };
}

export interface Mission {
  id: string;
  title: string;
  dueLabel: string;
  xpReward: number;
  status: 'completed' | 'due_today' | 'due_soon';
  isOverdue?: boolean;
}

export interface HeatmapCell {
  dayIndex: number;
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  activitiesCount: number;
}

export interface StudyPlanItem {
  id: string;
  timeframe: string; // 'Today' | 'Tomorrow' | 'Friday, 24th'
  isCurrent?: boolean;
  tasks: Array<{
    id: string;
    title: string;
    type?: string;
  }>;
}

export interface AchievementBadge {
  id: string;
  title: string;
  icon: string;
  isEmoji?: boolean;
  levelBadge?: number;
  locked?: boolean;
  colorClass?: string;
}

export interface MentorInfo {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  nextSessionTime: string;
}

export interface LeaderboardRankInfo {
  myRank: number;
  prevRankUser: { rank: number; name: string; avatarUrl: string };
  nextRankUser: { rank: number; name: string; avatarUrl: string };
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}
