// Mock data for UI development
// Replace with real Supabase queries once backend is configured

import type {
  User, Task, TaskCompletion, DailySummary, Goal, UserAchievement,
  Achievement, Group, GroupMember, GroupLeaderboardEntry,
  Announcement, JournalEntry, Notification, UserStats, PointTransaction
} from '@/types'
import { format, subDays } from 'date-fns'

export const mockUser: User = {
  id: 'user-1',
  email: 'aditya@example.com',
  display_name: 'Aditya',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya',
  bio: 'Building, learning, and growing — one day at a time.',
  interests: ['coding', 'fitness', 'reading'],
  created_at: '2026-01-01T00:00:00Z',
}

export const mockStats: UserStats = {
  current_streak: 23,
  longest_streak: 47,
  active_days_this_year: 87,
  total_points: 2340,
  points_today: 15,
  points_this_week: 68,
  points_this_month: 234,
}

export const mockTasks: Task[] = [
  {
    id: 't1',
    user_id: 'user-1',
    title: 'DSA Practice',
    description: 'Solve LeetCode problems',
    category: 'coding',
    normal_target: 'Solve 3 problems',
    normal_points: 5,
    min_target: 'Solve 1 problem',
    min_points: 2,
    is_recurring: true,
    recurring_days: [1, 2, 3, 4, 5],
    counts_for_consistency: true,
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't2',
    user_id: 'user-1',
    title: 'Morning Run',
    description: 'Outdoor running',
    category: 'fitness',
    normal_target: 'Run 5 km',
    normal_points: 5,
    min_target: 'Run 1 km',
    min_points: 2,
    is_recurring: true,
    recurring_days: [1, 2, 3, 4, 5, 6],
    counts_for_consistency: true,
    is_active: true,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't3',
    user_id: 'user-1',
    title: 'Reading',
    description: 'Read books',
    category: 'reading',
    normal_target: 'Read 20 pages',
    normal_points: 5,
    min_target: 'Read 5 pages',
    min_points: 2,
    is_recurring: true,
    recurring_days: [0, 1, 2, 3, 4, 5, 6],
    counts_for_consistency: true,
    is_active: true,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't4',
    user_id: 'user-1',
    title: 'System Design Study',
    description: 'Study system design concepts',
    category: 'education',
    normal_target: 'Study for 1 hour',
    normal_points: 5,
    min_target: 'Review notes for 20 min',
    min_points: 2,
    is_recurring: true,
    recurring_days: [1, 3, 5],
    counts_for_consistency: false,
    is_active: true,
    sort_order: 4,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

export const mockTodayCompletions: TaskCompletion[] = [
  {
    id: 'c1',
    task_id: 't2',
    user_id: 'user-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'normal',
    points_awarded: 5,
    completed_at: new Date().toISOString(),
  },
]

// Generate heatmap data for the year
function generateHeatmapData(): DailySummary[] {
  const summaries: DailySummary[] = []
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  for (let d = new Date(startOfYear); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, 'yyyy-MM-dd')
    const rand = Math.random()
    let status: DailySummary['status'] = 'none'
    let normalCompleted = 0
    let bareCompleted = 0
    let points = 0
    let qualifies = false

    if (rand > 0.25) {
      if (rand > 0.6) {
        status = 'normal'
        normalCompleted = 3
        bareCompleted = 0
        points = 15
        qualifies = true
      } else {
        status = 'bare_minimum'
        normalCompleted = 1
        bareCompleted = 2
        points = 9
        qualifies = true
      }
    }

    summaries.push({
      date: dateStr,
      status,
      normal_completed: normalCompleted,
      bare_completed: bareCompleted,
      total_tasks: 3,
      points_earned: points,
      qualifies_for_consistency: qualifies,
    })
  }
  return summaries
}

export const mockHeatmapData = generateHeatmapData()

export const mockAchievements: Achievement[] = [
  {
    id: 'ach-50',
    type: 'active_days_50',
    name: '50 Active Days',
    description: 'Completed your daily commitment on 50 different days this year.',
    icon: '🌱',
    threshold: 50,
  },
  {
    id: 'ach-100',
    type: 'active_days_100',
    name: '100 Active Days',
    description: 'Completed your daily commitment on 100 different days this year.',
    icon: '🌿',
    threshold: 100,
  },
  {
    id: 'ach-200',
    type: 'active_days_200',
    name: '200 Active Days',
    description: 'Completed your daily commitment on 200 different days this year.',
    icon: '🌳',
    threshold: 200,
  },
  {
    id: 'ach-300',
    type: 'active_days_300',
    name: '300 Active Days',
    description: 'Completed your daily commitment on 300 different days this year.',
    icon: '🏔️',
    threshold: 300,
  },
  {
    id: 'ach-jan',
    type: 'monthly_consistency',
    name: 'January Consistency',
    description: 'Met your minimum commitments every scheduled day in January.',
    icon: '❄️',
    year: 2026,
    month: 1,
  },
  {
    id: 'ach-feb',
    type: 'monthly_consistency',
    name: 'February Consistency',
    description: 'Met your minimum commitments every scheduled day in February.',
    icon: '💝',
    year: 2026,
    month: 2,
  },
  {
    id: 'ach-mar',
    type: 'monthly_consistency',
    name: 'March Consistency',
    description: 'Met your minimum commitments every scheduled day in March.',
    icon: '🌸',
    year: 2026,
    month: 3,
  },
  {
    id: 'ach-apr',
    type: 'monthly_consistency',
    name: 'April Consistency',
    description: 'Met your minimum commitments every scheduled day in April.',
    icon: '🌺',
    year: 2026,
    month: 4,
  },
  {
    id: 'ach-year',
    type: 'full_year_consistency',
    name: '2026 Full Year',
    description: 'Met your minimum commitments on every scheduled day in 2026.',
    icon: '👑',
    year: 2026,
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `ach-month-${i + 5}`,
    type: 'monthly_consistency' as const,
    name: `${['May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]} Consistency`,
    description: `Met your minimum commitments every scheduled day in ${['May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]}.`,
    icon: ['🌻', '☀️', '🌊', '🌙', '🍂', '🍁', '🌨️', '⭐'][i],
    year: 2026,
    month: i + 5,
  })),
]

