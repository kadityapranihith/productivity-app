import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Flame, TrendingUp, Calendar, Trophy,
  Lock, CheckCircle2, Sparkles
} from 'lucide-react'
import { Card, StatCard, SectionHeader, Badge } from '@/components/ui'
import { ConsistencyHeatmap } from '@/components/heatmap/ConsistencyHeatmap'
import { useAppStore } from '@/lib/store'
import type { Achievement, DailySummary } from '@/types'

const YEAR_MILESTONES = [50, 100, 200, 300]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function ConsistencyPage() {
  const year = new Date().getFullYear()
  const currentMonthIdx = new Date().getMonth()

  // Store bindings
  const stats = useAppStore(state => state.stats)
  const heatmapData = useAppStore(state => state.heatmapData)
  const achievements = useAppStore(state => state.achievements)
  const userAchievements = useAppStore(state => state.userAchievements)
  const setInspectingBadge = useAppStore(state => state.setInspectingBadge)

  const activeDaysThisYear = stats.active_days_this_year
  const allTimeDays = stats.all_time_active_days ?? heatmapData.filter(d => d.qualifies_for_consistency).length

  const nextMilestone = YEAR_MILESTONES.find(m => m > activeDaysThisYear) ?? 300
  const monthlyStats = getMonthlyStats(heatmapData)
  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id))

  // Categorize official 21 badges
  const allTimeAchs = achievements.filter(a => a.type === 'all_time_worked')
  const yearActiveDayAchs = achievements.filter(a =>
    a.type === 'active_days_50' ||
    a.type === 'active_days_100' ||
    a.type === 'active_days_200' ||
    a.type === 'active_days_300'
  )
  const monthlyAchs = achievements
    .filter(a => a.type === 'monthly_consistency')
    .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))
  const goatAch = achievements.find(a =>
    a.type === 'complete_year_goat' || a.type === 'full_year_consistency'
  )

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Consistency & Badges</h1>
            <p className="text-xs text-[#8B9A8E] mt-1">
              Track your daily showing up, streaks, heatmap, and verified accountability badges all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="accent" className="px-3 py-1 text-xs">
              {earnedIds.size} Badges Earned
            </Badge>
            <Badge variant="muted" className="px-3 py-1 text-xs">
              {allTimeDays} Days Worked
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* 1. Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Current Streak"
          value={`${stats.current_streak}d`}
          sub="consecutive days"
          accent
          icon={<Flame className="w-4 h-4 text-[#F59E0B]" />}
        />
        <StatCard
          label="Longest Streak"
          value={`${stats.longest_streak}d`}
          sub="personal best"
          icon={<TrendingUp className="w-4 h-4 text-[#4ADE80]" />}
        />
        <StatCard
          label={`${year} Active Days`}
          value={`${activeDaysThisYear}d`}
          sub={`active in ${year}`}
          icon={<Calendar className="w-4 h-4 text-[#60A5FA]" />}
        />
        <StatCard
          label="All-Time Worked"
          value={`${allTimeDays}d`}
          sub="cumulative days"
          icon={<Trophy className="w-4 h-4 text-[#C5F36B]" />}
        />
      </div>

      {/* 2. Full Contribution Heatmap with 3 States */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <SectionHeader
            title={`${year} Showing-Up Heatmap`}
            subtitle="Verified daily records across all scheduled habits and tasks."
          />

          {/* Three States Legend */}
          <div className="flex items-center gap-4 text-[11px] text-[#8B9A8E] bg-[#181B19] px-3 py-1.5 rounded-lg border border-[#262C28] self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#4ADE80]" />
              <span>Full Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#2D5A3A]" />
              <span>Bare-Minimum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#1E2220] border border-[#262C28]" />
              <span>Rest / Inactive</span>
            </div>
          </div>
        </div>

        <ConsistencyHeatmap data={heatmapData} />
      </Card>

      {/* 3. All-Time Milestone Badges (Cumulative 365d, 500d, 1000d, 2000d) */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <SectionHeader
          title="All-Time Milestone Badges"
          subtitle="Cumulative days worked from account start (does not require consecutive days)."
          className="mb-5"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {allTimeAchs.map((ach) => {
            const earned = earnedIds.has(ach.id)
            const ua = userAchievements.find(x => x.achievement_id === ach.id)
            const progress = ach.threshold ? Math.min(100, Math.round((allTimeDays / ach.threshold) * 100)) : 0

            return (
              <button
                key={ach.id}
                onClick={() => setInspectingBadge(ach)}
                className="w-full text-left transition-transform active:scale-95"
              >
                <AchievementCard
                  achievement={ach}
                  earned={earned}
                  earnedAt={ua?.earned_at}
                  progress={progress}
                  currentMetric={allTimeDays}
                />
              </button>
            )
          })}
        </div>
      </Card>

      {/* 4. Unified Calendar-Year Active-Day Milestones ({year}) */}
      {/* Combines the milestone track bar and the 4 badge cards into one single section */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <SectionHeader
          title={`${year} Active-Day Milestones`}
          subtitle={`Milestones for showing up 50, 100, 200, and 300 days in ${year}. Both normal target and bare-minimum qualify.`}
          className="mb-5"
        />

        {/* Milestone Progress Bar Track */}
        <div className="relative pt-2 pb-3 mb-6 bg-[#181B19] p-4 rounded-xl border border-[#262C28]">
          <div className="flex items-center justify-between text-xs text-[#8B9A8E] mb-2 font-medium">
            <span>Overall Progress</span>
            <span className="text-[#C5F36B] font-semibold">
              {activeDaysThisYear} / 300 Days ({Math.min(100, Math.round((activeDaysThisYear / 300) * 100))}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#252A27] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#4ADE80] to-[#C5F36B] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (activeDaysThisYear / 300) * 100)}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5A6B5D]">
            <span>
              {nextMilestone > activeDaysThisYear
                ? `${nextMilestone - activeDaysThisYear} more days to ${nextMilestone}-day milestone`
                : `All 300-day milestones completed for ${year}! 🎉`
              }
            </span>
            <span className="text-[#C5F36B]">Tap any milestone to inspect</span>
          </div>
        </div>

        {/* 4 Active-Day Milestone Badge Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {yearActiveDayAchs.map((ach) => {
            const earned = earnedIds.has(ach.id)
            const ua = userAchievements.find(x => x.achievement_id === ach.id)
            const progress = ach.threshold ? Math.min(100, Math.round((activeDaysThisYear / ach.threshold) * 100)) : 0

            return (
              <button
                key={ach.id}
                onClick={() => setInspectingBadge(ach)}
                className="w-full text-left transition-transform active:scale-95"
              >
                <AchievementCard
                  achievement={ach}
                  earned={earned}
                  earnedAt={ua?.earned_at}
                  progress={progress}
                  currentMetric={activeDaysThisYear}
                />
              </button>
            )
          })}
        </div>
      </Card>

      {/* 5. Unified Monthly Consistency Badges & Overview ({year}) */}
      {/* Combines monthly active day stats and monthly consistency badges into one single 12-month section */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <SectionHeader
          title={`Monthly Consistency Badges (${year})`}
          subtitle={`Track your daily consistency for each month in ${year}. Awarded for maintaining consistency streaks across all days.`}
          className="mb-5"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MONTH_NAMES.map((monthName, idx) => {
            const ach = monthlyAchs.find(a => a.month === idx + 1)
            const monthStat = monthlyStats[idx]
            const activeDays = monthStat?.activeDays ?? 0
            const total = monthStat?.total ?? 30
            const pct = total > 0 ? Math.round((activeDays / total) * 100) : 0
            const earned = ach ? earnedIds.has(ach.id) : false
            const ua = ach ? userAchievements.find(x => x.achievement_id === ach.id) : undefined
            const isCurrentOrPast = currentMonthIdx >= idx

            return (
              <button
                key={idx}
                onClick={() => ach && setInspectingBadge(ach)}
                disabled={!ach}
                className="text-left transition-transform active:scale-95"
              >
                <div className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all ${
                  earned
                    ? 'bg-[rgba(197,243,107,0.06)] border-[rgba(197,243,107,0.3)] shadow-[0_0_12px_rgba(197,243,107,0.08)]'
                    : isCurrentOrPast
                      ? 'bg-[#181B19] border-[#262C28] hover:border-[#2E3530]'
                      : 'bg-[#181B19] border-[#262C28] opacity-50'
                }`}>
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8B9A8E] uppercase tracking-wider">
                      {monthName.slice(0, 3)}
                    </span>
                    {earned ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                    ) : isCurrentOrPast ? (
                      <span className="text-[10px] text-[#5A6B5D]">{pct}%</span>
                    ) : (
                      <Lock className="w-3 h-3 text-[#3D4A40]" />
                    )}
                  </div>

                  <span className={`text-2xl transition-transform ${earned ? 'scale-110' : isCurrentOrPast ? 'opacity-70' : 'grayscale opacity-30'}`}>
                    {ach?.icon ?? '⭐'}
                  </span>

                  <div className="text-center w-full">
                    <div className="text-base font-bold text-[#F5F5F0]">
                      {activeDays}
                      <span className="text-[10px] text-[#5A6B5D] font-normal ml-0.5">/ {total}d</span>
                    </div>

                    {earned ? (
                      <Badge variant="accent" className="mt-1 text-[9px] w-full justify-center py-0.5">
                        Earned ✓
                      </Badge>
                    ) : isCurrentOrPast ? (
                      <div className="w-full h-1 bg-[#252A27] rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-[#4ADE80] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[9px] text-[#5A6B5D] block mt-1">Upcoming</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 6. Complete Year GOAT Badge */}
      {goatAch && (
        <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
          <SectionHeader
            title={`${year} Complete Year GOAT Badge`}
            subtitle="The pinnacle of accountability — awarded for maintaining full consistency standards on every scheduled commitment throughout the entire year."
            className="mb-5"
          />
          <button
            onClick={() => setInspectingBadge(goatAch)}
            className="w-full text-left transition-transform active:scale-98"
          >
            <FullYearBadge
              achievement={goatAch}
              earned={earnedIds.has(goatAch.id)}
              earnedAt={userAchievements.find(x => x.achievement_id === goatAch.id)?.earned_at}
              year={year}
            />
          </button>
        </Card>
      )}
    </div>
  )
}

function AchievementCard({
  achievement,
  earned,
  earnedAt,
  progress,
  currentMetric
}: {
  achievement: Achievement
  earned: boolean
  earnedAt?: string
  progress: number
  currentMetric: number
}) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
      earned
        ? 'bg-[rgba(197,243,107,0.05)] border-[rgba(197,243,107,0.25)] shadow-[0_0_12px_rgba(197,243,107,0.06)]'
        : 'bg-[#181B19] border-[#262C28] hover:border-[#2E3530]'
    }`}>
      <div className={`text-4xl transition-transform ${earned ? 'scale-110' : 'opacity-30 grayscale'}`}>
        {achievement.icon}
      </div>
      <div className="w-full">
        <p className={`text-xs font-bold ${earned ? 'text-[#F5F5F0]' : 'text-[#8B9A8E]'}`}>
          {achievement.name}
        </p>
        {earned ? (
          <>
            <Badge variant="accent" className="mt-1.5 text-[9px]">Unlocked ✓</Badge>
            {earnedAt && (
              <p className="text-[9px] text-[#5A6B5D] mt-1">
                {format(new Date(earnedAt), 'MMM d, yyyy')}
              </p>
            )}
          </>
        ) : (
          <div className="w-full mt-2">
            <div className="w-full h-1.5 bg-[#252A27] rounded-full overflow-hidden">
              <div className="h-full bg-[#2D5A3A] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-[#5A6B5D] mt-1">
              {currentMetric} / {achievement.threshold}d ({progress}%)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FullYearBadge({
  achievement,
  earned,
  earnedAt,
  year
}: {
  achievement: Achievement
  earned: boolean
  earnedAt?: string
  year: number
}) {
  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border transition-all ${
      earned
        ? 'bg-[rgba(197,243,107,0.05)] border-[rgba(197,243,107,0.3)] shadow-[0_0_20px_rgba(197,243,107,0.1)]'
        : 'bg-[#181B19] border-[#262C28] hover:border-[#2E3530]'
    }`}>
      <div className={`text-6xl ${earned ? '' : 'grayscale opacity-30'}`}>
        {achievement.icon}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <h3 className={`text-lg font-bold ${earned ? 'text-[#F5F5F0]' : 'text-[#8B9A8E]'}`}>
            {achievement.name}
          </h3>
          <Badge variant="warning" className="text-[9px]">Ultimate Prestige</Badge>
        </div>
        <p className="text-xs text-[#5A6B5D] leading-relaxed">
          {achievement.description}
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
          {earned ? (
            <>
              <Badge variant="accent">GOAT Status Unlocked ✓</Badge>
              {earnedAt && (
                <span className="text-xs text-[#5A6B5D]">
                  Awarded on {format(new Date(earnedAt), 'MMMM d, yyyy')}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#5A6B5D]">
              <Lock className="w-3.5 h-3.5 text-[#5A6B5D]" />
              <span>In progress for {year}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getMonthlyStats(data: DailySummary[]) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return months.map((name, i) => {
    const monthData = data.filter(d => new Date(d.date).getMonth() === i)
    const activeDays = monthData.filter(d => d.qualifies_for_consistency).length
    const total = monthData.length
    return { month: i, name, activeDays, total }
  })
}
