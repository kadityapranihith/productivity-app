import { supabase } from './supabase'
import { computeUserActivitySummary, type ActivityCompletionRow, type ActivityAdditionalRow } from './activityStats'
import { getSystemAchievementsCatalog } from './achievementsCatalog'
import type { Group, Announcement, User, UserProfile, GroupLeaderboardEntry, DailySummary, UserStats, UserAchievement } from '@/types'

/**
 * Deterministically convert an email address to a valid RFC4122 v4 UUID string.
 * This guarantees consistent UUIDs across both Email and Google sign-ins with the same email,
 * preventing duplicate identities and PostgreSQL type errors.
 */
export function emailToUuid(email: string): string {
  if (!email) return '00000000-0000-4000-8000-000000000000'
  const clean = email.toLowerCase().trim()
  let h1 = 0xdeadbeef ^ clean.length
  let h2 = 0x41c64e6d ^ clean.length
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hex1 = ('00000000' + (h1 >>> 0).toString(16)).slice(-8)
  const hex2 = ('00000000' + (h2 >>> 0).toString(16)).slice(-8)
  const hex3 = ('00000000' + ((h1 ^ h2) >>> 0).toString(16)).slice(-8)
  const hex4 = ('00000000' + ((h1 + h2) >>> 0).toString(16)).slice(-8)
  const fullHex = (hex1 + hex2 + hex3 + hex4).slice(0, 32)
  return [
    fullHex.substring(0, 8),
    fullHex.substring(8, 12),
    '4' + fullHex.substring(13, 16),
    '8' + fullHex.substring(17, 20),
    fullHex.substring(20, 32),
  ].join('-')
}

/**
 * Generate a valid RFC4122 UUID for database entities.
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Sync / upsert a group to Supabase groups table.
 */
export async function syncGroupToSupabase(group: Group): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      id: group.id,
      name: group.name,
      description: group.description || null,
      visibility: group.visibility,
      invite_code: group.invite_code || null,
      created_by: group.created_by,
      created_at: group.created_at,
    }
    if (group.creator_email) {
      payload.creator_email = group.creator_email
    }
    if (typeof group.member_count === 'number') {
      payload.member_count = group.member_count
    }

    const { error } = await supabase.from('groups').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.warn('[Supabase] syncGroupToSupabase error:', error.message)
      return false
    }

    // Also register the creator as admin in group_members
    try {
      await syncMemberToSupabase(group.id, group.created_by, 'admin')
    } catch {}
    return true
  } catch (err) {
    console.warn('[Supabase] syncGroupToSupabase caught exception:', err)
    return false
  }
}

/**
 * Fetch all public circles from Supabase.
 */
export async function fetchPublicGroupsFromSupabase(): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] fetchPublicGroupsFromSupabase error:', error.message)
      return []
    }

    if (!Array.isArray(data)) return []

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      avatar_url: row.avatar_url || undefined,
      visibility: row.visibility || 'public',
      invite_code: row.invite_code || undefined,
      created_by: row.created_by,
      creator_email: row.creator_email || undefined,
      member_count: row.member_count ?? 1,
      created_at: row.created_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.warn('[Supabase] fetchPublicGroupsFromSupabase exception:', err)
    return []
  }
}

/**
 * Find a circle by invite code in Supabase.
 */
export async function findSupabaseGroupByCode(code: string): Promise<Group | null> {
  const clean = code.trim().toUpperCase()
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .ilike('invite_code', clean)
      .maybeSingle()

    if (error || !data) return null

    // Fetch accurate member count from group_members
    let memberCount = data.member_count ?? 1
    try {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', data.id)
      if (typeof count === 'number' && count > 0) memberCount = count
    } catch {}

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      avatar_url: data.avatar_url || undefined,
      visibility: data.visibility || 'public',
      invite_code: data.invite_code || undefined,
      created_by: data.created_by,
      creator_email: data.creator_email || undefined,
      member_count: memberCount,
      created_at: data.created_at || new Date().toISOString(),
    }
  } catch (err) {
    console.warn('[Supabase] findSupabaseGroupByCode exception:', err)
    return null
  }
}

/**
 * Fetch all groups a user belongs to (memberships + created) with real-time member counts.
 */
