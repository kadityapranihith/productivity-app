import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import {
  Flame, TrendingUp, Calendar, Target, Trophy,
  Lock, CheckCircle2, ShieldCheck, Sparkles, Award
} from 'lucide-react'
import { Card, StatCard, SectionHeader, Badge, Button } from '@/components/ui'
import { ConsistencyHeatmap } from '@/components/heatmap/ConsistencyHeatmap'
import { useAppStore } from '@/lib/store'
import type { Achievement, DailySummary } from '@/types'

const MILESTONES = [50, 100, 200, 300]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function ConsistencyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'badges' ? 'badges' : 'heatmap'

  const year = new Date().getFullYear()

  // Store bindings
  const stats = useAppStore(state => state.stats)
  const heatmapData = useAppStore(state => state.heatmapData)
  const achievements = useAppStore(state => state.achievements)
  const userAchievements = useAppStore(state => state.userAchievements)
  const setInspectingBadge = useAppStore(state => state.setInspectingBadge)

  const activeDays = stats.active_days_this_year
  const nextMilestone = MILESTONES.find(m => m > activeDays) ?? 300
  const filteredMilestones = MILESTONES.filter(m => m <= activeDays)
  const prevMilestone = filteredMilestones.length > 0 ? filteredMilestones[filteredMilestones.length - 1] : 0
  const milestoneProgress = prevMilestone === nextMilestone
    ? 100
    : Math.round(((activeDays - prevMilestone) / (nextMilestone - prevMilestone)) * 100)

  const monthlyStats = getMonthlyStats(heatmapData)

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id))

  const activeDayAchs = achievements.filter(a =>
    a.type === 'active_days_50' ||
    a.type === 'active_days_100' ||
    a.type === 'active_days_200' ||
    a.type === 'active_days_300'
  )
  const monthlyAchs = achievements
    .filter(a => a.type === 'monthly_consistency')
    .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))
  const yearlyAch = achievements.find(a => a.type === 'full_year_consistency')

  const handleTabChange = (tab: 'heatmap' | 'badges') => {
    setSearchParams(tab === 'badges' ? { tab: 'badges' } : {})
  }

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-6">
      {/* Page Title & Navigation Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Consistency</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[#181B19] border border-[#262C28] p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => handleTabChange('heatmap')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'heatmap'
                  ? 'bg-[#252A27] text-[#C5F36B] shadow-sm'
                  : 'text-[#5A6B5D] hover:text-[#8B9A8E]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              Heatmap & Streaks
            </button>
            <button
              onClick={() => handleTabChange('badges')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'badges'
                  ? 'bg-[#252A27] text-[#C5F36B] shadow-sm'
                  : 'text-[#5A6B5D] hover:text-[#8B9A8E]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#C5F36B]" />
              Badges & Milestones
              {earnedIds.size > 0 && (
                <span className="px-1.5 py-0.2 bg-[#C5F36B]/20 text-[#C5F36B] text-[10px] rounded-full">
                  {earnedIds.size}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab 1: Heatmap & Streaks View */}
      {activeTab === 'heatmap' && (
        <motion.div
          key="heatmap-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Streak & Consistency Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Current Streak"
              value={`${stats.current_streak}d`}
              sub="current streak"
              accent
              icon={<Flame className="w-4 h-4 text-[#F59E0B]" />}
            />
            <StatCard
              label="Longest Streak"
              value={`${stats.longest_streak}d`}
              sub="best streak"
              icon={<TrendingUp className="w-4 h-4 text-[#4ADE80]" />}
            />
            <StatCard
              label="Active Days"
              value={activeDays}
              sub={`active in ${year}`}
              icon={<Calendar className="w-4 h-4 text-[#60A5FA]" />}
            />
            <StatCard
              label="Next Milestone"
              value={`${activeDays}/${nextMilestone}`}
              sub={`next: ${nextMilestone}d`}
              icon={<Target className="w-4 h-4 text-[#C5F36B]" />}
            />
          </div>

          {/* Active Day Milestones Progress Bar */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader
                title={`${year} Milestones`}
              />
              <button
                onClick={() => handleTabChange('badges')}
                className="text-xs text-[#C5F36B] hover:underline font-semibold flex items-center gap-1"
              >
                View all badges →
              </button>
            </div>
            <div className="flex items-center gap-0 relative pt-2 pb-1">
              <div className="absolute top-6 left-0 right-0 h-1 bg-[#262C28] rounded-full" />
              <div
                className="absolute top-6 left-0 h-1 bg-[#C5F36B] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (activeDays / 300) * 100)}%` }}
              />
              {MILESTONES.map((m) => {
                const achieved = activeDays >= m
                const ach = achievements.find(a => a.threshold === m)
                const userAch = userAchievements.find(ua => ua.achievement_id === ach?.id)
                return (
                  <button
                    key={m}
                    onClick={() => ach && setInspectingBadge(ach)}
                    className="flex-1 flex flex-col items-center relative z-10 transition-transform hover:scale-105"
                  >
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold mb-2 shadow-md ${
                      achieved
                        ? 'bg-[#C5F36B] border-[#C5F36B] text-[#101211]'
                        : 'bg-[#1E2220] border-[#2E3530] text-[#5A6B5D]'
                    }`}>
                      {achieved ? '✓' : ach?.icon}
                    </div>
                    <span className="text-xs font-bold text-[#F5F5F0]">{m}</span>
                    <span className="text-[10px] text-[#5A6B5D]">days</span>
                    {userAch && (
                      <span className="text-[9px] text-[#C5F36B] font-semibold mt-0.5">
                        {format(new Date(userAch.earned_at), 'MMM d')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#262C28] flex items-center justify-between text-xs text-[#5A6B5D]">
              <span>
                {nextMilestone > activeDays
                  ? `${nextMilestone - activeDays} more days to ${nextMilestone}-day milestone`
                  : `300-day milestone reached for ${year}!`
                }
              </span>
              <span className="text-[#C5F36B] font-medium">Normal & bare-min both qualify</span>
            </div>
          </Card>

          {/* Full Contribution Heatmap with 3 STATES */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <SectionHeader
                title={`${year} Heatmap`}
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

          {/* Monthly Consistency Breakdown */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <SectionHeader
              title="Monthly Eligibility"
              className="mb-4"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {monthlyStats.map(({ month, name, activeDays: mActive, total }) => {
                const pct = total > 0 ? Math.round((mActive / total) * 100) : 0
                const monthAch = userAchievements.find(ua => {
                  const a = achievements.find(x => x.id === ua.achievement_id)
                  return a?.type === 'monthly_consistency' && a.month === month + 1
                })

                return (
                  <div
                    key={month}
                    className="flex flex-col items-center gap-1 p-3.5 bg-[#181B19] border border-[#262C28] rounded-xl"
                  >
                    <span className="text-xs text-[#5A6B5D] font-bold uppercase">{name}</span>
                    <span className="text-xl font-bold text-[#F5F5F0] mt-0.5">{mActive}</span>
                    <span className="text-[10px] text-[#5A6B5D]">/ {total} days</span>

                    {monthAch ? (
                      <Badge variant="accent" className="mt-1 text-[9px]">Badge Earned ✓</Badge>
                    ) : (
                      <div className="w-full h-1 bg-[#262C28] rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-[#C5F36B] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tab 2: Badges & Milestones View */}
      {activeTab === 'badges' && (
        <motion.div
          key="badges-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Badge Summary Header Card */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-[#C5F36B]" />
                  <h2 className="text-lg font-bold text-[#F5F5F0]">Accountability Badges Catalog</h2>
                </div>
                <p className="text-xs text-[#8B9A8E]">
                  Earned automatically by maintaining verified daily showing-up standards. Click any badge to view criteria.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant="accent" className="px-3 py-1 text-xs">
                  {earnedIds.size} Badges Earned
                </Badge>
                <Badge variant="muted" className="px-3 py-1 text-xs">
                  {activeDays} Active Days
                </Badge>
              </div>
            </div>
          </Card>

          {/* 1. Calendar-Year Active-Day Milestones */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <SectionHeader
              title={`Active-Day Milestones (${year})`}
              className="mb-5"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {activeDayAchs.map((ach) => {
                const earned = earnedIds.has(ach.id)
                const ua = userAchievements.find(x => x.achievement_id === ach.id)
                const progress = ach.threshold ? Math.min(100, Math.round((activeDays / ach.threshold) * 100)) : 0

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
                    />
                  </button>
                )
              })}
            </div>
          </Card>

          {/* 2. Monthly Consistency Badges */}
          <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
            <SectionHeader
              title={`Monthly Badges (${year})`}
              className="mb-5"
            />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {MONTH_NAMES.map((monthName, idx) => {
                const ach = monthlyAchs.find(a => a.month === idx + 1)
                if (!ach) return null
                const earned = earnedIds.has(ach.id)
                const ua = userAchievements.find(x => x.achievement_id === ach.id)
                const isPast = new Date().getMonth() >= idx

                return (
                  <button
                    key={ach.id}
                    onClick={() => setInspectingBadge(ach)}
                    className="text-left transition-transform active:scale-95"
                  >
                    <MonthlyBadge
                      achievement={ach}
                      monthName={monthName}
                      earned={earned}
                      earnedAt={ua?.earned_at}
                      isPast={isPast}
                    />
                  </button>
                )
              })}
            </div>
          </Card>

          {/* 3. Full-Year Prestigious Annual Consistency Badge */}
          {yearlyAch && (
            <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
              <SectionHeader
                title={`Full-Year Prestige Badge (${year})`}
                subtitle="The pinnacle of accountability — awarded for meeting minimum commitments on every scheduled active day of the entire year."
                className="mb-5"
              />
              <button
                onClick={() => setInspectingBadge(yearlyAch)}
                className="w-full text-left transition-transform active:scale-98"
              >
                <FullYearBadge
                  achievement={yearlyAch}
                  earned={earnedIds.has(yearlyAch.id)}
                  earnedAt={userAchievements.find(x => x.achievement_id === yearlyAch.id)?.earned_at}
                  year={year}
                />
              </button>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}

function AchievementCard({
  achievement,
  earned,
  earnedAt,
  progress
}: {
  achievement: Achievement
  earned: boolean
  earnedAt?: string
  progress: number
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
                {format(new Date(earnedAt), 'MMM d')}
              </p>
            )}
          </>
        ) : (
          <div className="w-full mt-2">
            <div className="w-full h-1.5 bg-[#252A27] rounded-full overflow-hidden">
              <div className="h-full bg-[#2D5A3A] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-[#5A6B5D] mt-1">{progress}% of {achievement.threshold}d</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MonthlyBadge({
  achievement,
  monthName,
  earned,
  isPast
}: {
  achievement: Achievement
  monthName: string
  earned: boolean
  earnedAt?: string
  isPast: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
      earned
        ? 'bg-[rgba(197,243,107,0.05)] border-[rgba(197,243,107,0.25)] shadow-[0_0_10px_rgba(197,243,107,0.05)]'
        : isPast
          ? 'bg-[#181B19] border-[#262C28] opacity-70'
          : 'bg-[#181B19] border-[#262C28] opacity-40'
    }`}>
      <span className={`text-2xl ${earned ? '' : 'grayscale opacity-40'}`}>{achievement.icon}</span>
      <span className="text-[10px] font-semibold text-[#8B9A8E]">{monthName.slice(0, 3)}</span>
      {earned ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
      ) : isPast ? (
        <div className="w-3.5 h-3.5 rounded-full border border-[#2E3530]" />
      ) : (
        <Lock className="w-3 h-3 text-[#3D4A40]" />
      )}
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
            {year} Full-Year Consistency Badge
          </h3>
          <Badge variant="warning" className="text-[9px]">Annual Prestige</Badge>
        </div>
        <p className="text-xs text-[#5A6B5D] leading-relaxed">
          Meet your minimum commitment on every scheduled day of the year. Rest days never count against you.
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
          {earned ? (
            <>
              <Badge variant="accent">Prestige Unlocked ✓</Badge>
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
