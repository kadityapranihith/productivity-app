import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import type {
  User, UserProfile, Task, TaskCompletion, AdditionalTask,
  Goal, UserAchievement, Achievement, Group, GroupLeaderboardEntry,
  Announcement, JournalEntry, Notification, UserStats, DailySummary,
  CompletionStatus, GoalCategory
} from '@/types'
import { SYSTEM_ACHIEVEMENTS_CATALOG } from './achievementsCatalog'
import {
  emailToUuid,
  generateUuid,
  syncGroupToSupabase,
  fetchPublicGroupsFromSupabase,
  findSupabaseGroupByCode,
  deleteGroupFromSupabase,
  syncMemberToSupabase,
  removeMemberFromSupabase,
  syncAnnouncementToSupabase,
  upsertUserProfileToSupabase,
  fetchGroupMembersFromSupabase,
  fetchUserGroupsFromSupabase,
  fetchUserProfileFromSupabase,
  fetchAnnouncementsFromSupabase
} from './supabaseGroups'
import {
  syncTaskToSupabase,
  deleteTaskFromSupabase,
  syncTaskCompletionToSupabase,
  deleteTaskCompletionFromSupabase,
  syncAdditionalTaskToSupabase,
  deleteAdditionalTaskFromSupabase,
  syncGoalToSupabase,
  deleteGoalFromSupabase,
  syncJournalEntryToSupabase,
  deleteJournalEntryFromSupabase,
  syncUserAchievementToSupabase,
  fetchUserCloudData
} from './supabaseSync'

const initialStats: UserStats = {
  current_streak: 0,
  longest_streak: 0,
  active_days_this_year: 0,
  total_points: 0,
  points_today: 0,
  points_this_week: 0,
  points_this_month: 0,
}

const emptyUser: User = {
  id: '',
  email: '',
  display_name: '',
  avatar_url: '',
  bio: '',
  interests: ['coding', 'fitness', 'reading'],
  created_at: new Date().toISOString(),
}

