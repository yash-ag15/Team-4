import {
  UserProfile,
  ProgressSummary,
  Mission,
  StudyPlanItem,
  AchievementBadge,
  MentorInfo,
  LeaderboardRankInfo,
  HeatmapCell,
} from './types';

export const initialUser: UserProfile = {
  id: 'usr-methika',
  name: 'Methika',
  email: 'methika@katalyst.test',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvM3zlvccRhJlmVrMz6E7Q-9YQQ_NjQjqEDsbX-q-pHbHRNtTiqqu5CtZU0Iahcbz6OtHyx38IVoQCJsggvYOctYLgamJ4XRxAfMfV9_Mt1pBJTMNTcRMMgxdf9Ez-q24pijocPTMrMU68Lxhx1b6nfjcc4lzn-i9pdygGTI1RZLh8_CAx_5J2zHGw18mp-IF5udXLbwb5XpQUkGhVTGh6mKr0l9jRuhxB8-A2E90g2YvH9ePB_sOCkg',
  cohortYear: '2026',
  campus: 'Pune',
  level: 5,
  xp: 2450,
  xpToNextLevel: 550,
  streak: 12,
  longestStreak: 18,
};

export const initialProgress: ProgressSummary = {
  overallPct: 72,
  courses: { completed: 8, total: 10 },
  assignments: { completed: 14, total: 18 },
  projects: { completed: 3, total: 5 },
  mentoring: { completed: 6, total: 8 },
};

export const initialMissions: Mission[] = [
  {
    id: 'mission-1',
    title: 'Daily Quiz',
    dueLabel: 'Completed',
    xpReward: 50,
    status: 'completed',
  },
  {
    id: 'mission-2',
    title: 'Data Structures Assignment',
    dueLabel: 'Due Today, 11:59 PM',
    xpReward: 150,
    status: 'due_today',
    isOverdue: false,
  },
  {
    id: 'mission-3',
    title: 'Read Chapter 4',
    dueLabel: 'Due Tomorrow',
    xpReward: 50,
    status: 'due_soon',
  },
];

export const initialStudyPlan: StudyPlanItem[] = [
  {
    id: 'sp-today',
    timeframe: 'Today',
    isCurrent: true,
    tasks: [
      { id: 't-1', title: 'Data Structures Assignment' },
      { id: 't-2', title: 'Mentor Session: Mrs. Priya Nair' },
    ],
  },
  {
    id: 'sp-tomorrow',
    timeframe: 'Tomorrow',
    isCurrent: false,
    tasks: [{ id: 't-3', title: 'Read Chapter 4' }],
  },
  {
    id: 'sp-friday',
    timeframe: 'Friday, 24th',
    isCurrent: false,
    tasks: [{ id: 't-4', title: 'Team Project Meeting' }],
  },
];

export const initialAchievements: AchievementBadge[] = [
  {
    id: 'badge-1',
    title: 'Assignment\nMaster',
    icon: 'workspace_premium',
    levelBadge: 3,
    locked: false,
  },
  {
    id: 'badge-2',
    title: '7 Day\nStreak',
    icon: '🔥',
    isEmoji: true,
    locked: false,
  },
  {
    id: 'badge-3',
    title: 'Top 10%\nScore',
    icon: 'star',
    locked: false,
    colorClass: 'text-xp-gold',
  },
  {
    id: 'badge-4',
    title: 'Next\nMilestone',
    icon: 'lock',
    locked: true,
  },
];

export const initialRank: LeaderboardRankInfo = {
  myRank: 12,
  prevRankUser: {
    rank: 11,
    name: 'JD',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAum94CBSGX8pJeEzpMUMZMthrs8ne5xHOyjaXb6yf6UbQBcseaVDJfCJBmaONaf3EQyeXL24c41110scYeCw1qPCqzM9VvcsJv_jJGTmd4Q68KSgsneuQfluD3oeWv_drHWq-UqGnUPt_6KGrgKdzi60hdLlqS3Ttr0ERUrC9RYNYO4DSOb-2zZEWtMs1h9xkRb2kSB0iMyoiIhSByt9ZuP2ITWsLigXLdi7lDye7ldaOwDNC9OMYLQQ',
  },
  nextRankUser: {
    rank: 13,
    name: 'ST',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnNtiN0R1WrN07sBttT8PcVs9UW3WcAi5BD5sRIeM0Vp7NGfhB1hrZF4xFskI0SP7vzKmT2pWhkhGcOcUg1vkJXidlhM3eMnvQhkzm24ltPPtFoNszx6gTkURzN-zVzNpMZoVtoP_pvf0KXlXr2eZYr388WXJ1JI3hyOx2UICc0PtBv4EGjCDJ30ByiRS4GaBi9X2RYQJJbg0Zf_uAr7grJObEQ62fhgn_qHNlH567hhVFmSYAuf40ig',
  },
};

export const initialMentor: MentorInfo = {
  id: 'men-1',
  name: 'Mrs. Priya Nair',
  specialty: 'Data Science',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAIt8nT6gZZQ0vYR5Vtdw6xDD5cw8UjjTcFkOO5cmMDgLu6l5XHMFQ6R1tUkn_WupTqPoUIYmlfu29aNBxkmwgVacYn5aWH_WdCURBv0nuYfMmlW9EbZEpEwQXzCWrzcQ_aCFEO5sZhhEHbqjUDTSrQMnB9H7TkUCJcTrJkEpI-gSwyh814Hu_eyfitMD82v11CxYDWihY-TJbWwfoiCrqg0p7SwZrU7JGHtxFz1k1fxyC_EoVvPf1vJg',
  nextSessionTime: 'Today, 4:00 PM',
};

/**
 * Generates 364 cells (52 weeks x 7 days) of realistic activity distribution
 * with higher intensity on weekdays and recent streak intact.
 */
export function generateLearningHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 364);

  // Seeded pattern to be deterministic across renders
  for (let i = 0; i < 364; i++) {
    const day = (i % 7); // 0 = Mon, 6 = Sun
    const month = Math.floor(i / 30);
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;

    // Last 12 days are part of the active streak
    if (i >= 352) {
      intensity = (day === 0 || day === 4 ? 4 : day === 2 ? 3 : 2) as 0 | 1 | 2 | 3 | 4;
    } else {
      // Deterministic pseudo-random generation based on index
      const hash = Math.sin(i * 12.9898 + month * 78.233) * 43758.5453;
      const rand = hash - Math.floor(hash);

      if (day >= 5) {
        // Weekends have lower activity
        intensity = rand > 0.65 ? (rand > 0.85 ? 2 : 1) : 0;
      } else {
        // Weekdays have frequent learning activity
        if (rand > 0.82) intensity = 4;
        else if (rand > 0.6) intensity = 3;
        else if (rand > 0.35) intensity = 2;
        else if (rand > 0.15) intensity = 1;
        else intensity = 0;
      }
    }

    const cellDate = new Date(baseDate);
    cellDate.setDate(cellDate.getDate() + i);

    cells.push({
      dayIndex: i,
      date: cellDate.toISOString().split('T')[0],
      intensity,
      activitiesCount: intensity === 0 ? 0 : intensity * 2 + 1,
    });
  }

  return cells;
}
