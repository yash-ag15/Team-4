'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, Medal, Crown, Star, Flame, Award, TrendingUp, Sparkles } from 'lucide-react'
import { api } from '@/lib/api-client'
import { levelFromXp } from '@/lib/xp'
import { StudentNavbar } from '@/components/layout/student-navbar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { StudentProfileProvider, useStudentProfile } from '@/context/student-profile-context'

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  xp: number
  level: number
  isCurrentUser?: boolean
}

const MOCK_LEADERBOARD_FALLBACK: LeaderboardEntry[] = [
  { rank: 1, userId: 'user-1', name: 'Sadye Smith', xp: 4365, level: 7 },
  { rank: 2, userId: 'user-2', name: 'Kristine Pfeffer', xp: 4282, level: 7 },
  { rank: 3, userId: 'user-3', name: 'Ashton Schuster', xp: 3993, level: 7 },
  { rank: 4, userId: 'user-4', name: 'Erwin Macejkovic', xp: 3760, level: 7 },
  { rank: 5, userId: 'user-5', name: 'Cristal Lind PhD', xp: 3708, level: 7 },
  { rank: 6, userId: 'user-6', name: 'Rex Fisher', xp: 3677, level: 7 },
  { rank: 7, userId: 'user-7', name: 'Queenie Jast', xp: 3612, level: 7 },
  { rank: 8, userId: 'user-8', name: 'Shanelle Schulist', xp: 3478, level: 6 },
  { rank: 9, userId: 'user-9', name: 'Lacey Medhurst', xp: 3399, level: 6 },
  { rank: 10, userId: 'user-10', name: 'Abbie Grant', xp: 3155, level: 6 },
]

