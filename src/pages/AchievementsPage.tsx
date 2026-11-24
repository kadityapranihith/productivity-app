import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Lock, CheckCircle2, Trophy, Sparkles } from 'lucide-react'
import { Card, SectionHeader, Badge, Button } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import type { Achievement } from '@/types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const ACTIVE_DAY_MILESTONES = [50, 100, 200, 300]

export function AchievementsPage() {
  const year = new Date().getFullYear()

  // Store bindings
  const stats = useAppStore(state => state.stats)
  const achievements = useAppStore(state => state.achievements)
  const userAchievements = useAppStore(state => state.userAchievements)
  const setInspectingBadge = useAppStore(state => state.setInspectingBadge)

  const activeDays = stats.active_days_this_year
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

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Achievements & Badges</h1>
            <p className="text-sm text-[#8B9A8E] mt-1">
              Meaningful milestones only. {earnedIds.size} badge{earnedIds.size !== 1 ? 's' : ''} earned this year.
            </p>
          </div>
          <Badge variant="accent" className="px-3 py-1 text-xs">
            {activeDays} Active Days in {year}
          </Badge>
        </div>
      </motion.div>

      {/* 1. Calendar-Year Active-Day Milestones */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
        <Card className="p-5 md:p-6">
          <SectionHeader
            title={`Category A: ${year} Active-Day Milestones`}
            subtitle="Counts qualifying active days in the calendar year (both normal and bare-minimum qualify equally)"
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
          <div className="mt-5 p-3.5 bg-[#181B19] rounded-xl border border-[#262C28] flex items-center justify-between text-xs">
            <span className="text-[#8B9A8E]">
              Current status: <strong className="text-[#C5F36B]">{activeDays}</strong> active days.
            </span>
            <span className="text-[#5A6B5D]">
              Click any badge to view criteria
            </span>
          </div>
        </Card>
      </motion.div>

      {/* 2. Monthly Consistency Badges */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <Card className="p-5 md:p-6">
          <SectionHeader
            title={`Category B: ${year} Monthly Consistency Badges`}
            subtitle="Awarded for meeting your defined minimum daily commitments on every scheduled day of that calendar month"
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
      </motion.div>

      {/* 3. Full-Year Prestigious Annual Consistency Badge */}
      {yearlyAch && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-5 md:p-6">
            <SectionHeader
              title={`Category C: ${year} Full-Year Prestige Badge`}
              subtitle="The pinnacle of accountability — awarded for meeting minimum commitments on every scheduled active day of the entire year"
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
          Awarded when you meet your defined minimum daily commitments on every single scheduled active day throughout the entire calendar year. Rest days and planned non-working days do not break eligibility.
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
