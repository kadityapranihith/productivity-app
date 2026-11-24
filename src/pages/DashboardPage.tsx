import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Flame, Target, CheckCircle2, ArrowRight,
  TrendingUp, Sparkles, CheckCheck, BookOpen, Zap
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  Card, StatCard, SectionHeader, Badge, Button, ProgressBar
} from '@/components/ui'
import { ConsistencyHeatmap } from '@/components/heatmap/ConsistencyHeatmap'
import { useAppStore } from '@/lib/store'
import { getGreeting, getMotivationalQuote, categoryColor, todayString } from '@/lib/utils'
import type { Task, CompletionStatus } from '@/types'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

export function DashboardPage() {
  const user = useAppStore(state => state.user)
  const stats = useAppStore(state => state.stats)
  const tasks = useAppStore(state => state.tasks)
  const completions = useAppStore(state => state.completions)
  const heatmapData = useAppStore(state => state.heatmapData)
  const completeTask = useAppStore(state => state.completeTask)
  const resetToFreshAccount = useAppStore(state => state.resetToFreshAccount)

  React.useEffect(() => {
    if (user.email !== 'aditya@example.com' && stats.current_streak === 23 && stats.active_days_this_year === 87) {
      resetToFreshAccount()
    }
  }, [user.email, stats.current_streak, stats.active_days_this_year, resetToFreshAccount])

  const today = format(new Date(), 'EEEE, MMMM d')
  const todayStr = todayString()
  const greeting = getGreeting()
  const quote = getMotivationalQuote()

  const todayDayOfWeek = new Date().getDay()
  const scheduledTasks = tasks.filter(t =>
    t.is_active && (
      (t.is_recurring && t.recurring_days.includes(todayDayOfWeek)) ||
      (!t.is_recurring && t.scheduled_date === todayStr)
    )
  )

  const todayCompletions = completions.filter(c => c.date === todayStr)
  const normalCompleted = todayCompletions.filter(c => c.status === 'normal').length
  const bareCompleted = todayCompletions.filter(c => c.status === 'bare_minimum').length
  const totalCompleted = normalCompleted + bareCompleted
  const totalTasks = scheduledTasks.length
  const dailyProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <motion.div {...fadeUp} className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#5A6B5D] font-medium mb-1 tracking-wide uppercase">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0] tracking-tight">
              {greeting}, {user.display_name}.
            </h1>
            <p className="text-sm text-[#5A6B5D] mt-1.5 italic">{quote}</p>
          </div>

          {/* Top-right: Streak + CTA buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Streak pill */}
            <div className="flex items-center gap-2 bg-[#1E2220] border border-[#262C28] rounded-xl px-3.5 py-2.5">
              <Flame className="w-4 h-4 text-[#F59E0B]" />
              <div className="text-left">
                <span className="text-sm font-bold text-[#F5F5F0] block leading-none">{stats.current_streak}</span>
                <span className="text-[10px] text-[#5A6B5D] block mt-0.5 tracking-wide">day streak</span>
              </div>
            </div>

            <NavLink to="/my-day">
              <Button size="md" className="gap-2">
                <Target className="w-4 h-4" />
                Plan My Day
              </Button>
            </NavLink>

            <NavLink to="/journal">
              <Button variant="outline" size="md" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Journal
              </Button>
            </NavLink>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards — 4 grid, no duplicate streak */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3.5"
      >
        <StatCard
          label="Today's Progress"
          value={`${dailyProgress}%`}
          sub={`${totalCompleted} of ${totalTasks} done`}
          accent
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Points Today"
          value={`${stats.points_today}`}
          sub="pts earned"
          icon={<Sparkles className="w-4 h-4 text-[#C5F36B]" />}
        />
        <StatCard
          label="Status"
          value={
            totalTasks === 0
              ? 'Rest Day'
              : dailyProgress >= 100
                ? 'All Done'
                : bareCompleted > 0
                  ? 'Anchored'
                  : 'In Progress'
          }
          sub={bareCompleted > 0 || normalCompleted > 0 ? 'streak active' : 'pending'}
          icon={<CheckCheck className="w-4 h-4 text-[#4ADE80]" />}
        />
        <StatCard
          label="Total Points"
          value={`${stats.total_points}`}
          sub={`Best streak: ${stats.longest_streak}d`}
          icon={<Zap className="w-4 h-4 text-[#F59E0B]" />}
        />
      </motion.div>

      {/* Today's Commitments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-[#1E2220] border-[#262C28] overflow-hidden">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Today's Commitments" />
              <Badge variant={dailyProgress >= 100 ? 'success' : bareCompleted > 0 ? 'warning' : 'accent'}>
                {totalCompleted}/{totalTasks}
              </Badge>
            </div>
            <ProgressBar value={dailyProgress} size="md" />
          </div>

          <div className="divide-y divide-[#181B19]">
            {scheduledTasks.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center px-8">
                <div className="w-12 h-12 rounded-2xl bg-[#181B19] border border-[#262C28] flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#5A6B5D]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#8B9A8E]">Nothing scheduled today</p>
                  <p className="text-xs text-[#5A6B5D] mt-1">Set your intentions in the day planner</p>
                </div>
                <NavLink to="/my-day">
                  <Button size="sm" className="gap-1.5">
                    Plan My Day <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </NavLink>
              </div>
            ) : (
              scheduledTasks.map((task) => {
                const comp = todayCompletions.find(c => c.task_id === task.id)
                return (
                  <DashboardTaskRow
                    key={task.id}
                    task={task}
                    completionStatus={comp?.status}
                    onComplete={(lvl) => completeTask(task.id, lvl)}
                  />
                )
              })
            )}
          </div>

          <div className="px-5 py-3 border-t border-[#262C28] bg-[#181B19]/60">
            <NavLink to="/my-day" className="text-xs text-[#C5F36B] hover:underline flex items-center gap-1 font-semibold w-fit">
              Open day planner <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </Card>
      </motion.div>

      {/* Consistency Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="p-6 bg-[#1E2220] border-[#262C28]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionHeader title="Consistency" />
              <p className="text-xs text-[#5A6B5D] mt-0.5">{stats.active_days_this_year} active days this year</p>
            </div>
            <NavLink to="/consistency">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-[#C5F36B]">
                Full view <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </NavLink>
          </div>
          <div className="pt-1">
            <ConsistencyHeatmap data={heatmapData} compact />
          </div>
        </Card>
      </motion.div>

    </div>
  )
}

function DashboardTaskRow({
  task,
  completionStatus,
  onComplete
}: {
  task: Task
  completionStatus?: CompletionStatus
  onComplete: (level: CompletionStatus) => void
}) {
  const isNormal = completionStatus === 'normal'
  const isBare = completionStatus === 'bare_minimum'
  const color = categoryColor(task.category)

  return (
    <div className="flex items-center gap-4 px-5 py-4 group hover:bg-[#181B19]/50 transition-colors">
      {/* Category accent bar */}
      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-semibold truncate ${isNormal ? 'text-[#4ADE80]' : isBare ? 'text-[#F59E0B]' : 'text-[#F5F5F0]'}`}>
            {task.title}
          </span>
          {isBare && <Badge variant="warning">Bare-min</Badge>}
          {isNormal && <Badge variant="success">Done</Badge>}
        </div>
        <div className="flex items-center gap-3 text-xs text-[#5A6B5D]">
          <span>{task.normal_target}</span>
          <span className="text-[#2E3530]">·</span>
          <span className="opacity-70">{task.min_target}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {!isNormal && (
          <div className="flex gap-2">
            {!isBare && (
              <button
                onClick={() => onComplete('bare_minimum')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#252A27] text-[#8B9A8E] hover:text-[#F59E0B] hover:bg-[#2E3530] rounded-lg transition-colors border border-[#2E3530]"
              >
                Bare min
              </button>
            )}
            <button
              onClick={() => onComplete('normal')}
              className="px-3 py-1.5 text-xs font-semibold bg-[rgba(197,243,107,0.12)] text-[#C5F36B] hover:bg-[rgba(197,243,107,0.2)] rounded-lg transition-colors border border-[rgba(197,243,107,0.25)]"
            >
              {isBare ? 'Complete' : 'Complete'}
            </button>
          </div>
        )}

        {isNormal && (
          <button
            onClick={() => onComplete('none')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4ADE80] hover:text-[#F87171] hover:bg-[#252A27] rounded-lg transition-colors border border-[#262C28]"
            title="Click to undo"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done</span>
          </button>
        )}
      </div>
    </div>
  )
}
