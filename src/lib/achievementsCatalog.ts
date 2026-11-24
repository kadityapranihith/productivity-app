import type { Achievement } from '@/types'

/**
 * System Achievements Catalog
 * Exactly 21 platform badges:
 * 1. All-time worked: 365d, 500d, 1000d, 2000d (cumulative days from start)
 * 2. Calendar year: 50d, 100d, 200d, 300d in 2026
 * 3. Monthly consistency: Jan through Dec (streak for whole month)
 * 4. Complete Year GOAT Badge
 */
export const SYSTEM_ACHIEVEMENTS_CATALOG: Achievement[] = [
  // 1. All-Time Worked Badges (Cumulative from the start)
  {
    id: 'ach-alltime-365',
    type: 'all_time_worked',
    name: '365 Days Worked',
    description: 'Worked and completed commitments on 365 total days from the start (cumulative).',
    icon: '🏅',
    threshold: 365,
  },
  {
    id: 'ach-alltime-500',
    type: 'all_time_worked',
    name: '500 Days Worked',
    description: 'Worked and completed commitments on 500 total days from the start (cumulative).',
    icon: '💎',
    threshold: 500,
  },
  {
    id: 'ach-alltime-1000',
    type: 'all_time_worked',
    name: '1,000 Days Worked',
    description: 'Worked and completed commitments on 1,000 total days from the start (cumulative).',
    icon: '⚡',
    threshold: 1000,
  },
  {
    id: 'ach-alltime-2000',
    type: 'all_time_worked',
    name: '2,000 Days Worked',
    description: 'Worked and completed commitments on 2,000 total days from the start (cumulative).',
    icon: '🌌',
    threshold: 2000,
  },

  // 2. Calendar Year Active Days (2026)
  {
    id: 'ach-50',
    type: 'active_days_50',
    name: '50 Days Badge 2026',
    description: 'Completed your daily commitment on 50 different days in the year 2026.',
    icon: '🌱',
    threshold: 50,
    year: 2026,
  },
  {
    id: 'ach-100',
    type: 'active_days_100',
    name: '100 Days Badge 2026',
    description: 'Completed your daily commitment on 100 different days in the year 2026.',
    icon: '🌿',
    threshold: 100,
    year: 2026,
  },
  {
    id: 'ach-200',
    type: 'active_days_200',
    name: '200 Days Badge 2026',
    description: 'Completed your daily commitment on 200 different days in the year 2026.',
    icon: '🌳',
    threshold: 200,
    year: 2026,
  },
  {
    id: 'ach-300',
    type: 'active_days_300',
    name: '300 Days Badge 2026',
    description: 'Completed your daily commitment on 300 different days in the year 2026.',
    icon: '🏔️',
    threshold: 300,
    year: 2026,
  },

  // 3. Monthly Consistency Badges (Jan - Dec)
  {
    id: 'ach-jan',
    type: 'monthly_consistency',
    name: 'January Consistency',
    description: 'Maintained consistency streak for the entire month of January.',
    icon: '❄️',
    year: 2026,
    month: 1,
  },
  {
    id: 'ach-feb',
    type: 'monthly_consistency',
    name: 'February Consistency',
    description: 'Maintained consistency streak for the entire month of February.',
    icon: '💝',
    year: 2026,
    month: 2,
  },
  {
    id: 'ach-mar',
    type: 'monthly_consistency',
    name: 'March Consistency',
    description: 'Maintained consistency streak for the entire month of March.',
    icon: '🌸',
    year: 2026,
    month: 3,
  },
  {
    id: 'ach-apr',
    type: 'monthly_consistency',
    name: 'April Consistency',
    description: 'Maintained consistency streak for the entire month of April.',
    icon: '🌺',
    year: 2026,
    month: 4,
  },
  {
    id: 'ach-may',
    type: 'monthly_consistency',
    name: 'May Consistency',
    description: 'Maintained consistency streak for the entire month of May.',
    icon: '🌻',
    year: 2026,
    month: 5,
  },
  {
    id: 'ach-jun',
    type: 'monthly_consistency',
    name: 'June Consistency',
    description: 'Maintained consistency streak for the entire month of June.',
    icon: '☀️',
    year: 2026,
    month: 6,
  },
  {
    id: 'ach-jul',
    type: 'monthly_consistency',
    name: 'July Consistency',
    description: 'Maintained consistency streak for the entire month of July.',
    icon: '🌊',
    year: 2026,
    month: 7,
  },
  {
    id: 'ach-aug',
    type: 'monthly_consistency',
    name: 'August Consistency',
    description: 'Maintained consistency streak for the entire month of August.',
    icon: '🌙',
    year: 2026,
    month: 8,
  },
  {
    id: 'ach-sep',
    type: 'monthly_consistency',
    name: 'September Consistency',
    description: 'Maintained consistency streak for the entire month of September.',
    icon: '🍂',
    year: 2026,
    month: 9,
  },
  {
    id: 'ach-oct',
    type: 'monthly_consistency',
    name: 'October Consistency',
    description: 'Maintained consistency streak for the entire month of October.',
    icon: '🍁',
    year: 2026,
    month: 10,
  },
  {
    id: 'ach-nov',
    type: 'monthly_consistency',
    name: 'November Consistency',
    description: 'Maintained consistency streak for the entire month of November.',
    icon: '🌨️',
    year: 2026,
    month: 11,
  },
  {
    id: 'ach-dec',
    type: 'monthly_consistency',
    name: 'December Consistency',
    description: 'Maintained consistency streak for the entire month of December.',
    icon: '⭐',
    year: 2026,
    month: 12,
  },

  // 4. Complete Year GOAT Badge
  {
    id: 'ach-year-goat',
    type: 'complete_year_goat',
    name: '2026 Complete Year GOAT Badge',
    description: 'The pinnacle of accountability — maintained full consistency standards throughout the entire year of 2026.',
    icon: '🐐',
    year: 2026,
  },
]
