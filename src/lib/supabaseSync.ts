import { supabase } from './supabase'
import { generateUuid, fetchUserGroupsFromSupabase } from './supabaseGroups'
import { computeUserActivitySummary } from './activityStats'
import { resolveDbAchievementUuid, mapUserAchievementRows } from './supabaseAchievements'
import type {
  Task, TaskCompletion, AdditionalTask, Goal,
  JournalEntry, UserAchievement, Group, DailySummary,
  UserStats, CompletionStatus, GoalCategory, GoalPeriod,
  Notification, NotificationType
} from '@/types'
import { format } from 'date-fns'

/**
 * Ensures an ID is a valid RFC4122 v4 UUID string.
 * Legacy local IDs like 'task-173...' will be converted to valid UUIDs.
 */
export function ensureUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return generateUuid()
}

// ============================================================
// TASKS
// ============================================================

export async function syncTaskToSupabase(task: Task): Promise<boolean> {
  try {
    if (!task.user_id) return false
    const validId = ensureUuid(task.id)

    const payload = {
      id: validId,
      user_id: task.user_id,
      title: task.title,
      description: task.description || null,
      category: task.category || 'custom',
      normal_target: task.normal_target,
      normal_points: task.normal_points ?? 20,
      min_target: task.min_target,
      min_points: task.min_points ?? 10,
      is_recurring: task.is_recurring ?? true,
      recurring_days: task.recurring_days || [1, 2, 3, 4, 5],
      scheduled_date: task.scheduled_date || null,
      counts_for_consistency: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncTaskToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncTaskToSupabase exception:', err)
    return false
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  try {
    if (!taskId) return false
    // Soft-delete task by setting is_active = false
    // This removes the task from future days while preserving all historical completions,
    // streaks, points, and heatmap consistency data intact in the database.
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', taskId)
    if (error) {
      console.warn('[Sync] deleteTaskFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] deleteTaskFromSupabase exception:', err)
    return false
  }
}

// ============================================================
// TASK COMPLETIONS
// ============================================================

export async function syncTaskCompletionToSupabase(completion: TaskCompletion): Promise<boolean> {
  try {
    if (!completion.user_id) return false
    const validId = ensureUuid(completion.id)
    const validTaskId = ensureUuid(completion.task_id)

    const payload = {
      id: validId,
      task_id: validTaskId,
      user_id: completion.user_id,
      date: completion.date,
      status: completion.status,
      points_awarded: completion.points_awarded,
      notes: completion.notes || null,
      completed_at: completion.completed_at || new Date().toISOString(),
    }

    const { error } = await supabase.from('task_completions').upsert(payload, { onConflict: 'task_id,date' })
    if (error) {
      console.warn('[Sync] syncTaskCompletionToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncTaskCompletionToSupabase exception:', err)
    return false
  }
}

export async function deleteTaskCompletionFromSupabase(completionId: string): Promise<boolean> {
  try {
    if (!completionId) return false
    const { error } = await supabase.from('task_completions').delete().eq('id', completionId)
    if (error) {
      console.warn('[Sync] deleteTaskCompletionFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] deleteTaskCompletionFromSupabase exception:', err)
    return false
  }
}

// ============================================================
// ADDITIONAL (BONUS) TASKS
// ============================================================

export async function syncAdditionalTaskToSupabase(task: AdditionalTask): Promise<boolean> {
  try {
    if (!task.user_id) return false
    const validId = ensureUuid(task.id)

    const payload = {
      id: validId,
      user_id: task.user_id,
      date: task.date,
      title: task.title,
      category: task.category || 'custom',
      points: task.points || 5,
      completed: task.completed,
    }

    const { error } = await supabase.from('additional_tasks').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncAdditionalTaskToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncAdditionalTaskToSupabase exception:', err)
    return false
  }
}

export async function deleteAdditionalTaskFromSupabase(taskId: string): Promise<boolean> {
  try {
    if (!taskId) return false
    const { error } = await supabase.from('additional_tasks').delete().eq('id', taskId)
    if (error) {
      console.warn('[Sync] deleteAdditionalTaskFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] deleteAdditionalTaskFromSupabase exception:', err)
    return false
  }
}

// ============================================================
// GOALS
// ============================================================

export async function syncGoalToSupabase(goal: Goal): Promise<boolean> {
  try {
    if (!goal.user_id) return false
    const validId = ensureUuid(goal.id)

    const payload = {
      id: validId,
      user_id: goal.user_id,
      title: goal.title,
      description: goal.description || null,
      category: goal.category || 'custom',
      period: goal.period || 'monthly',
      target_value: goal.target_value,
      current_value: goal.current_value || 0,
      unit: goal.unit || '%',  // '%' = no-target sentinel
      deadline: goal.deadline || null,
      is_shared: goal.is_shared ?? false,
      is_completed: goal.is_completed ?? false,
      created_at: goal.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('goals').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.error('[Sync] syncGoalToSupabase error:', error.code, error.message, error.details)
      return false
    }
    return true
  } catch (err) {
    console.error('[Sync] syncGoalToSupabase exception:', err)
    return false
  }
}

export async function deleteGoalFromSupabase(goalId: string): Promise<boolean> {
  try {
    if (!goalId) return false
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) {
      console.warn('[Sync] deleteGoalFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] deleteGoalFromSupabase exception:', err)
    return false
  }
}

// ============================================================
// JOURNAL ENTRIES
// ============================================================

export async function syncJournalEntryToSupabase(entry: JournalEntry): Promise<boolean> {
  try {
    if (!entry.user_id) return false
    const validId = ensureUuid(entry.id)

    const payload = {
      id: validId,
      user_id: entry.user_id,
      date: entry.date,
      title: entry.title || null,
      content: entry.content,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('journal_entries').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncJournalEntryToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncJournalEntryToSupabase exception:', err)
    return false
  }
}

export async function deleteJournalEntryFromSupabase(entryId: string): Promise<boolean> {
  try {
    if (!entryId) return false
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId)
    if (error) {
      console.warn('[Sync] deleteJournalEntryFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] deleteJournalEntryFromSupabase exception:', err)
    return false
  }
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export async function syncUserAchievementToSupabase(ua: UserAchievement): Promise<boolean> {
  try {
    if (!ua.user_id) return false
    const validId = ensureUuid(ua.id)

    const basePayload = {
      id: validId,
      user_id: ua.user_id,
      achievement_id: ua.achievement_id,
      earned_at: ua.earned_at || new Date().toISOString(),
      year: ua.year ?? null,
      month: ua.month ?? null,
    }

    const { error } = await supabase.from('user_achievements').upsert(basePayload, { onConflict: 'id' })
    if (!error) return true

    // Fallback when live DB still enforces UUID/FK on user_achievements.achievement_id
    if (error.code === '22P02' || error.code === '23503') {
      const dbUuid = await resolveDbAchievementUuid(ua.achievement_id, ua.year, ua.month)
      if (dbUuid) {
        const { error: retryErr } = await supabase
          .from('user_achievements')
          .upsert({ ...basePayload, achievement_id: dbUuid }, { onConflict: 'id' })
        if (!retryErr) return true
        console.warn('[Sync] syncUserAchievementToSupabase retry error:', retryErr.message)
        return false
      }
    }

    console.warn('[Sync] syncUserAchievementToSupabase error:', error.message)
    return false
  } catch (err) {
    console.warn('[Sync] syncUserAchievementToSupabase exception:', err)
    return false
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function syncNotificationToSupabase(notif: Notification): Promise<boolean> {
  try {
    if (!notif.user_id) return false
    const validId = ensureUuid(notif.id)

    const payload = {
      id: validId,
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      read: notif.read ?? false,
      data: notif.data ?? null,
      created_at: notif.created_at || new Date().toISOString(),
    }

    const { error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncNotificationToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncNotificationToSupabase exception:', err)
    return false
  }
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<boolean> {
  try {
    if (!notificationId) return false
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    if (error) {
      console.warn('[Sync] markNotificationReadInSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] markNotificationReadInSupabase exception:', err)
    return false
  }
}

export async function markAllNotificationsReadInSupabase(userId: string): Promise<boolean> {
  try {
    if (!userId) return false
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) {
      console.warn('[Sync] markAllNotificationsReadInSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] markAllNotificationsReadInSupabase exception:', err)
    return false
  }
}

// ============================================================
// COMPLETE USER CLOUD HYDRATION
// Fetches all user data across all features from Supabase on login
// ============================================================

export interface UserCloudData {
  tasks: Task[]
  completions: TaskCompletion[]
  additionalTasks: AdditionalTask[]
  goals: Goal[]
  journalEntries: JournalEntry[]
  userAchievements: UserAchievement[]
  notifications: Notification[]
  groups: Group[]
  heatmapData: DailySummary[]
  stats: UserStats
}

export async function fetchUserCloudData(userId: string): Promise<UserCloudData | null> {
  try {
    if (!userId) return null

    // 1. Fetch user tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    const tasks: Task[] = (tasksData || []).map((r, idx) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || undefined,
      category: (r.category || 'custom') as GoalCategory,
      normal_target: r.normal_target,
      normal_points: r.normal_points ?? 20,
      min_target: r.min_target,
      min_points: r.min_points ?? 10,
      is_recurring: r.is_recurring ?? true,
      recurring_days: r.recurring_days || [1, 2, 3, 4, 5],
      scheduled_date: r.scheduled_date || undefined,
      counts_for_consistency: r.counts_for_consistency ?? true,
      is_active: r.is_active ?? true,
      sort_order: r.sort_order ?? idx,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
    }))

    // 2. Fetch task completions
    const { data: compData } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    const completions: TaskCompletion[] = (compData || []).map(r => ({
      id: r.id,
      task_id: r.task_id,
      user_id: r.user_id,
      date: r.date,
      status: r.status as CompletionStatus,
      points_awarded: r.points_awarded,
      notes: r.notes || undefined,
      completed_at: r.completed_at || new Date().toISOString(),
    }))

    // 3. Fetch additional tasks (all completed for points + today's list for UI)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const [{ data: addData }, { data: completedAddData }] = await Promise.all([
      supabase
        .from('additional_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .order('created_at', { ascending: true }),
      supabase
        .from('additional_tasks')
        .select('date, points, completed')
        .eq('user_id', userId)
        .eq('completed', true),
    ])

    const additionalTasks: AdditionalTask[] = (addData || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      date: r.date,
      title: r.title,
      category: (r.category || 'custom') as GoalCategory,
      points: r.points ?? 5,
      completed: r.completed ?? false,
      created_at: r.created_at || new Date().toISOString(),
    }))

    // 4. Fetch goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const goals: Goal[] = (goalsData || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || undefined,
      category: (r.category || 'custom') as GoalCategory,
      period: (r.period || 'monthly') as GoalPeriod,
      target_value: Number(r.target_value),
      current_value: Number(r.current_value ?? 0),
      unit: r.unit || '%',  // '%' = no-target sentinel; never default to 'units'
      deadline: r.deadline || undefined,
      is_shared: r.is_shared ?? false,
      is_completed: r.is_completed ?? false,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
    }))

    // 5. Fetch journal entries
    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    const journalEntries: JournalEntry[] = (journalData || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      date: r.date,
      title: r.title || undefined,
      content: r.content,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
    }))

    // 6. Fetch user achievements & notifications
    const [{ data: achData }, { data: notifData }] = await Promise.all([
      supabase.from('user_achievements').select('*').eq('user_id', userId),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const userAchievements: UserAchievement[] = await mapUserAchievementRows(achData || [])
    const notifications: Notification[] = (notifData || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      type: r.type as NotificationType,
      title: r.title,
      body: r.body,
      read: r.read ?? false,
      data: r.data || undefined,
      created_at: r.created_at || new Date().toISOString(),
    }))

    // 7. Fetch all groups user belongs to (memberships + created) with accurate member counts
    const groups = await fetchUserGroupsFromSupabase(userId)

    // 8 & 9. Reconstruct heatmapData and compute aggregate stats
    const { heatmapData, stats } = computeUserActivitySummary(
      tasks.length,
      completions,
      completedAddData || []
    )

    return {
      tasks,
      completions,
      additionalTasks,
      goals,
      journalEntries,
      userAchievements,
      notifications,
      groups,
      heatmapData,
      stats,
    }
  } catch (err) {
    console.warn('[Sync] fetchUserCloudData exception:', err)
    return null
  }
}