export async function fetchUserGroupsFromSupabase(userId: string): Promise<Group[]> {
  try {
    if (!userId) return []

    // 1. Memberships
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)

    const groupIds: string[] = (memberships || []).map(m => m.group_id)

    // 2. Groups created by user
    const { data: created } = await supabase
      .from('groups')
      .select('id')
      .eq('created_by', userId)

    ;(created || []).forEach(g => {
      if (!groupIds.includes(g.id)) groupIds.push(g.id)
    })

    if (groupIds.length === 0) return []

    // 3. Fetch full group details
    const { data: groups, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (gErr || !Array.isArray(groups)) return []

    // 4. Fetch real-time member counts from group_members for all these groups
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)

    const countMap = new Map<string, number>()
    ;(memberRows || []).forEach(r => {
      countMap.set(r.group_id, (countMap.get(r.group_id) || 0) + 1)
    })

    return groups.map(g => {
      const realCount = countMap.get(g.id) || g.member_count || 1
      return {
        id: g.id,
        name: g.name,
        description: g.description || '',
        avatar_url: g.avatar_url || undefined,
        visibility: g.visibility || 'public',
        invite_code: g.invite_code || undefined,
        created_by: g.created_by,
        creator_email: g.creator_email || undefined,
        member_count: realCount,
        created_at: g.created_at || new Date().toISOString(),
      }
    })
  } catch (err) {
    console.warn('[Supabase] fetchUserGroupsFromSupabase caught exception:', err)
    return []
  }
}

/**
 * Delete a circle from Supabase.
 */
export async function deleteGroupFromSupabase(groupId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) {
      console.warn('[Supabase] deleteGroupFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] deleteGroupFromSupabase exception:', err)
    return false
  }
}

/**
 * Add or update a member in Supabase group_members.
 */
