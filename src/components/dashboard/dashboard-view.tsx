'use client';

import React, { useState } from 'react';
import { Navbar } from './navbar';
import { HeroSection } from './hero-section';
import { ProgressCard } from './progress-card';
import { MissionsCard } from './missions-card';
import { ActivityHeatmap } from './activity-heatmap';
import { StudyPlanCard } from './study-plan-card';
import { AchievementsCard } from './achievements-card';
import { MobileNav } from './mobile-nav';
import { AiCoachPanel } from './ai-coach-panel';
import {
  initialUser,
  initialProgress,
  initialMissions,
  initialStudyPlan,
  initialAchievements,
  initialRank,
  initialMentor,
  generateLearningHeatmap,
} from './mock-data';
import {
  UserProfile,
  ProgressSummary,
  Mission,
  StudyPlanItem,
  AchievementBadge,
  LeaderboardRankInfo,
  MentorInfo,
  HeatmapCell,
} from './types';

interface DashboardViewProps {
  initialUserData?: UserProfile;
  initialProgressData?: ProgressSummary;
  initialMissionsData?: Mission[];
  initialStudyPlanData?: StudyPlanItem[];
  initialAchievementsData?: AchievementBadge[];
  initialRankData?: LeaderboardRankInfo;
  initialMentorData?: MentorInfo;
  initialHeatmapData?: HeatmapCell[];
}

export function DashboardView({
  initialUserData = initialUser,
  initialProgressData = initialProgress,
  initialMissionsData = initialMissions,
  initialStudyPlanData = initialStudyPlan,
  initialAchievementsData = initialAchievements,
  initialRankData = initialRank,
  initialMentorData = initialMentor,
  initialHeatmapData,
}: DashboardViewProps) {
  const [user, setUser] = useState<UserProfile>(initialUserData);
  const [progress] = useState<ProgressSummary>(initialProgressData);
  const [missions] = useState<Mission[]>(initialMissionsData);
  const [studyPlan] = useState<StudyPlanItem[]>(initialStudyPlanData);
  const [badges] = useState<AchievementBadge[]>(initialAchievementsData);
  const [rankInfo] = useState<LeaderboardRankInfo>(initialRankData);
  const [mentor] = useState<MentorInfo>(initialMentorData);
  const [heatmapCells] = useState<HeatmapCell[]>(
    () => initialHeatmapData || generateLearningHeatmap()
  );

  const handleMissionToggle = (missionId: string, completed: boolean) => {
    if (completed) {
      // Award XP optimistically
      const mission = missions.find((m) => m.id === missionId);
      const xpDelta = mission ? mission.xpReward : 50;
      setUser((prev) => ({
        ...prev,
        xp: prev.xp + xpDelta,
        xpToNextLevel: Math.max(0, prev.xpToNextLevel - xpDelta),
      }));
    }
  };

  return (
    <div className="bg-background text-on-background antialiased min-h-screen pb-32">
      {/* Top Navbar */}
      <Navbar user={user} />

      {/* Main Content Area */}
      <main className="px-4 md:px-8 max-w-[1280px] w-full mx-auto mt-6 flex flex-col gap-6">
        {/* Hero Section */}
        <HeroSection user={user} />

        {/* Progress & Missions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProgressCard progress={progress} />
          <MissionsCard initialMissions={missions} onMissionToggle={handleMissionToggle} />
        </section>

        {/* Learning Activity Heatmap */}
        <ActivityHeatmap
          cells={heatmapCells}
          totalActivities={142}
          currentStreak={user.streak}
          longestStreak={user.longestStreak}
          totalXp={user.xp}
        />

        {/* Timeline & Achievements Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StudyPlanCard items={studyPlan} />
          <AchievementsCard badges={badges} rankInfo={rankInfo} mentor={mentor} />
        </section>
      </main>

      {/* Bottom Navigation for Mobile Devices */}
      <MobileNav />

      {/* Interactive AI Coach Assistant */}
      <AiCoachPanel userName={user.name} />
    </div>
  );
}