export const mockUserAchievements: UserAchievement[] = [
  {
    id: 'ua1',
    user_id: 'user-1',
    achievement_id: 'ach-50',
    earned_at: '2026-02-20T10:00:00Z',
    year: 2026,
  },
  {
    id: 'ua2',
    user_id: 'user-1',
    achievement_id: 'ach-jan',
    earned_at: '2026-01-31T23:59:00Z',
    year: 2026,
    month: 1,
  },
  {
    id: 'ua3',
    user_id: 'user-1',
    achievement_id: 'ach-feb',
    earned_at: '2026-02-28T23:59:00Z',
    year: 2026,
    month: 2,
  },
  {
    id: 'ua4',
    user_id: 'user-1',
    achievement_id: 'ach-mar',
    earned_at: '2026-03-31T23:59:00Z',
    year: 2026,
    month: 3,
  },
]

export const mockGoals: Goal[] = [
  {
    id: 'g1',
    user_id: 'user-1',
    title: 'Solve 500 DSA Problems',
    description: 'Complete 500 LeetCode problems throughout the year',
    category: 'coding',
    period: 'yearly',
    target_value: 500,
    current_value: 187,
    unit: 'problems',
    deadline: '2026-12-31',
    is_shared: true,
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'g2',
    user_id: 'user-1',
    title: 'Read 12 Books',
    description: 'Read one book per month',
    category: 'reading',
    period: 'yearly',
    target_value: 12,
    current_value: 9,
    unit: 'books',
    deadline: '2026-12-31',
    is_shared: false,
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'g3',
    user_id: 'user-1',
    title: 'Run 500 km',
    description: 'Total running distance for the year',
    category: 'fitness',
    period: 'yearly',
    target_value: 500,
    current_value: 320,
    unit: 'km',
    deadline: '2026-12-31',
    is_shared: true,
    is_completed: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'g4',
    user_id: 'user-1',
    title: 'Complete System Design Course',
    description: 'Finish Grokking System Design',
    category: 'education',
    period: 'monthly',
    target_value: 100,
    current_value: 70,
    unit: '%',
    deadline: '2026-11-30',
    is_shared: false,
    is_completed: false,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-20T00:00:00Z',
  },
]

