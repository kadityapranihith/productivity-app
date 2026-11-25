import { supabase } from './supabase'
import { generateUuid, fetchUserGroupsFromSupabase } from './supabaseGroups'
import type {
  Task, TaskCompletion, AdditionalTask, Goal,
  JournalEntry, UserAchievement, Group, DailySummary,
  UserStats, CompletionStatus, GoalCategory, GoalPeriod
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
      unit: goal.unit || 'units',
      deadline: goal.deadline || null,
      is_shared: goal.is_shared ?? false,
      is_completed: goal.is_completed ?? false,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('goals').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncGoalToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncGoalToSupabase exception:', err)
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

    const payload = {
      id: validId,
      user_id: ua.user_id,
      achievement_id: ua.achievement_id,
      unlocked_at: ua.earned_at || new Date().toISOString(),
    }

    const { error } = await supabase.from('user_achievements').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Sync] syncUserAchievementToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Sync] syncUserAchievementToSupabase exception:', err)
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

    // 3. Fetch additional tasks for today / recent
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { data: addData } = await supabase
      .from('additional_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .order('created_at', { ascending: true })

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
      unit: r.unit || 'units',
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

    // 6. Fetch user achievements
    const { data: achData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)

    const userAchievements: UserAchievement[] = (achData || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      achievement_id: r.achievement_id,
      earned_at: r.unlocked_at || r.earned_at || new Date().toISOString(),
      year: r.year || undefined,
      month: r.month || undefined,
    }))

    // 7. Fetch all groups user belongs to (memberships + created) with accurate member counts
    const groups = await fetchUserGroupsFromSupabase(userId)

    // 8. Reconstruct heatmapData from completions
    const dateMap = new Map<string, TaskCompletion[]>()
    completions.forEach(c => {
      const existing = dateMap.get(c.date) || []
      existing.push(c)
      dateMap.set(c.date, existing)
    })

    const heatmapData: DailySummary[] = Array.from(dateMap.entries()).map(([date, comps]) => {
      const pts = comps.reduce((acc, c) => acc + (c.points_awarded || 0), 0)
      // Colour is based on points ratio: >50% of total possible = bright (normal), ≤50% = dim (bare_minimum)
      const totalPossible = tasks.length * 20
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
        total_tasks: Math.max(tasks.length, comps.length),
        points_earned: pts,
        qualifies_for_consistency: status !== 'none',
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    // 9. Compute stats
    const totalPoints = completions.reduce((acc, c) => acc + (c.points_awarded || 0), 0)
    const todayComps = completions.filter(c => c.date === todayStr)
    const pointsToday = todayComps.reduce((acc, c) => acc + (c.points_awarded || 0), 0)
    const activeDays = heatmapData.filter(d => d.qualifies_for_consistency).length

    // Compute streak
    let streak = 0
    if (heatmapData.length > 0) {
      const sortedDesc = [...heatmapData].sort((a, b) => b.date.localeCompare(a.date))
      for (const d of sortedDesc) {
        if (d.qualifies_for_consistency) {
          streak++
        } else {
          break
        }
      }
    }

    const stats: UserStats = {
      current_streak: streak,
      longest_streak: streak,
      active_days_this_year: activeDays,
      total_points: totalPoints,
      points_today: pointsToday,
      points_this_week: totalPoints,
      points_this_month: totalPoints,
    }

    return {
      tasks,
      completions,
      additionalTasks,
      goals,
      journalEntries,
      userAchievements,
      groups,
      heatmapData,
      stats,
    }
  } catch (err) {
    console.warn('[Sync] fetchUserCloudData exception:', err)
    return null
  }
}
