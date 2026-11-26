import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns'
import type { CompletionStatus, DailySummary, UserStats } from '@/types'

export interface ActivityCompletionRow {
  date: string
  status?: string
  points_awarded?: number
}

export interface ActivityAdditionalRow {
  date: string
  points?: number
  completed?: boolean
}

/**
 * Computes daily heatmap summaries and aggregate stats from raw task completion
 * and completed additional-task rows without requiring private titles or notes.
 */
export function computeUserActivitySummary(
  activeTaskCount: number,
  completions: ActivityCompletionRow[],
  completedAdditionalTasks: ActivityAdditionalRow[] = []
): { heatmapData: DailySummary[]; stats: UserStats } {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')
  const currentYearPrefix = `${today.getFullYear()}-`
  const currentMonthPrefix = format(today, 'yyyy-MM-')
  const weekCutoffStr = format(subDays(today, 6), 'yyyy-MM-dd')

  const dateMap = new Map<string, ActivityCompletionRow[]>()
  completions.forEach(c => {
    if (!c.date) return
    const existing = dateMap.get(c.date) || []
    existing.push(c)
    dateMap.set(c.date, existing)
  })

  const totalPossible = activeTaskCount * 20
  const heatmapData: DailySummary[] = Array.from(dateMap.entries())
    .map(([date, comps]) => {
      const pts = comps.reduce((acc, c) => acc + (c.points_awarded || 0), 0)
      const status: CompletionStatus =
        pts === 0
          ? 'none'
          : totalPossible > 0 && pts > totalPossible * 0.5
            ? 'normal'
            : 'bare_minimum'
      const normalCount = comps.filter(c => c.status === 'normal').length
      const bareCount = comps.filter(c => c.status === 'bare_minimum').length

      return {
        date,
        status,
        normal_completed: normalCount,
        bare_completed: bareCount,
        total_tasks: Math.max(activeTaskCount, comps.length),
        points_earned: pts,
        qualifies_for_consistency: status !== 'none',
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Qualifying dates for streaks and active-day counts
  const qualifyingDates = heatmapData
    .filter(d => d.qualifies_for_consistency)
    .map(d => d.date)
  const qualifyingSet = new Set(qualifyingDates)
  const activeDaysThisYear = qualifyingDates.filter(d => d.startsWith(currentYearPrefix)).length

  // Current streak: consecutive qualifying calendar days ending today or yesterday
  let currentStreak = 0
  let cursor: Date | null = qualifyingSet.has(todayStr)
    ? today
    : qualifyingSet.has(yesterdayStr)
      ? subDays(today, 1)
      : null

  while (cursor && qualifyingSet.has(format(cursor, 'yyyy-MM-dd'))) {
    currentStreak++
    cursor = subDays(cursor, 1)
  }

  // Longest streak across all recorded qualifying dates
  let longestStreak = 0
  let run = 0
  for (let i = 0; i < qualifyingDates.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const diff = differenceInCalendarDays(parseISO(qualifyingDates[i]), parseISO(qualifyingDates[i - 1]))
      run = diff === 1 ? run + 1 : 1
    }
    if (run > longestStreak) longestStreak = run
  }

  // Points totals (task completions + completed additional tasks)
  let totalPoints = 0
  let pointsToday = 0
  let pointsThisWeek = 0
  let pointsThisMonth = 0

  const accumulatePoints = (date: string, pts: number) => {
    totalPoints += pts
    if (date === todayStr) pointsToday += pts
    if (date >= weekCutoffStr && date <= todayStr) pointsThisWeek += pts
    if (date.startsWith(currentMonthPrefix)) pointsThisMonth += pts
  }

  completions.forEach(c => {
    if (c.date) accumulatePoints(c.date, c.points_awarded || 0)
  })
  completedAdditionalTasks.forEach(a => {
    if (a.date && a.completed !== false) accumulatePoints(a.date, a.points ?? 5)
  })

  return {
    heatmapData,
    stats: {
      current_streak: currentStreak,
      longest_streak: Math.max(longestStreak, currentStreak),
      active_days_this_year: activeDaysThisYear,
      total_points: totalPoints,
      points_today: pointsToday,
      points_this_week: pointsThisWeek,
      points_this_month: pointsThisMonth,
    },
  }
}
