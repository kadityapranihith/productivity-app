import React, { useState } from 'react'
import { format, startOfYear, eachDayOfInterval, getDay, parseISO } from 'date-fns'
import { cn, todayString } from '@/lib/utils'
import type { DailySummary } from '@/types'

interface ConsistencyHeatmapProps {
  data: DailySummary[]
  year?: number
  compact?: boolean
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function ConsistencyHeatmap({ data, year, compact = false }: ConsistencyHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ summary: DailySummary; x: number; y: number } | null>(null)
  const currentYear = year ?? new Date().getFullYear()
  const today = todayString()

  // Build lookup map
  const dataMap = new Map<string, DailySummary>()
  data.forEach(d => dataMap.set(d.date, d))

  // All days of the year
  const startDate = new Date(currentYear, 0, 1)
  const endDate = compact ? new Date() : new Date(currentYear, 11, 31)
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Pad start to first Sunday
  const startDayOfWeek = getDay(startDate) // 0=Sun
  const paddedDays: (Date | null)[] = [...Array(startDayOfWeek).fill(null), ...allDays]

  // Group into weeks (columns)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  // Find month label positions
  const monthPositions: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const firstRealDay = week.find(d => d !== null)
    if (firstRealDay) {
      const month = firstRealDay.getMonth()
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], col })
        lastMonth = month
      }
    }
  })

  const cellSize = compact ? 10 : 11
  const gap = compact ? 1.5 : 2
  const unit = cellSize + gap

  return (
    <div className="relative overflow-x-auto">
      {/* Month labels */}
      <div className="relative mb-1" style={{ paddingLeft: compact ? 0 : 24 }}>
        <div className="flex" style={{ gap: `${gap}px` }}>
          {weeks.map((_, col) => {
            const mp = monthPositions.find(m => m.col === col)
            return (
              <div
                key={col}
                className="text-[9px] text-[#5A6B5D] font-medium"
                style={{ width: cellSize, minWidth: cellSize, flexShrink: 0 }}
              >
                {mp?.label ?? ''}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-0.5">
        {/* Day-of-week labels */}
        {!compact && (
          <div className="flex flex-col mr-1" style={{ gap: `${gap}px` }}>
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                className="text-[9px] text-[#5A6B5D] font-medium flex items-center justify-end"
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
              >
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex" style={{ gap: `${gap}px` }}>
          {weeks.map((week, col) => (
            <div key={col} className="flex flex-col" style={{ gap: `${gap}px` }}>
              {week.map((day, row) => {
                if (!day) return <div key={row} style={{ width: cellSize, height: cellSize }} />
                const dateStr = format(day, 'yyyy-MM-dd')
                const summary = dataMap.get(dateStr)
                const isToday = dateStr === today
                const isFuture = dateStr > today

                let colorClass = 'heatmap-empty'
                if (!isFuture && summary) {
                  if (summary.status === 'normal') colorClass = 'heatmap-normal'
                  else if (summary.status === 'bare_minimum') colorClass = 'heatmap-bare'
                }

                return (
                  <div
                    key={row}
                    className={cn('heatmap-day', colorClass, isToday && 'heatmap-today')}
                    style={{ width: cellSize, height: cellSize }}
                    onMouseEnter={(e) => {
                      if (summary || isToday) {
                        setTooltip({
                          summary: summary ?? {
                            date: dateStr,
                            status: 'none',
                            normal_completed: 0,
                            bare_completed: 0,
                            total_tasks: 0,
                            points_earned: 0,
                            qualifies_for_consistency: false,
                          },
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <HeatmapTooltip summary={tooltip.summary} />
        </div>
      )}
    </div>
  )
}

function HeatmapTooltip({ summary }: { summary: DailySummary }) {
  const date = parseISO(summary.date)
  const statusLabel = summary.status === 'normal'
    ? 'Full completion'
    : summary.status === 'bare_minimum'
      ? 'Bare minimum'
      : 'No activity'

  return (
    <div className="bg-[#252A27] border border-[#2E3530] rounded-lg p-3 shadow-xl min-w-[160px]">
      <p className="text-xs font-semibold text-[#F5F5F0] mb-1.5">
        {format(date, 'EEEE, MMM d, yyyy')}
      </p>
      <p className="text-xs text-[#8B9A8E] mb-2">{statusLabel}</p>
      {summary.total_tasks > 0 && (
        <div className="space-y-0.5 text-[10px] text-[#5A6B5D]">
          <p>Full targets: {summary.normal_completed}</p>
          <p>Bare-minimum: {summary.bare_completed}</p>
          <p>Points earned: {summary.points_earned}</p>
          {summary.qualifies_for_consistency && (
            <p className="text-[#C5F36B] mt-1">Counts for consistency</p>
          )}
        </div>
      )}
    </div>
  )
}
