
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Calendar, Trophy, ShieldCheck, Sparkles, Crown } from 'lucide-react'
import { Badge, Avatar, StatCard, SectionHeader } from '@/components/ui'
import { ConsistencyHeatmap } from '@/components/heatmap/ConsistencyHeatmap'
import { useAppStore } from '@/lib/store'
import {
  fetchUserProfileFromSupabase,
  fetchMemberPublicActivityFromSupabase,
  type MemberPublicActivity,
} from '@/lib/supabaseGroups'
import { getSystemAchievementsCatalog } from '@/lib/achievementsCatalog'
import type { GoalCategory, UserAchievement } from '@/types'

export function FriendProfileModal() {
  const viewingFriendId = useAppStore(state => state.viewingFriendId)
  const setViewingFriend = useAppStore(state => state.setViewingFriend)
  const leaderboard = useAppStore(state => state.leaderboard)
  const activeGroupId = useAppStore(state => state.activeGroupId)
  const groups = useAppStore(state => state.groups)
  const currentUser = useAppStore(state => state.user)
  const currentProfile = useAppStore(state => state.profile)
  const currentStats = useAppStore(state => state.stats)
  const currentHeatmap = useAppStore(state => state.heatmapData)
  const currentAchievements = useAppStore(state => state.userAchievements)

  const [remoteUserObj, setRemoteUserObj] = useState<{ user: any; profile: any } | null>(null)
  const [remoteActivity, setRemoteActivity] = useState<MemberPublicActivity | null>(null)
  const [isLoadingRemote, setIsLoadingRemote] = useState(false)

  const activeGroup = groups.find(g => g.id === activeGroupId)
  const isSelf = viewingFriendId === currentUser.id

  useEffect(() => {
    if (!viewingFriendId || viewingFriendId === currentUser.id) {
      setRemoteUserObj(null)
      setRemoteActivity(null)
      setIsLoadingRemote(false)
      return
    }

    let cancelled = false
    setRemoteUserObj(null)
    setRemoteActivity(null)
    setIsLoadingRemote(true)

    Promise.all([
      fetchUserProfileFromSupabase(viewingFriendId).catch(() => null),
      fetchMemberPublicActivityFromSupabase(viewingFriendId).catch(() => null),
    ]).then(([profileData, activityData]) => {
      if (cancelled) return
      if (profileData) setRemoteUserObj(profileData)
      if (activityData) setRemoteActivity(activityData)
      setIsLoadingRemote(false)
    })

    return () => {
      cancelled = true
    }
  }, [viewingFriendId, currentUser.id])

  if (!viewingFriendId) return null

  const catalog = getSystemAchievementsCatalog()
  const enrichAchievements = (list: UserAchievement[]) =>
    list.map(ua => ({
      ...ua,
      achievement: ua.achievement || catalog.find(a => a.id === ua.achievement_id),
    }))

  const lbEntry = leaderboard.find(e => e.user_id === viewingFriendId)
  const computedStats = remoteActivity?.stats
  const hasComputedStats = Boolean(
    computedStats && (computedStats.total_points > 0 || computedStats.active_days_this_year > 0)
  )

  let friendData: any = null
  if (isSelf) {
    friendData = {
      user: currentUser,
      profile: currentProfile,
      stats: currentStats,
      achievements: enrichAchievements(currentAchievements),
      heatmap: currentHeatmap,
    }
  } else if (remoteUserObj) {
    const prof = remoteUserObj.profile
    friendData = {
      user: remoteUserObj.user,
      profile: prof,
      stats: hasComputedStats
        ? computedStats
        : {
            current_streak: lbEntry?.streak ?? prof?.streak ?? 0,
            longest_streak: lbEntry?.streak ?? prof?.streak ?? 0,
            active_days_this_year: lbEntry?.active_days ?? prof?.active_days ?? 0,
            total_points: lbEntry?.points ?? prof?.points ?? 0,
            points_today: 0,
            points_this_week: 0,
            points_this_month: 0,
          },
      achievements: remoteActivity?.achievements || [],
      heatmap: remoteActivity?.heatmapData || [],
    }
  } else {
    const name = lbEntry?.display_name || 'Circle Member'
    const interests: GoalCategory[] = ['coding', 'fitness', 'reading']
    friendData = {
      user: {
        id: viewingFriendId,
        display_name: name,
        email: `${name.toLowerCase()}@circle.internal`,
        avatar_url: lbEntry?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        interests,
        created_at: new Date().toISOString(),
      },
      profile: {
        id: 'prof-' + viewingFriendId,
        user_id: viewingFriendId,
        display_name: name,
        bio: '',
        interests,
        show_heatmap: true,
        show_badges: true,
        show_streak: true,
        show_points: true,
        show_goals: true,
        announce_achievements: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      stats: hasComputedStats
        ? computedStats
        : {
            current_streak: lbEntry?.streak ?? 0,
            longest_streak: lbEntry?.streak ?? 0,
            active_days_this_year: lbEntry?.active_days ?? 0,
            total_points: lbEntry?.points ?? 0,
            points_today: 0,
            points_this_week: 0,
            points_this_month: 0,
          },
      achievements: remoteActivity?.achievements || [],
      heatmap: remoteActivity?.heatmapData || [],
    }
  }

  const isFriendAdmin = Boolean(
    activeGroup && (
      activeGroup.created_by === viewingFriendId ||
      (activeGroup.creator_email && friendData?.user?.email && activeGroup.creator_email.toLowerCase() === friendData.user.email.toLowerCase()) ||
      (isSelf && (activeGroup.created_by === currentUser.id || (activeGroup.creator_email && activeGroup.creator_email.toLowerCase() === currentUser.email.toLowerCase())))
    )
  )

  const { user, profile, stats, achievements, heatmap } = friendData

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setViewingFriend(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#181B19] border border-[#262C28] rounded-2xl shadow-2xl p-6 md:p-7 z-10"
        >
          {/* Close button */}
          <button
            onClick={() => setViewingFriend(null)}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-[#5A6B5D] hover:text-[#F5F5F0] hover:bg-[#252A27] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Member Header with Admin & Role Status */}
          <div className="flex items-start gap-4 mb-6 pr-8">
            <Avatar src={user.avatar_url} name={user.display_name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#F5F5F0]">{user.display_name}</h2>
                {isFriendAdmin ? (
                  <Badge variant="warning" className="gap-1 font-semibold">
                    <Crown className="w-3 h-3 text-[#F59E0B]" /> Circle Admin
                  </Badge>
                ) : (
                  <Badge variant="muted">Circle Member</Badge>
                )}
                {isSelf && <Badge variant="accent">You</Badge>}
              </div>
              <p className="text-xs text-[#5A6B5D] mt-0.5">
                {isFriendAdmin ? 'Administrator of this circle' : 'Member in this circle'}
              </p>
              {profile.bio && (
                <p className="text-sm text-[#8B9A8E] mt-2.5 leading-relaxed">{profile.bio}</p>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.interests.map((interest: string) => (
                    <Badge key={interest} variant="muted" className="capitalize">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Current Streak"
              value={!isSelf && isLoadingRemote ? '—' : profile.show_streak ? `${stats.current_streak}d` : 'Hidden'}
              accent
              icon={<Flame className="w-4 h-4 text-[#F59E0B]" />}
            />
            <StatCard
              label="Active Days"
              value={!isSelf && isLoadingRemote ? '—' : stats.active_days_this_year}
              sub="this year"
              icon={<Calendar className="w-4 h-4 text-[#60A5FA]" />}
            />
            <StatCard
              label="Circle Points"
              value={!isSelf && isLoadingRemote ? '—' : profile.show_points ? stats.total_points.toLocaleString() : 'Hidden'}
              sub="points"
              icon={<Sparkles className="w-4 h-4 text-[#C5F36B]" />}
            />
            <StatCard
              label="Longest Streak"
              value={!isSelf && isLoadingRemote ? '—' : profile.show_streak ? `${stats.longest_streak}d` : 'Hidden'}
              sub="best"
              icon={<Trophy className="w-4 h-4 text-[#F59E0B]" />}
            />
          </div>

          {/* Consistency Heatmap */}
          {profile.show_heatmap && (
            <div className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl mb-6">
              <div className="flex items-center justify-between mb-3">
                <SectionHeader
                  title="Consistency Heatmap"
                  subtitle={`${user.display_name}'s calendar activity`}
                />
              </div>
              {!isSelf && isLoadingRemote ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-[#5A6B5D]">Loading activity...</p>
                </div>
              ) : heatmap && heatmap.length > 0 ? (
                <ConsistencyHeatmap data={heatmap} compact />
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-[#5A6B5D]">No activity recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Earned Badges */}
          {profile.show_badges && (
            <div className="p-4 bg-[#1E2220] border border-[#262C28] rounded-xl mb-6">
              <SectionHeader
                title="Achievements"
                subtitle="Milestones unlocked through showing up"
                className="mb-3"
              />
              {!isSelf && isLoadingRemote ? (
                <div className="py-3 text-center">
                  <p className="text-xs text-[#5A6B5D]">Loading badges...</p>
                </div>
              ) : achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {achievements.map((ua: any) => (
                    <div
                      key={ua.id}
                      className="p-3 bg-[#181B19] border border-[#262C28] rounded-lg flex flex-col items-center text-center gap-1.5"
                    >
                      <span className="text-2xl">{ua.achievement?.icon || '🌱'}</span>
                      <span className="text-xs font-semibold text-[#F5F5F0]">
                        {ua.achievement?.name || (ua.year ? `${ua.year} Active Days` : 'Milestone')}
                      </span>
                      <span className="text-[10px] text-[#C5F36B]">Earned</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-xs text-[#5A6B5D]">No badges earned yet</p>
                </div>
              )}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-center gap-2.5 p-3.5 bg-[rgba(197,243,107,0.04)] border border-[rgba(197,243,107,0.12)] rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#C5F36B] shrink-0" />
            <p className="text-xs text-[#8B9A8E]">
              Private task names, daily work descriptions, and personal journal entries are never shared.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
