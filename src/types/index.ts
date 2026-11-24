// Core types for Barely Productive

export type GoalCategory =
  | 'education'
  | 'coding'
  | 'fitness'
  | 'health'
  | 'reading'
  | 'career'
  | 'projects'
  | 'custom';

export type CompletionStatus = 'none' | 'bare_minimum' | 'normal';

export type GroupVisibility = 'public' | 'restricted' | 'private';

export type GroupRole = 'admin' | 'member';

export type AchievementType =
  | 'all_time_worked'
  | 'active_days_50'
  | 'active_days_100'
  | 'active_days_200'
  | 'active_days_300'
  | 'monthly_consistency'
  | 'complete_year_goat'
  | 'full_year_consistency';

export type NotificationType =
  | 'achievement_unlocked'
  | 'monthly_badge'
  | 'yearly_milestone'
  | 'group_announcement'
  | 'group_join_request'
  | 'group_invitation'
  | 'daily_reminder'
  | 'weekly_summary';

export type GoalPeriod = 'weekly' | 'monthly' | 'yearly' | 'lifetime';

// User & Profile
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  interests: GoalCategory[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  interests: GoalCategory[];
  // Privacy settings
  show_heatmap: boolean;
  show_badges: boolean;
  show_streak: boolean;
  show_points: boolean;
  show_goals: boolean;
  announce_achievements: boolean;
  created_at: string;
  updated_at: string;
}

// Tasks
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  // Normal target
  normal_target: string;
  normal_points: number;
  // Bare minimum target
  min_target: string;
  min_points: number;
  // Scheduling
  is_recurring: boolean;
  recurring_days: number[]; // 0=Sun, 1=Mon, ...6=Sat
  scheduled_date?: string; // For one-off tasks
  // Flags
  counts_for_consistency: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  status: CompletionStatus;
  points_awarded: number;
  notes?: string;
  completed_at: string;
}

export interface AdditionalTask {
  id: string;
  user_id: string;
  date: string;
  title: string;
  category: GoalCategory;
  points: number;
  completed: boolean;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  task_id?: string;
  achievement_id?: string;
  date: string;
  created_at: string;
}

// Daily summary (computed)
export interface DailySummary {
  date: string;
  status: CompletionStatus;
  normal_completed: number;
  bare_completed: number;
  total_tasks: number;
  points_earned: number;
  qualifies_for_consistency: boolean;
}

// Goals
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  period: GoalPeriod;
  target_value: number;
  current_value: number;
  unit?: string;
  deadline?: string;
  is_shared: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Achievements
export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  year?: number;
  month?: number; // 1-12
  threshold?: number; // For active_days milestones
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  year?: number;
  month?: number;
  achievement?: Achievement;
}

// Groups
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  visibility: GroupVisibility;
  invite_code?: string;
  created_by: string;
  creator_email?: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: UserProfile;
}

export interface GroupLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
  streak: number;
  active_days: number;
}

export interface Announcement {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  type: 'achievement' | 'milestone' | 'general';
  created_at: string;
  user?: Pick<UserProfile, 'display_name' | 'avatar_url'>;
}

// Journal
export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title?: string;
  content: string; // markdown
  created_at: string;
  updated_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// Stats (computed)
export interface UserStats {
  current_streak: number;
  longest_streak: number;
  active_days_this_year: number;
  all_time_active_days?: number;
  total_points: number;
  points_today: number;
  points_this_week: number;
  points_this_month: number;
}