export const mockGroups: Group[] = [
  {
    id: 'grp1',
    name: 'The Grind Collective',
    description: 'A small group of ambitious people building, learning, and growing together.',
    avatar_url: undefined,
    visibility: 'private',
    invite_code: 'GRIND2026',
    created_by: 'user-1',
    member_count: 5,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'grp2',
    name: 'CS Placement Prep',
    description: 'DSA, system design, and interview preparation.',
    visibility: 'restricted',
    invite_code: 'CSPLACE',
    created_by: 'user-2',
    member_count: 12,
    created_at: '2026-03-01T00:00:00Z',
  },
]

export const mockLeaderboard: GroupLeaderboardEntry[] = [
  {
    user_id: 'user-3',
    display_name: 'Ram',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ram',
    points: 2890,
    rank: 1,
    streak: 45,
    active_days: 102,
  },
  {
    user_id: 'user-1',
    display_name: 'Aditya',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya',
    points: 2340,
    rank: 2,
    streak: 23,
    active_days: 87,
  },
  {
    user_id: 'user-4',
    display_name: 'Priya',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    points: 2100,
    rank: 3,
    streak: 18,
    active_days: 79,
  },
  {
    user_id: 'user-5',
    display_name: 'Rahul',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    points: 1750,
    rank: 4,
    streak: 12,
    active_days: 65,
  },
  {
    user_id: 'user-6',
    display_name: 'Sneha',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    points: 1200,
    rank: 5,
    streak: 7,
    active_days: 45,
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann1',
    group_id: 'grp1',
    user_id: 'user-3',
    content: '🎉 Ram completed his October Consistency Badge!',
    type: 'achievement',
    created_at: subDays(new Date(), 5).toISOString(),
    user: { display_name: 'Ram', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ram' },
  },
  {
    id: 'ann2',
    group_id: 'grp1',
    user_id: 'user-1',
    content: '🏆 Aditya unlocked the 50 Active Days achievement for 2026!',
    type: 'milestone',
    created_at: subDays(new Date(), 12).toISOString(),
    user: { display_name: 'Aditya', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya' },
  },
  {
    id: 'ann3',
    group_id: 'grp1',
    user_id: 'user-4',
    content: '🔥 Priya earned the September Consistency Badge!',
    type: 'achievement',
    created_at: subDays(new Date(), 20).toISOString(),
    user: { display_name: 'Priya', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  },
]

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'j1',
    user_id: 'user-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    title: 'A productive Monday',
    content: `## What did I accomplish today?\n\nSolved 3 LeetCode problems — two mediums and one easy. Went for a 5km run in the morning before work. Read 25 pages of Atomic Habits.\n\n## What went well?\n\nThe morning routine is finally clicking. Getting up at 6 AM without an alarm.\n\n## What could I improve?\n\nNeed to spend more focused time on system design — kept getting distracted.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'j2',
    user_id: 'user-1',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    title: 'Tough day, but showed up',
    content: `## What did I accomplish today?\n\nOnly solved 1 problem today — was exhausted after a long meeting. Still did my minimum run of 1 km. Read 5 pages.\n\n## What went well?\n\nShowed up even when motivation was low. That's the point.\n\n## What should I focus on tomorrow?\n\nGet back to the full routine. Early sleep tonight.`,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
  },
]

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    user_id: 'user-1',
    type: 'group_announcement',
    title: 'Ram completed October Consistency!',
    body: 'Your friend Ram just earned the October Consistency Badge.',
    read: false,
    created_at: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'n2',
    user_id: 'user-1',
    type: 'achievement_unlocked',
    title: '50 Active Days achieved!',
    body: 'You\'ve completed your daily commitment on 50 days this year.',
    read: true,
    created_at: subDays(new Date(), 12).toISOString(),
  },
]

export const mockPointTransactions: PointTransaction[] = [
  {
    id: 'pt1',
    user_id: 'user-1',
    points: 5,
    reason: 'Morning Run — Normal completion',
    task_id: 't2',
    date: format(new Date(), 'yyyy-MM-dd'),
    created_at: new Date().toISOString(),
  },
  {
    id: 'pt2',
    user_id: 'user-1',
    points: 5,
    reason: 'DSA Practice — Normal completion',
    task_id: 't1',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'pt3',
    user_id: 'user-1',
    points: 2,
    reason: 'Reading — Bare minimum completion',
    task_id: 't3',
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    created_at: subDays(new Date(), 1).toISOString(),
  },
]