const emptyProfile: UserProfile = {
  id: '',
  user_id: '',
  display_name: '',
  avatar_url: '',
  bio: '',
  interests: ['coding', 'fitness', 'reading'],
  show_heatmap: true,
  show_badges: true,
  show_streak: true,
  show_points: true,
  show_goals: true,
  announce_achievements: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export interface AccountData {
  user: User
  profile: UserProfile
  stats: UserStats
  tasks: Task[]
  completions: TaskCompletion[]
  additionalTasks: AdditionalTask[]
  heatmapData: DailySummary[]
  userAchievements: UserAchievement[]
  goals: Goal[]
  journalEntries: JournalEntry[]
  groups: Group[]
  activeGroupId: string
  leaderboard: GroupLeaderboardEntry[]
  announcements: Announcement[]
}

// Fake/demo group IDs and codes to filter out from old sessions
const FAKE_GROUP_IDS = new Set(['grp-5am', 'grp-code100', 'grp-deepwork', 'grp-movement'])
const FAKE_GROUP_CODES = new Set(['5AMCLUB', 'CODE100', 'DEEPWORK', 'MOVE2026'])
const FAKE_GROUP_NAMES = new Set(['5 am club', '100 days of code', 'deep work guild', 'daily movement'])

function isFakeGroup(g: Group): boolean {
  return (
    FAKE_GROUP_IDS.has(g.id) ||
    FAKE_GROUP_CODES.has((g.invite_code || '').toUpperCase()) ||
    FAKE_GROUP_NAMES.has((g.name || '').toLowerCase().trim())
  )
}

interface AppState {
  // Current user & profile
  user: User
  profile: UserProfile
  stats: UserStats

  // Groups & active selection
  groups: Group[]
  activeGroupId: string
  leaderboard: GroupLeaderboardEntry[]
  announcements: Announcement[]
  hasUnreadCircleActivity: boolean
  lastReadAnnouncementCount: number

  // Tasks & completions
  tasks: Task[]
  completions: TaskCompletion[]
  additionalTasks: AdditionalTask[]

  // Consistency & achievements
  heatmapData: DailySummary[]
  achievements: Achievement[]
  userAchievements: UserAchievement[]

  // Goals & journal
  goals: Goal[]
  journalEntries: JournalEntry[]
  notifications: Notification[]

  // Selected friend for modal profile preview
  viewingFriendId: string | null

  // Selected achievement for badge modal
  inspectingBadge: Achievement | null

  // Authentication
  isAuthenticated: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (email: string, pass: string, name: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => void

  // Profile actions
  updateUserProfile: (data: Partial<User> & Partial<UserProfile>) => void
  updateProfilePrivacy: (key: keyof UserProfile, val: boolean) => void

  // Actions
  setActiveGroup: (groupId: string) => void
  setViewingFriend: (userId: string | null) => void
  setInspectingBadge: (badge: Achievement | null) => void

  // Task actions
  completeTask: (taskId: string, level: CompletionStatus) => void
  addTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  deleteTask: (taskId: string) => void
  addAdditionalTask: (title: string, category: GoalCategory, points?: number) => void
  toggleAdditionalTask: (id: string) => void
  deleteAdditionalTask: (id: string) => void

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'current_value' | 'is_completed' | 'created_at' | 'updated_at'>) => void
  updateGoalProgress: (id: string, delta: number) => void
  deleteGoal: (id: string) => void

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  updateJournalEntry: (id: string, content: string, title?: string) => void
  deleteJournalEntry: (id: string) => void

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Groups
  createGroup: (name: string, description: string, visibility: Group['visibility']) => void
  joinGroupWithCode: (code: string) => boolean
  joinGroup: (group: Group) => void
  addAnnouncement: (content: string, type?: Announcement['type']) => void
  markCircleActivityRead: () => void
  deleteGroup: (groupId: string) => void
  leaveGroup: (groupId: string) => void
  kickMember: (groupId: string, userId: string) => void
  setGroups: (groups: Group[]) => void
  refreshGroupsFromCloud: () => Promise<void>

  // Reset & Cloud Sync
  resetToFreshAccount: () => void
  syncWithCloud: () => Promise<void>
}

/**
 * Resolves a complete account snapshot purely from Supabase cloud data.
 * When logging in on ANY machine or refreshing, all domain data is fetched from Supabase.
 */
async function resolveAccountWithCloud(
  canonicalUserId: string,
  cleanEmail: string,
  displayName: string,
  avatarUrl?: string
): Promise<AccountData> {
  const [cloud, profileRes] = await Promise.all([
    fetchUserCloudData(canonicalUserId).catch(() => null),
    fetchUserProfileFromSupabase(canonicalUserId).catch(() => null)
  ])

  const effectiveDisplayName = profileRes?.user?.display_name || displayName || cleanEmail.split('@')[0]
  const effectiveAvatar = profileRes?.user?.avatar_url || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(effectiveDisplayName)}`

  const updatedUser: User = {
    id: canonicalUserId,
    email: cleanEmail,
    display_name: effectiveDisplayName,
    avatar_url: effectiveAvatar,
    bio: profileRes?.user?.bio || '',
    interests: profileRes?.user?.interests || ['coding', 'fitness', 'reading'],
    created_at: profileRes?.user?.created_at || new Date().toISOString(),
  }

  const updatedProfile: UserProfile = profileRes?.profile || {
    ...emptyProfile,
    id: canonicalUserId,
    user_id: canonicalUserId,
    display_name: effectiveDisplayName,
    avatar_url: effectiveAvatar,
  }

  const cloudGroups = (cloud?.groups || []).filter(g => !isFakeGroup(g))
  const activeGroupId = cloudGroups[0]?.id || ''

  // Fetch announcements for active group if any
  let announcements: Announcement[] = []
  if (activeGroupId) {
    try {
      announcements = await fetchAnnouncementsFromSupabase(activeGroupId)
    } catch {}
  }

  return {
    user: updatedUser,
    profile: updatedProfile,
    stats: cloud?.stats || { ...initialStats },
    tasks: cloud?.tasks || [],
    completions: cloud?.completions || [],
    additionalTasks: cloud?.additionalTasks || [],
    heatmapData: cloud?.heatmapData || [],
    userAchievements: cloud?.userAchievements || [],
    goals: cloud?.goals || [],
    journalEntries: cloud?.journalEntries || [],
    groups: cloudGroups,
    activeGroupId,
    leaderboard: [],
    announcements,
  }
}
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: emptyUser,
      profile: emptyProfile,
      stats: initialStats,
      groups: [],
      activeGroupId: '',
      leaderboard: [],
      announcements: [],
      hasUnreadCircleActivity: false,
      lastReadAnnouncementCount: 0,
      tasks: [],
      completions: [],
      additionalTasks: [],
      heatmapData: [],
      achievements: SYSTEM_ACHIEVEMENTS_CATALOG, // Catalog of badges
      userAchievements: [], // Zero earned badges
      goals: [],
      journalEntries: [],
      notifications: [],
      viewingFriendId: null,
      inspectingBadge: null,
      isAuthenticated: false,

      login: async (email: string, pass: string) => {
        const cleanEmail = email.trim().toLowerCase()
        let displayName: string | undefined
        let photoUrl: string | undefined

        try {
          const { firebaseAuth } = await import('./firebase')
          if (firebaseAuth) {
            const { signInWithEmailAndPassword } = await import('firebase/auth')
            const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass)
            if (cred.user) {
              displayName = cred.user.displayName || undefined
              photoUrl = cred.user.photoURL || undefined
            }
          }
        } catch (e) {
          console.warn('[Auth] Operating with local auth state:', e)
        }

        const canonicalUserId = emailToUuid(cleanEmail)
        const defaultName = displayName || cleanEmail.split('@')[0].replace('.', ' ')
        const defaultAvatar = photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultName)}`

        const account = await resolveAccountWithCloud(canonicalUserId, cleanEmail, defaultName, defaultAvatar)
        set({
          ...account,
          isAuthenticated: true,
        })
        upsertUserProfileToSupabase(account.user, account.profile).catch(() => {})
      },

      signup: async (email: string, pass: string, name: string) => {
        const cleanEmail = email.trim().toLowerCase()
        const cleanName = name.trim() || cleanEmail.split('@')[0]
        let photoUrl: string | undefined

        try {
          const { firebaseAuth } = await import('./firebase')
          if (firebaseAuth) {
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
            const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, pass)
            if (cred.user) {
              await updateProfile(cred.user, { displayName: cleanName })
              photoUrl = cred.user.photoURL || undefined
            }
          }
        } catch (e) {
          console.warn('[Auth] Operating with local auth state:', e)
        }

        const canonicalUserId = emailToUuid(cleanEmail)
        const avatar = photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`

        const account = await resolveAccountWithCloud(canonicalUserId, cleanEmail, cleanName, avatar)
        set({
          ...account,
          isAuthenticated: true,
        })
        upsertUserProfileToSupabase(account.user, account.profile).catch(() => {})
      },

      resetToFreshAccount: () => {
        set({
          stats: { ...initialStats },
          tasks: [],
          completions: [],
          additionalTasks: [],
          heatmapData: [],
          userAchievements: [],
          goals: [],
          journalEntries: [],
        })
      },

      syncWithCloud: async () => {
        const state = get()
        if (!state.isAuthenticated || !state.user?.id || !state.user.email) return
        const cleanEmail = state.user.email.toLowerCase().trim()
        const account = await resolveAccountWithCloud(
          state.user.id,
          cleanEmail,
          state.user.display_name,
          state.user.avatar_url
        )
        const preservedGroupId = state.activeGroupId && account.groups.some(g => g.id === state.activeGroupId)
          ? state.activeGroupId
          : account.activeGroupId

        set({
          ...account,
          activeGroupId: preservedGroupId,
          isAuthenticated: true,
        })
      },

      loginWithGoogle: async () => {
        let uid: string | undefined
        let email: string = ''
        let name: string = ''
        let avatar: string | undefined

        try {
          const { firebaseAuth } = await import('./firebase')
          if (firebaseAuth) {
            const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
            const provider = new GoogleAuthProvider()
            const cred = await signInWithPopup(firebaseAuth, provider)
            if (cred.user) {
              uid = cred.user.uid
              email = cred.user.email || ''
              name = cred.user.displayName || email.split('@')[0]
              avatar = cred.user.photoURL || undefined
            }
          }
        } catch (e) {
          console.warn('[Google Auth] Operating with fallback auth state:', e)
        }

        if (!email) {
          console.warn('[Google Auth] No email returned')
          return
        }

        const cleanEmail = email.trim().toLowerCase()
        const canonicalUserId = emailToUuid(cleanEmail)
        const cleanName = name.trim() || cleanEmail.split('@')[0]
        const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`

        const account = await resolveAccountWithCloud(canonicalUserId, cleanEmail, cleanName, finalAvatar)
        set({
          ...account,
          isAuthenticated: true,
        })
        upsertUserProfileToSupabase(account.user, account.profile).catch(() => {})
      },

      resetPassword: async (email: string) => {
        try {
          const { firebaseAuth } = await import('./firebase')
          if (firebaseAuth) {
            const { sendPasswordResetEmail } = await import('firebase/auth')
            await sendPasswordResetEmail(firebaseAuth, email)
            return
          }
        } catch (e) {
          console.warn('[Reset Password] Firebase error:', e)
          throw e
        }
      },

      updateUserProfile: (data) => {
        set(state => {
          const updatedUser = {
            ...state.user,
            ...(data.display_name ? { display_name: data.display_name } : {}),
            ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
            ...(data.bio !== undefined ? { bio: data.bio } : {}),
            ...(data.interests ? { interests: data.interests } : {}),
          }
          const updatedProfile = {
            ...state.profile,
            ...(data.display_name ? { display_name: data.display_name } : {}),
            ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
            ...(data.bio !== undefined ? { bio: data.bio } : {}),
            ...(data.interests ? { interests: data.interests } : {}),
            updated_at: new Date().toISOString(),
          }
          const updatedLeaderboard = state.leaderboard.map(e =>
            e.user_id === state.user.id
              ? { ...e, display_name: updatedUser.display_name, avatar_url: updatedUser.avatar_url }
              : e
          )
          upsertUserProfileToSupabase(updatedUser, updatedProfile).catch(() => {})
          return {
            user: updatedUser,
            profile: updatedProfile,
            leaderboard: updatedLeaderboard,
          }
        })
      },

      updateProfilePrivacy: (key, val) => {
        set(state => ({
          profile: {
            ...state.profile,
            [key]: val,
            updated_at: new Date().toISOString(),
          }
        }))
      },

      logout: () => {
        import('./firebase').then(({ firebaseAuth }) => {
          if (firebaseAuth) {
            import('firebase/auth').then(({ signOut }) => signOut(firebaseAuth).catch(() => {}))
          }
        })
        set({
          isAuthenticated: false,
          user: emptyUser,
          profile: emptyProfile,
          stats: { ...initialStats },
          tasks: [],
          completions: [],
          additionalTasks: [],
          heatmapData: [],
          userAchievements: [],
          goals: [],
          journalEntries: [],
          groups: [],
          activeGroupId: '',
          leaderboard: [],
          announcements: [],
          notifications: [],
          viewingFriendId: null,
          inspectingBadge: null,
        })
      },

      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
      setViewingFriend: (userId) => set({ viewingFriendId: userId }),
      setInspectingBadge: (badge) => set({ inspectingBadge: badge }),

      completeTask: (taskId, level) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task) return

        const taskNormalPoints = 20
        const taskMinPoints = 10
        const upgradePoints = taskNormalPoints - taskMinPoints

        const existingCompletion = state.completions.find(
          c => c.task_id === taskId && c.date === todayStr
        )

        let newCompletions = [...state.completions]
        let pointDelta = 0

        if (existingCompletion) {
          if (level === 'none') {
            newCompletions = newCompletions.filter(c => c.id !== existingCompletion.id)
            pointDelta = -existingCompletion.points_awarded
            deleteTaskCompletionFromSupabase(existingCompletion.id).catch(() => {})
          } else if (level === 'normal' && existingCompletion.status === 'bare_minimum') {
            const updated = { ...existingCompletion, status: 'normal' as CompletionStatus, points_awarded: taskNormalPoints }
            newCompletions = newCompletions.map(c => c.id === existingCompletion.id ? updated : c)
            pointDelta = upgradePoints
            syncTaskCompletionToSupabase(updated).catch(() => {})
          } else if (level === existingCompletion.status) {
            newCompletions = newCompletions.filter(c => c.id !== existingCompletion.id)
            pointDelta = -existingCompletion.points_awarded
            deleteTaskCompletionFromSupabase(existingCompletion.id).catch(() => {})
          } else {
            const newPts = taskMinPoints
            pointDelta = newPts - existingCompletion.points_awarded
            const updated = { ...existingCompletion, status: level as CompletionStatus, points_awarded: newPts }
            newCompletions = newCompletions.map(c => c.id === existingCompletion.id ? updated : c)
            syncTaskCompletionToSupabase(updated).catch(() => {})
          }
        } else if (level !== 'none') {
          const awarded = level === 'normal' ? taskNormalPoints : taskMinPoints
          pointDelta = awarded
          const newComp: TaskCompletion = {
            id: generateUuid(),
            task_id: taskId,
            user_id: state.user.id,
            date: todayStr,
            status: level,
            points_awarded: awarded,
            completed_at: new Date().toISOString(),
          }
          newCompletions.push(newComp)
          syncTaskCompletionToSupabase(newComp).catch(() => {})
        }

        const newTotalPoints = Math.max(0, state.stats.total_points + pointDelta)
        const newPointsToday = Math.max(0, state.stats.points_today + pointDelta)

        // Update heatmap entry for today
        const hasNormal = newCompletions.some(c => c.date === todayStr && c.status === 'normal')
        const hasBare = newCompletions.some(c => c.date === todayStr && c.status === 'bare_minimum')
        const todayStatus: CompletionStatus = hasNormal ? 'normal' : hasBare ? 'bare_minimum' : 'none'

        const otherDaysHeatmap = state.heatmapData.filter(d => d.date !== todayStr)
        const newHeatmap = [
          ...otherDaysHeatmap,
          {
            date: todayStr,
            status: todayStatus,
            normal_completed: newCompletions.filter(c => c.date === todayStr && c.status === 'normal').length,
            bare_completed: newCompletions.filter(c => c.date === todayStr && c.status === 'bare_minimum').length,
            total_tasks: state.tasks.length,
            points_earned: newPointsToday,
            qualifies_for_consistency: todayStatus !== 'none',
          }
        ]

        const activeDaysCount = newHeatmap.filter(d => d.qualifies_for_consistency).length
        const newStreak = todayStatus !== 'none' ? Math.max(1, state.stats.current_streak) : 0

        const updatedLeaderboard = state.leaderboard.map(entry =>
          entry.user_id === state.user.id
            ? {
                ...entry,
                points: newTotalPoints,
                streak: newStreak,
                active_days: activeDaysCount,
              }
            : entry
        )

        // Check milestone / badge unlocking
        const userCanonicalId = state.user.id || emailToUuid(state.user.email)
        const earnedIds = new Set(state.userAchievements.map(ua => ua.achievement_id))
        const newEarned: UserAchievement[] = []
        const announcementsToBroadcast: Announcement[] = []
        const displayName = state.user.display_name || state.user.email.split('@')[0]

        // Active days badges: 50, 100, 200, 300
        const activeMilestones = [
          { id: 'ach-50', name: '50 Active Days', threshold: 50, icon: '🌱' },
          { id: 'ach-100', name: '100 Active Days', threshold: 100, icon: '🌿' },
          { id: 'ach-200', name: '200 Active Days', threshold: 200, icon: '🌳' },
          { id: 'ach-300', name: '300 Active Days', threshold: 300, icon: '🏔️' },
        ]

        for (const m of activeMilestones) {
          if (activeDaysCount >= m.threshold && !earnedIds.has(m.id)) {
            const newUa: UserAchievement = {
              id: generateUuid(),
              user_id: userCanonicalId,
              achievement_id: m.id,
              earned_at: new Date().toISOString(),
              year: new Date().getFullYear(),
            }
            newEarned.push(newUa)
            earnedIds.add(m.id)
            syncUserAchievementToSupabase(newUa).catch(() => {})

            // Broadcast to all user's circles
            state.groups.forEach(g => {
              const ann: Announcement = {
                id: generateUuid(),
                group_id: g.id,
                user_id: userCanonicalId,
                content: `🎉 ${displayName} unlocked the "${m.name}" milestone badge ${m.icon}!`,
                type: 'achievement',
                created_at: new Date().toISOString(),
                user: {
                  display_name: displayName,
                  avatar_url: state.user.avatar_url,
                },
              }
              announcementsToBroadcast.push(ann)
              syncAnnouncementToSupabase(ann).catch(() => {})
            })
          }
        }

        // Streak milestones: 7, 14, 30, 60, 100, 365 days
        const streakMilestones = [7, 14, 30, 60, 100, 365]
        const prevStreak = state.stats.current_streak
        for (const sm of streakMilestones) {
          if (newStreak >= sm && prevStreak < sm) {
            state.groups.forEach(g => {
              const ann: Announcement = {
                id: generateUuid(),
                group_id: g.id,
                user_id: userCanonicalId,
                content: `🔥 ${displayName} hit an incredible ${sm}-day consistency streak!`,
                type: 'milestone',
                created_at: new Date().toISOString(),
                user: {
                  display_name: displayName,
                  avatar_url: state.user.avatar_url,
                },
              }
              announcementsToBroadcast.push(ann)
              syncAnnouncementToSupabase(ann).catch(() => {})
            })
          }
        }

        const updatedAchievements = newEarned.length > 0
          ? [...state.userAchievements, ...newEarned]
          : state.userAchievements
        const updatedAnnouncements = announcementsToBroadcast.length > 0
          ? [...announcementsToBroadcast, ...state.announcements]
          : state.announcements

        const newStats = {
          ...state.stats,
          total_points: newTotalPoints,
          points_today: newPointsToday,
          active_days_this_year: activeDaysCount,
          current_streak: newStreak,
        }

        set({
          completions: newCompletions,
          heatmapData: newHeatmap,
          leaderboard: updatedLeaderboard,
          userAchievements: updatedAchievements,
          announcements: updatedAnnouncements,
          stats: newStats,
        })

        upsertUserProfileToSupabase(state.user, state.profile, newStats).catch(() => {})
      },

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          normal_points: 20,
          min_points: 10,
          id: generateUuid(),
          user_id: get().user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set(state => ({ tasks: [...state.tasks, newTask] }))
        syncTaskToSupabase(newTask).catch(() => {})
      },

      deleteTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
          completions: state.completions.filter(c => c.task_id !== taskId),
        }))
        deleteTaskFromSupabase(taskId).catch(() => {})
      },

      addAdditionalTask: (title, category) => {
        const newTask: AdditionalTask = {
          id: generateUuid(),
          user_id: get().user.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          title,
          category,
          points: 5,
          completed: false,
          created_at: new Date().toISOString(),
        }
        set(state => ({ additionalTasks: [...state.additionalTasks, newTask] }))
        syncAdditionalTaskToSupabase(newTask).catch(() => {})
      },

      toggleAdditionalTask: (id) => {
        const state = get()
        const target = state.additionalTasks.find(t => t.id === id)
        if (!target) return
        const nextState = !target.completed
        const delta = nextState ? 5 : -5
        const newTotal = Math.max(0, state.stats.total_points + delta)
        const newToday = Math.max(0, state.stats.points_today + delta)

        const updatedTask = { ...target, completed: nextState }
        syncAdditionalTaskToSupabase(updatedTask).catch(() => {})

        const updatedLeaderboard = state.leaderboard.map(entry =>
          entry.user_id === state.user.id
            ? { ...entry, points: newTotal }
            : entry
        )

        set({
          additionalTasks: state.additionalTasks.map(t =>
            t.id === id ? updatedTask : t
          ),
          leaderboard: updatedLeaderboard,
          stats: {
            ...state.stats,
            total_points: newTotal,
            points_today: newToday,
          },
        })
      },

      deleteAdditionalTask: (id) => {
        set(state => ({
          additionalTasks: state.additionalTasks.filter(t => t.id !== id),
        }))
        deleteAdditionalTaskFromSupabase(id).catch(() => {})
      },

      addGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: generateUuid(),
          user_id: get().user.id,
          current_value: 0,
          is_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set(state => ({ goals: [newGoal, ...state.goals] }))
        syncGoalToSupabase(newGoal).catch(() => {})
      },

      updateGoalProgress: (id, delta) => {
        let updatedGoal: Goal | null = null
        set(state => ({
          goals: state.goals.map(g => {
            if (g.id !== id) return g
            const nextVal = Math.max(0, g.current_value + delta)
            updatedGoal = {
              ...g,
              current_value: nextVal,
              is_completed: nextVal >= g.target_value,
              updated_at: new Date().toISOString(),
            }
            return updatedGoal
          }),
        }))
        if (updatedGoal) {
          syncGoalToSupabase(updatedGoal).catch(() => {})
        }
      },

      deleteGoal: (id) => {
        set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
        deleteGoalFromSupabase(id).catch(() => {})
      },

      addJournalEntry: (entryData) => {
        const newEntry: JournalEntry = {
          ...entryData,
          id: generateUuid(),
          user_id: get().user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set(state => ({ journalEntries: [newEntry, ...state.journalEntries] }))
        syncJournalEntryToSupabase(newEntry).catch(() => {})
      },

      updateJournalEntry: (id, content, title) => {
        let updatedEntry: JournalEntry | null = null
        set(state => ({
          journalEntries: state.journalEntries.map(e => {
            if (e.id !== id) return e
            updatedEntry = { ...e, content, title, updated_at: new Date().toISOString() }
            return updatedEntry
          }),
        }))
        if (updatedEntry) {
          syncJournalEntryToSupabase(updatedEntry).catch(() => {})
        }
      },

      deleteJournalEntry: (id) => {
        set(state => ({
          journalEntries: state.journalEntries.filter(e => e.id !== id),
        }))
        deleteJournalEntryFromSupabase(id).catch(() => {})
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllNotificationsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
        }))
      },

      createGroup: (name, description, visibility) => {
        const user = get().user
        const stats = get().stats
        const cleanCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CIR' + Math.floor(1000 + Math.random() * 9000)
        const newGroupId = generateUuid()
        const userCanonicalId = user.id || emailToUuid(user.email)
        const userEmail = (user.email || '').toLowerCase().trim()

        const newGroup: Group = {
          id: newGroupId,
          name,
          description,
          visibility,
          invite_code: cleanCode,
          created_by: userCanonicalId,
          creator_email: userEmail,
          member_count: 1,
          created_at: new Date().toISOString(),
        }

        const creatorEntry: GroupLeaderboardEntry = {
          user_id: userCanonicalId,
          display_name: user.display_name || userEmail.split('@')[0],
          avatar_url: user.avatar_url,
          points: stats.total_points,
          rank: 1,
          streak: stats.current_streak,
          active_days: stats.active_days_this_year,
        }

        const announcement: Announcement = {
          id: generateUuid(),
          group_id: newGroupId,
          user_id: userCanonicalId,
          content: `${user.display_name || 'Circle founder'} created the circle "${name}"!`,
          type: 'milestone',
          created_at: new Date().toISOString(),
          user: {
            display_name: user.display_name || 'Circle founder',
            avatar_url: user.avatar_url,
          },
        }

        set(state => ({
          groups: [...state.groups, newGroup],
          activeGroupId: newGroup.id,
          leaderboard: [creatorEntry],
          announcements: [announcement, ...state.announcements],
          hasUnreadCircleActivity: true,
        }))

        // Sync directly to Supabase in background
        syncGroupToSupabase(newGroup).catch(err => {
          console.warn('[Store] syncGroupToSupabase error:', err)
        })
        syncAnnouncementToSupabase(announcement).catch(err => {
          console.warn('[Store] syncAnnouncementToSupabase error:', err)
        })
        upsertUserProfileToSupabase(user, get().profile).catch(() => {})
      },

      addAnnouncement: (content, type = 'general') => {
        const user = get().user
        const activeGroupId = get().activeGroupId
        const userCanonicalId = user.id || emailToUuid(user.email)

        const newAnn: Announcement = {
          id: generateUuid(),
          group_id: activeGroupId || 'general',
          user_id: userCanonicalId,
          content,
          type,
          created_at: new Date().toISOString(),
          user: {
            display_name: user.display_name || 'Member',
            avatar_url: user.avatar_url,
          },
        }

        set(state => ({
          announcements: [newAnn, ...state.announcements],
          hasUnreadCircleActivity: true,
        }))

        syncAnnouncementToSupabase(newAnn).catch(() => {})
      },

      markCircleActivityRead: () => {
        set(state => ({
          hasUnreadCircleActivity: false,
          lastReadAnnouncementCount: state.announcements.length,
        }))
      },

      joinGroup: (group) => {
        const user = get().user
        const stats = get().stats
        const userCanonicalId = user.id || emailToUuid(user.email)

        let existingMembers = [...get().leaderboard]
        const hasUser = existingMembers.some(e => e.user_id === userCanonicalId)
        const updatedLeaderboard = hasUser
          ? existingMembers
          : [
              ...existingMembers,
              {
                user_id: userCanonicalId,
                display_name: user.display_name || user.email.split('@')[0],
                avatar_url: user.avatar_url,
                points: stats.total_points,
                rank: existingMembers.length + 1,
                streak: stats.current_streak,
                active_days: stats.active_days_this_year,
              },
            ]

        const alreadyInList = get().groups.some(g => g.id === group.id)
        const updatedGroup: Group = {
          ...group,
          member_count: Math.max(updatedLeaderboard.length, alreadyInList ? group.member_count : (group.member_count || 1) + 1),
        }

        set(s => ({
          groups: alreadyInList ? s.groups : [...s.groups, updatedGroup],
          activeGroupId: group.id,
          leaderboard: updatedLeaderboard,
        }))

        // Sync membership to Supabase and immediately fetch fresh members list
        syncMemberToSupabase(group.id, userCanonicalId, 'member').then(async () => {
          const freshMembers = await fetchGroupMembersFromSupabase(group.id)
          if (freshMembers.length > 0) {
            set(s => ({
              leaderboard: freshMembers,
              groups: s.groups.map(g => g.id === group.id ? { ...g, member_count: freshMembers.length } : g)
            }))
          }
        }).catch(() => {})
        upsertUserProfileToSupabase(user, get().profile, get().stats).catch(() => {})
      },

      joinGroupWithCode: (code) => {
        const clean = code.trim().toUpperCase()
        const existing = get().groups.find(g => g.invite_code?.toUpperCase() === clean)

        if (existing) {
          get().joinGroup(existing)
          return true
        }

        // Try lookup in Supabase in background
        findSupabaseGroupByCode(clean).then(supaGroup => {
          if (supaGroup) {
            get().joinGroup(supaGroup)
          }
        }).catch(() => {})

        return false
      },

      deleteGroup: (groupId) => {
        set(state => {
          const remaining = state.groups.filter(g => g.id !== groupId)
          const newActiveId = state.activeGroupId === groupId
            ? (remaining[0]?.id ?? '')
            : state.activeGroupId
          return {
            groups: remaining,
            activeGroupId: newActiveId,
            leaderboard: remaining.length === 0 ? [] : state.leaderboard,
            announcements: state.announcements.filter(a => a.group_id !== groupId),
          }
        })

        // Delete from Supabase
        deleteGroupFromSupabase(groupId).catch(() => {})
      },

      leaveGroup: (groupId) => {
        const state = get()
        const user = state.user
        const group = state.groups.find(g => g.id === groupId)
        if (!group) return

        const userCanonicalId = user.id || emailToUuid(user.email)
        const isAdmin = group.created_by === userCanonicalId ||
          (group.creator_email && group.creator_email.toLowerCase() === user.email.toLowerCase())
        const otherMembers = state.leaderboard.filter(e => e.user_id !== userCanonicalId)

        // Circle admin cannot leave if other members remain (must delete circle to close it)
        if (isAdmin && otherMembers.length > 0) {
          console.warn('[Store] Circle admin cannot leave while other members are present.')
          return
        }

        // Remove group from user's joined circles
        const remainingGroups = state.groups.filter(g => g.id !== groupId)
        const nextActiveId = state.activeGroupId === groupId
          ? (remainingGroups[0]?.id ?? '')
          : state.activeGroupId

        set({
          groups: remainingGroups,
          activeGroupId: nextActiveId,
          leaderboard: remainingGroups.length === 0 ? [] : otherMembers,
        })

        removeMemberFromSupabase(groupId, userCanonicalId).catch(() => {})
      },

      kickMember: (groupId, userId) => {
        set(state => ({
          groups: state.groups.map(g =>
            g.id === groupId
              ? { ...g, member_count: Math.max(1, g.member_count - 1) }
              : g
          ),
          leaderboard: state.leaderboard.filter(e => e.user_id !== userId),
        }))
        removeMemberFromSupabase(groupId, userId).catch(() => {})
      },

      setGroups: (groups) => set({ groups }),

      refreshGroupsFromCloud: async () => {
        const user = get().user
        if (!user?.id) return
        const cloudGroups = await fetchUserGroupsFromSupabase(user.id)
        if (cloudGroups.length > 0) {
          set(s => ({
            groups: cloudGroups,
            activeGroupId: cloudGroups.some(g => g.id === s.activeGroupId) ? s.activeGroupId : cloudGroups[0].id
          }))
        }
      },
    }),
    {
      name: 'barely-productive-auth-session',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: {
          id: state.user.id,
          email: state.user.email,
          display_name: state.user.display_name,
          avatar_url: state.user.avatar_url,
        },
        activeGroupId: state.activeGroupId,
        lastReadAnnouncementCount: state.lastReadAnnouncementCount,
      }),
      onRehydrateStorage: () => (state) => {
        // Strip any lingering fake groups from the persisted Zustand state
        if (state && state.groups) {
          state.groups = state.groups.filter(g => !isFakeGroup(g))
          // If the active group was a fake one, clear it
          if (state.activeGroupId && state.groups.every(g => g.id !== state.activeGroupId)) {
            state.activeGroupId = state.groups[0]?.id ?? ''
          }
        }
      },
    }
  )
)