export async function syncMemberToSupabase(
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<boolean> {
  try {
    const memberId = generateUuid()
    const { error } = await supabase.from('group_members').upsert(
      {
        id: memberId,
        group_id: groupId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,user_id' }
    )
    if (error) {
      console.warn('[Supabase] syncMemberToSupabase error:', error.message)
      return false
    }

    // Keep member_count on group updated in Supabase
    try {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      if (typeof count === 'number' && count > 0) {
        await supabase
          .from('groups')
          .update({ member_count: count })
          .eq('id', groupId)
      }
    } catch {}

    return true
  } catch (err) {
    console.warn('[Supabase] syncMemberToSupabase exception:', err)
    return false
  }
}

/**
 * Remove a member from Supabase group_members.
 */
export async function removeMemberFromSupabase(groupId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.warn('[Supabase] removeMemberFromSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] removeMemberFromSupabase exception:', err)
    return false
  }
}

/**
 * Insert announcement into Supabase announcements table.
 */
export async function syncAnnouncementToSupabase(ann: Announcement): Promise<boolean> {
  try {
    const { error } = await supabase.from('announcements').insert({
      id: ann.id,
      group_id: ann.group_id,
      user_id: ann.user_id,
      content: ann.content,
      type: ann.type,
      created_at: ann.created_at,
    })
    if (error) {
      console.warn('[Supabase] syncAnnouncementToSupabase error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] syncAnnouncementToSupabase exception:', err)
    return false
  }
}

/**
 * Fetch announcements for a group from Supabase.
 */
export async function fetchAnnouncementsFromSupabase(groupId: string): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error || !Array.isArray(data)) return []

    return data.map((r: any) => ({
      id: r.id,
      group_id: r.group_id,
      user_id: r.user_id,
      content: r.content,
      type: r.type || 'general',
      created_at: r.created_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.warn('[Supabase] fetchAnnouncementsFromSupabase exception:', err)
    return []
  }
}

/**
 * Upsert user profile to Supabase user_profiles and users tables.
 */
export async function upsertUserProfileToSupabase(user: User, profile: UserProfile, stats?: import('@/types').UserStats): Promise<boolean> {
  try {
    if (!user.id || !user.email) return false

    // Upsert into users
    try {
      await supabase.from('users').upsert(
        {
          id: user.id,
          firebase_uid: user.id,
          email: user.email.toLowerCase().trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
    } catch {}

    // Upsert into user_profiles
    const validProfileId = (profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id))
      ? profile.id
      : user.id

    const baseProfilePayload = {
      id: validProfileId,
      user_id: user.id,
      display_name: profile.display_name || user.display_name || user.email.split('@')[0],
      avatar_url: profile.avatar_url || user.avatar_url || null,
      bio: profile.bio || null,
      interests: profile.interests || [],
      show_heatmap: profile.show_heatmap ?? true,
      show_badges: profile.show_badges ?? true,
      show_streak: profile.show_streak ?? true,
      show_points: profile.show_points ?? true,
      show_goals: profile.show_goals ?? true,
      announce_achievements: profile.announce_achievements ?? true,
      updated_at: new Date().toISOString(),
    }

    const { error: profErr } = await supabase.from('user_profiles').upsert(
      {
        ...baseProfilePayload,
        points: stats?.total_points ?? 0,
        streak: stats?.current_streak ?? 0,
        active_days: stats?.active_days_this_year ?? 0,
      },
      { onConflict: 'user_id' }
    )
    if (profErr) {
      console.warn('[Supabase] user_profiles upsert with stats error, retrying base profile:', profErr.message)
      const { error: fallbackErr } = await supabase
        .from('user_profiles')
        .upsert(baseProfilePayload, { onConflict: 'user_id' })
      if (fallbackErr) {
        console.warn('[Supabase] user_profiles fallback upsert error:', fallbackErr.message)
      }
    }

    return true
  } catch (err) {
    console.warn('[Supabase] upsertUserProfileToSupabase exception:', err)
    return false
  }
}

/**
 * Fetch all members of a circle from Supabase along with their profile details.
 */
export async function fetchGroupMembersFromSupabase(groupId: string): Promise<GroupLeaderboardEntry[]> {
  try {
    const { data: members, error: mErr } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)

    if (mErr) {
      console.warn('[Supabase] fetchGroupMembersFromSupabase error:', mErr.message)
      return []
    }
    if (!Array.isArray(members) || members.length === 0) return []

    const userIds = members.map(m => m.user_id)

    // Fetch user profiles, emails, and non-private activity counts in parallel
    const [
      { data: profiles },
      { data: usersData },
      { data: tasksData },
      { data: compData },
      { data: addData },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').in('user_id', userIds),
      supabase.from('users').select('id, email').in('id', userIds),
      supabase.from('tasks').select('user_id').in('user_id', userIds).eq('is_active', true),
      supabase.from('task_completions').select('user_id, date, status, points_awarded').in('user_id', userIds),
      supabase.from('additional_tasks').select('user_id, date, points, completed').in('user_id', userIds).eq('completed', true),
    ])

    const profileMap = new Map<string, any>()
    if (Array.isArray(profiles)) {
      profiles.forEach(p => profileMap.set(p.user_id, p))
    }

    const userEmailMap = new Map<string, string>()
    if (Array.isArray(usersData)) {
      usersData.forEach(u => userEmailMap.set(u.id, u.email))
    }

    const taskCountMap = new Map<string, number>()
    if (Array.isArray(tasksData)) {
      tasksData.forEach(t => taskCountMap.set(t.user_id, (taskCountMap.get(t.user_id) || 0) + 1))
    }

    const compMap = new Map<string, ActivityCompletionRow[]>()
    if (Array.isArray(compData)) {
      compData.forEach(c => {
        const arr = compMap.get(c.user_id) || []
        arr.push(c)
        compMap.set(c.user_id, arr)
      })
    }

    const addMap = new Map<string, ActivityAdditionalRow[]>()
    if (Array.isArray(addData)) {
      addData.forEach(a => {
        const arr = addMap.get(a.user_id) || []
        arr.push(a)
        addMap.set(a.user_id, arr)
      })
    }

    return members.map((m, idx) => {
      const prof = profileMap.get(m.user_id)
      const email = userEmailMap.get(m.user_id) || ''
      const name = prof?.display_name || (email ? email.split('@')[0] : 'Circle Member')
      const avatar = prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

      const { stats: computed } = computeUserActivitySummary(
        taskCountMap.get(m.user_id) || 0,
        compMap.get(m.user_id) || [],
        addMap.get(m.user_id) || []
      )

      const hasComputedActivity = computed.total_points > 0 || computed.active_days_this_year > 0
      return {
        user_id: m.user_id,
        display_name: name,
        avatar_url: avatar,
        points: hasComputedActivity ? computed.total_points : (prof?.points ?? 0),
        rank: idx + 1,
        streak: hasComputedActivity ? computed.current_streak : (prof?.streak ?? 0),
        active_days: hasComputedActivity ? computed.active_days_this_year : (prof?.active_days ?? 0),
      }
    })
  } catch (err) {
    console.warn('[Supabase] fetchGroupMembersFromSupabase exception:', err)
    return []
  }
}

/**
 * Fetch a single user profile from Supabase by user_id.
 */
export async function fetchUserProfileFromSupabase(userId: string): Promise<{ user: User; profile: UserProfile } | null> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!profile && !userRow) return null

    const email = userRow?.email || ''
    const displayName = profile?.display_name || (email ? email.split('@')[0] : 'Circle Member')
    const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`

    const userObj: User = {
      id: userId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      bio: profile?.bio || '',
      interests: profile?.interests || ['coding', 'fitness', 'reading'],
      created_at: userRow?.created_at || new Date().toISOString(),
    }

    const profileObj: UserProfile = {
      id: profile?.id || userId,
      user_id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      bio: profile?.bio || '',
      interests: profile?.interests || ['coding', 'fitness', 'reading'],
      show_heatmap: profile?.show_heatmap ?? true,
      show_badges: profile?.show_badges ?? true,
      show_streak: profile?.show_streak ?? true,
      show_points: profile?.show_points ?? true,
      show_goals: profile?.show_goals ?? true,
      announce_achievements: profile?.announce_achievements ?? true,
      created_at: profile?.created_at || new Date().toISOString(),
      updated_at: profile?.updated_at || new Date().toISOString(),
    }

    return { user: userObj, profile: profileObj }
  } catch (err) {
    console.warn('[Supabase] fetchUserProfileFromSupabase exception:', err)
    return null
  }
}

export interface MemberPublicActivity {
  heatmapData: DailySummary[]
  stats: UserStats
  achievements: UserAchievement[]
}

/**
 * Fetch a circle member's non-private activity (heatmap dates, streak/points stats,
 * and earned achievements) directly from Supabase without reading private titles or notes.
 */
export async function fetchMemberPublicActivityFromSupabase(userId: string): Promise<MemberPublicActivity | null> {
  try {
    if (!userId) return null

    const [
      { data: tasksData },
      { data: compData },
      { data: addData },
      { data: achData },
    ] = await Promise.all([
      supabase.from('tasks').select('id').eq('user_id', userId).eq('is_active', true),
      supabase.from('task_completions').select('date, status, points_awarded').eq('user_id', userId),
      supabase.from('additional_tasks').select('date, points, completed').eq('user_id', userId).eq('completed', true),
      supabase.from('user_achievements').select('*').eq('user_id', userId),
    ])

    const { heatmapData, stats } = computeUserActivitySummary(
      (tasksData || []).length,
      (compData || []) as ActivityCompletionRow[],
      (addData || []) as ActivityAdditionalRow[]
    )

    const catalogByYear = new Map<number, ReturnType<typeof getSystemAchievementsCatalog>>()
    const getCatalog = (year: number) => {
      if (!catalogByYear.has(year)) catalogByYear.set(year, getSystemAchievementsCatalog(year))
      return catalogByYear.get(year)!
    }

    const achievements: UserAchievement[] = (achData || []).map((r: any) => {
      const year = r.year || new Date().getFullYear()
      const matched = getCatalog(year).find(a => a.id === r.achievement_id)
      return {
        id: r.id,
        user_id: r.user_id,
        achievement_id: r.achievement_id,
        achievement: matched,
        earned_at: r.unlocked_at || r.earned_at || new Date().toISOString(),
        year: r.year || undefined,
        month: r.month || undefined,
      }
    })

    return { heatmapData, stats, achievements }
  } catch (err) {
    console.warn('[Supabase] fetchMemberPublicActivityFromSupabase exception:', err)
    return null
  }
}
