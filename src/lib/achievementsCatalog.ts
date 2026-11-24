import type { Achievement } from '@/types'

/**
 * System Achievements Catalog
 * Exactly 21 platform badges dynamically generated for the current year:
 * 1. All-time worked: 365d, 500d, 1000d, 2000d (cumulative days from start)
 * 2. Calendar year: 50d, 100d, 200d, 300d in current year
 * 3. Monthly consistency: Jan through Dec (streak for whole month)
 * 4. Complete Year GOAT Badge
 */
export function getSystemAchievementsCatalog(year: number = new Date().getFullYear()): Achievement[] {
  return [
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

    // 2. Calendar Year Active Days (Dynamic Year)
    {
      id: 'ach-50',
      type: 'active_days_50',
      name: `50 Days Badge (${year})`,
      description: `Completed your daily commitment on 50 different days in the year ${year}.`,
      icon: '🌱',
      threshold: 50,
      year,
    },
    {
      id: 'ach-100',
      type: 'active_days_100',
      name: `100 Days Badge (${year})`,
      description: `Completed your daily commitment on 100 different days in the year ${year}.`,
      icon: '🌿',
      threshold: 100,
      year,
    },
    {
      id: 'ach-200',
      type: 'active_days_200',
      name: `200 Days Badge (${year})`,
      description: `Completed your daily commitment on 200 different days in the year ${year}.`,
      icon: '🌳',
      threshold: 200,
      year,
    },
    {
      id: 'ach-300',
      type: 'active_days_300',
      name: `300 Days Badge (${year})`,
      description: `Completed your daily commitment on 300 different days in the year ${year}.`,
      icon: '🏔️',
      threshold: 300,
      year,
    },

    // 3. Monthly Consistency Badges (Jan - Dec)
    {
      id: 'ach-jan',
      type: 'monthly_consistency',
      name: `January Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of January ${year}.`,
      icon: '❄️',
      year,
      month: 1,
    },
    {
      id: 'ach-feb',
      type: 'monthly_consistency',
      name: `February Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of February ${year}.`,
      icon: '💝',
      year,
      month: 2,
    },
    {
      id: 'ach-mar',
      type: 'monthly_consistency',
      name: `March Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of March ${year}.`,
      icon: '🌸',
      year,
      month: 3,
    },
    {
      id: 'ach-apr',
      type: 'monthly_consistency',
      name: `April Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of April ${year}.`,
      icon: '🌺',
      year,
      month: 4,
    },
    {
      id: 'ach-may',
      type: 'monthly_consistency',
      name: `May Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of May ${year}.`,
      icon: '🌻',
      year,
      month: 5,
    },
    {
      id: 'ach-jun',
      type: 'monthly_consistency',
      name: `June Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of June ${year}.`,
      icon: '☀️',
      year,
      month: 6,
    },
    {
      id: 'ach-jul',
      type: 'monthly_consistency',
      name: `July Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of July ${year}.`,
      icon: '🌊',
      year,
      month: 7,
    },
    {
      id: 'ach-aug',
      type: 'monthly_consistency',
      name: `August Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of August ${year}.`,
      icon: '🌙',
      year,
      month: 8,
    },
    {
      id: 'ach-sep',
      type: 'monthly_consistency',
      name: `September Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of September ${year}.`,
      icon: '🍂',
      year,
      month: 9,
    },
    {
      id: 'ach-oct',
      type: 'monthly_consistency',
      name: `October Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of October ${year}.`,
      icon: '🍁',
      year,
      month: 10,
    },
    {
      id: 'ach-nov',
      type: 'monthly_consistency',
      name: `November Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of November ${year}.`,
      icon: '🌨️',
      year,
      month: 11,
    },
    {
      id: 'ach-dec',
      type: 'monthly_consistency',
      name: `December Consistency (${year})`,
      description: `Maintained consistency streak for the entire month of December ${year}.`,
      icon: '⭐',
      year,
      month: 12,
    },

    // 4. Complete Year GOAT Badge
    {
      id: 'ach-year-goat',
      type: 'complete_year_goat',
      name: `${year} Complete Year GOAT Badge`,
      description: `The pinnacle of accountability — maintained full consistency standards throughout the entire year of ${year}.`,
      icon: '🐐',
      year,
    },
  ]
}

export const SYSTEM_ACHIEVEMENTS_CATALOG: Achievement[] = getSystemAchievementsCatalog()