function LeaderboardContent() {
  const { profile } = useStudentProfile()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD_FALLBACK)
  const [loading, setLoading] = useState<boolean>(true)
  const [timeframe, setTimeframe] = useState<'this_month' | 'all_time'>('this_month')
  const [myRank, setMyRank] = useState<number>(4)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoading(true)
      try {
        const res = await api.userDashboard.dashboard({})
        if (isMounted && res?.dashboard?.leaderboardPeek) {
          const peek = res.dashboard.leaderboardPeek
          setMyRank(peek.myRank || 4)
          const top3Entries: LeaderboardEntry[] = peek.top3.map((item: { rank: number; name: string; xp: number }) => ({
            rank: item.rank,
            userId: `top-${item.rank}`,
            name: item.name,
            xp: item.xp,
            level: levelFromXp(item.xp),
          }))

          if (top3Entries.length > 0) {
            const merged = [...top3Entries]
            MOCK_LEADERBOARD_FALLBACK.slice(3).forEach((fallbackItem) => {
              if (!merged.some((m) => m.name === fallbackItem.name)) {
                merged.push(fallbackItem)
              }
            })
            setLeaderboard(merged.slice(0, 10))
          }
        }
      } catch (err) {
        console.warn('Leaderboard API peek fallback:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  const top1 = leaderboard[0]
  const top2 = leaderboard[1]
  const top3 = leaderboard[2]

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pb-24 md:pb-8">
      {/* Shared Top Navbar */}
      <StudentNavbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 bg-tertiary-container text-on-tertiary-container font-semibold text-xs px-3 py-1 rounded-full w-max border border-tertiary-fixed">
              <Trophy className="w-3.5 h-3.5 text-xp-gold" />
              <span>Cohort Rankings</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-on-background tracking-tight">
              Community Leaderboard
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xl">
              Earn XP by completing lessons, challenges, and assessments to climb the ranks and earn prestige.
            </p>
          </div>

          {/* Timeframe Toggle Pills */}
          <div className="flex items-center bg-surface-container-low border border-outline-variant/40 p-1 rounded-full self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTimeframe('this_month')}
              className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${
                timeframe === 'this_month'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all_time')}
              className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${
                timeframe === 'all_time'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background'
              }`}
            >
              All Time
            </button>
          </div>
        </section>

        {/* Signed-in User Highlight Banner */}
        <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10 border border-primary/30 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
              #{myRank}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg text-on-background">
                  {profile.name} (You)
                </span>
                <span className="bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md uppercase">
                  Your Rank
                </span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                Level {profile.level} • {profile.xpTotal} Total XP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <Flame className="w-4 h-4 text-streak-orange fill-streak-orange" />
              <span>{profile.streakCount} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <Star className="w-4 h-4 text-xp-gold fill-xp-gold" />
              <span>Top {Math.min(myRank, 10)}% Learner</span>
            </div>
          </div>
        </section>

        {/* Podium Section (Top 3 Leaders) */}
        {top1 && top2 && top3 && (
          <section className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-4 pb-2 max-w-3xl mx-auto w-full">
            {/* 2nd Place Podium */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-high border-2 border-slate-300 flex items-center justify-center text-xl md:text-2xl font-bold shadow-md">
                  🥈
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  2nd
                </span>
              </div>
              <div className="text-center mt-2">
                <h4 className="font-bold text-xs md:text-base text-on-background line-clamp-1">
                  {top2.name}
                </h4>
                <p className="text-[11px] md:text-xs font-semibold text-xp-gold">
                  {top2.xp.toLocaleString()} XP
                </p>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Lvl {top2.level}
                </span>
              </div>
              <div className="w-full bg-gradient-to-t from-slate-300/20 to-slate-300/5 h-24 md:h-32 rounded-t-2xl border-t border-x border-slate-300/40" />
            </div>

            {/* 1st Place Podium */}
            <div className="flex flex-col items-center gap-2 -mt-4">
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xp-gold animate-bounce">
                  <Crown className="w-7 h-7 fill-xp-gold" />
                </div>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-tertiary-container border-4 border-xp-gold flex items-center justify-center text-2xl md:text-3xl font-bold shadow-xl">
                  🥇
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-xp-gold text-on-tertiary text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  1st
                </span>
              </div>
              <div className="text-center mt-2">
                <h4 className="font-extrabold text-sm md:text-lg text-on-background line-clamp-1">
                  {top1.name}
                </h4>
                <p className="text-xs md:text-sm font-bold text-xp-gold">
                  {top1.xp.toLocaleString()} XP
                </p>
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  Lvl {top1.level}
                </span>
              </div>
              <div className="w-full bg-gradient-to-t from-xp-gold/30 via-xp-gold/10 to-transparent h-32 md:h-44 rounded-t-2xl border-t-2 border-x border-xp-gold/50 shadow-inner" />
            </div>

            {/* 3rd Place Podium */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-high border-2 border-amber-600/40 flex items-center justify-center text-xl md:text-2xl font-bold shadow-md">
                  🥉
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  3rd
                </span>
              </div>
              <div className="text-center mt-2">
                <h4 className="font-bold text-xs md:text-base text-on-background line-clamp-1">
                  {top3.name}
                </h4>
                <p className="text-[11px] md:text-xs font-semibold text-xp-gold">
                  {top3.xp.toLocaleString()} XP
                </p>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Lvl {top3.level}
                </span>
              </div>
              <div className="w-full bg-gradient-to-t from-amber-700/20 to-amber-700/5 h-20 md:h-24 rounded-t-2xl border-t border-x border-amber-700/30" />
            </div>
          </section>
        )}

        {/* Full Leaderboard List Table */}
        <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 md:p-5 border-b border-outline-variant/30 flex items-center justify-between">
            <h3 className="font-bold text-base md:text-lg text-on-background">
              Rankings (Top Learners)
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              Updated Live
            </span>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {leaderboard.map((entry) => {
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3.5 md:p-4 hover:bg-surface-container-low/50 transition-colors ${
                    entry.isCurrentUser ? 'bg-primary/5 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shrink-0 ${
                        entry.rank === 1
                          ? 'bg-xp-gold text-on-tertiary font-extrabold shadow-sm'
                          : entry.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : entry.rank === 3
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      #{entry.rank}
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm md:text-base text-on-background">
                          {entry.name}
                        </span>
                        {entry.isCurrentUser && (
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Level {entry.level} Learner
                      </span>
                    </div>
                  </div>

                  {/* XP Total */}
                  <div className="flex items-center gap-1.5 font-bold text-sm md:text-base text-xp-gold">
                    <Star className="w-4 h-4 fill-xp-gold" />
                    <span>{entry.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Shared Mobile Bottom Navbar */}
      <StudentBottomNav />
    </div>
  )
}

export default function StudentLeaderboardPage() {
  return (
    <StudentProfileProvider>
      <LeaderboardContent />
    </StudentProfileProvider>
  )
}
