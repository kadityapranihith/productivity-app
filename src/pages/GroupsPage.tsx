import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Plus, Search, Globe, Lock, Key,
  Crown, ChevronRight, Trophy, Sparkles, Check, Copy,
  LogOut, Trash2, UserMinus, RefreshCw
} from 'lucide-react'
import { Card, Button, Badge, Avatar, Input, EmptyState } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import {
  fetchPublicGroupsFromSupabase,
  findSupabaseGroupByCode,
  fetchGroupMembersFromSupabase,
  fetchAnnouncementsFromSupabase,
  fetchUserGroupsFromSupabase,
  emailToUuid
} from '@/lib/supabaseGroups'
import { formatDistanceToNow } from 'date-fns'
import type { Group, GroupLeaderboardEntry, Announcement } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'my-groups' | 'members' | 'leaderboard' | 'activity' | 'discover'

export function GroupsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('my-groups')
  const [lbFilter, setLbFilter] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('monthly')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [remotePublicCircles, setRemotePublicCircles] = useState<Group[]>([])
  const [remoteMembers, setRemoteMembers] = useState<GroupLeaderboardEntry[]>([])
  const [remoteAnnouncements, setRemoteAnnouncements] = useState<Announcement[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Create group form states
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupVisibility, setNewGroupVisibility] = useState<Group['visibility']>('private')

  // Store bindings
  const user = useAppStore(state => state.user)
  const stats = useAppStore(state => state.stats)
  const groups = useAppStore(state => state.groups)
  const setGroups = useAppStore(state => state.setGroups)
  const activeGroupId = useAppStore(state => state.activeGroupId)
  const setActiveGroup = useAppStore(state => state.setActiveGroup)
  const announcements = useAppStore(state => state.announcements)
  const hasUnreadCircleActivity = useAppStore(state => state.hasUnreadCircleActivity)
  const markCircleActivityRead = useAppStore(state => state.markCircleActivityRead)
  const createGroup = useAppStore(state => state.createGroup)
  const joinGroupWithCode = useAppStore(state => state.joinGroupWithCode)
  const joinGroup = useAppStore(state => state.joinGroup)
  const setViewingFriend = useAppStore(state => state.setViewingFriend)
  const deleteGroup = useAppStore(state => state.deleteGroup)
  const leaveGroup = useAppStore(state => state.leaveGroup)
  const kickMember = useAppStore(state => state.kickMember)

  // Mark circle activity as read when visiting groups
  useEffect(() => {
    markCircleActivityRead()
  }, [markCircleActivityRead])

  const isCircleAdmin = (g?: Group) => {
    if (!g) return false
    const userCanonicalId = user.id || emailToUuid(user.email)
    return Boolean(
      (user.id && g.created_by === user.id) ||
      (userCanonicalId && g.created_by === userCanonicalId) ||
      (user.email && g.creator_email && g.creator_email.toLowerCase() === user.email.toLowerCase()) ||
      (user.email && g.created_by.toLowerCase() === user.email.toLowerCase())
    )
  }

  const activeGroup = groups.find(g => g.id === activeGroupId) ?? groups[0]
  const isUserAdmin = isCircleAdmin(activeGroup)

  // Full refresh of user circles, members, and announcements from Supabase
  const refreshGroupsAndMembers = useCallback(async () => {
    if (!user.id && !user.email) return
    setIsRefreshing(true)
    const userCanonicalId = user.id || emailToUuid(user.email)

    try {
      // 1. Fetch user's circles with accurate real-time member counts
      const userGroups = await fetchUserGroupsFromSupabase(userCanonicalId)
      if (userGroups.length > 0) {
        setGroups(userGroups)
      }

      // 2. Fetch members and announcements for target circle
      const targetGroupId = activeGroupId || userGroups[0]?.id || activeGroup?.id
      if (targetGroupId) {
        const [members, anns] = await Promise.all([
          fetchGroupMembersFromSupabase(targetGroupId),
          fetchAnnouncementsFromSupabase(targetGroupId),
        ])
        setRemoteMembers(members)
        setRemoteAnnouncements(anns)
      }

      // 3. Fetch public circles for discover tab
      fetchPublicGroupsFromSupabase().then(pub => {
        if (pub.length > 0) setRemotePublicCircles(pub)
      }).catch(() => {})
    } finally {
      setIsRefreshing(false)
    }
  }, [user.id, user.email, activeGroupId, activeGroup?.id, setGroups])

  // Initial load on mount
  useEffect(() => {
    refreshGroupsAndMembers()
  }, [])

  // Auto-refresh when active circle changes
  useEffect(() => {
    if (!activeGroup?.id) return
    let isMounted = true
    fetchGroupMembersFromSupabase(activeGroup.id).then(m => {
      if (isMounted) setRemoteMembers(m)
    }).catch(() => {})
    fetchAnnouncementsFromSupabase(activeGroup.id).then(a => {
      if (isMounted) setRemoteAnnouncements(a)
    }).catch(() => {})
    return () => { isMounted = false }
  }, [activeGroup?.id])

  // Live polling every 12 seconds and on window focus so member joins show immediately
  useEffect(() => {
    const handleFocus = () => { refreshGroupsAndMembers() }
    window.addEventListener('focus', handleFocus)
    const interval = setInterval(() => {
      refreshGroupsAndMembers()
    }, 12000)
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [refreshGroupsAndMembers])

  // Guaranteed complete and accurate leaderboard list for active circle
  const effectiveLeaderboard = useMemo(() => {
    if (!activeGroup) return []
    const pts = lbFilter === 'daily' ? stats.points_today : stats.total_points
    const userCanonicalId = user.id || emailToUuid(user.email)
    const userEntry: GroupLeaderboardEntry = {
      user_id: userCanonicalId,
      display_name: user.display_name || user.email.split('@')[0],
      avatar_url: user.avatar_url,
      points: pts,
      rank: 1,
      streak: stats.current_streak,
      active_days: stats.active_days_this_year,
    }

    // Filter remote members to exclude ONLY the current user entry itself (strictly by user_id)
    // NEVER filter or deduplicate by display_name so all distinct users are preserved
    const otherMembers = remoteMembers.filter(m =>
      m.user_id !== user.id &&
      m.user_id !== userCanonicalId
    )

    // Ensure the circle creator is visible if not in remote list yet
    if (!isUserAdmin && activeGroup.created_by) {
      const hasAdmin = otherMembers.some(e =>
        e.user_id === activeGroup.created_by ||
        (activeGroup.creator_email && e.user_id.toLowerCase() === activeGroup.creator_email.toLowerCase())
      )
      if (!hasAdmin) {
        const adminName = activeGroup.creator_email ? activeGroup.creator_email.split('@')[0] : 'Circle Admin'
        const adminAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(adminName)}`
        otherMembers.unshift({
          user_id: activeGroup.created_by,
          display_name: adminName,
          avatar_url: adminAvatar,
          points: 0,
          rank: 1,
          streak: 0,
          active_days: 0,
        })
      }
    }

    const list = [userEntry, ...otherMembers]

    return list
      .sort((a, b) => b.points - a.points)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
  }, [activeGroup, remoteMembers, user, stats, lbFilter, isUserAdmin])

  // Unified announcements (Supabase + local)
  const allAnnouncements = useMemo(() => {
    const map = new Map<string, Announcement>()
    remoteAnnouncements.forEach(a => map.set(a.id, a))
    announcements.forEach(a => map.set(a.id, a))
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [remoteAnnouncements, announcements])

  // Filter members for the Members tab
  const displayedMembers = useMemo(() => {
    if (!effectiveLeaderboard) return []
    if (!memberSearch.trim()) return effectiveLeaderboard
    const q = memberSearch.toLowerCase()
    return effectiveLeaderboard.filter(m => m.display_name.toLowerCase().includes(q))
  }, [effectiveLeaderboard, memberSearch])

  // Discoverable circles catalog (Real Supabase + Real Local Circles ONLY)
  // Extra guard: filter out any old fake/demo groups by known codes/names
  const KNOWN_FAKE_CODES = new Set(['5AMCLUB', 'CODE100', 'DEEPWORK', 'MOVE2026'])
  const KNOWN_FAKE_NAMES = new Set(['5 am club', '100 days of code', 'deep work guild', 'daily movement'])
  const isKnownFake = (g: Group) =>
    KNOWN_FAKE_CODES.has((g.invite_code || '').toUpperCase()) ||
    KNOWN_FAKE_NAMES.has((g.name || '').toLowerCase().trim())

  const discoverableCircles = useMemo(() => {
    const map = new Map<string, Group>()
    // Add real remote public circles from Supabase
    remotePublicCircles.filter(c => !isKnownFake(c)).forEach(c => map.set(c.id, c))
    // Also include user's own public groups if not yet indexed
    groups.filter(g => g.visibility === 'public' && !isKnownFake(g)).forEach(g => map.set(g.id, g))

    const all = Array.from(map.values())
    if (!searchQuery.trim()) return all
    const q = searchQuery.toLowerCase()
    return all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.invite_code && c.invite_code.toLowerCase().includes(q))
    )
  }, [searchQuery, remotePublicCircles, groups])

  // Find admin name for any group
  const getAdminName = (g: Group) => {
    if (isCircleAdmin(g)) return 'You'
    const match = remoteMembers.find(e => e.user_id === g.created_by)
    if (match?.display_name) return match.display_name
    if (g.creator_email) return g.creator_email.split('@')[0]
    return 'Admin'
  }

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCodeInput.trim()) return
    const clean = inviteCodeInput.trim().toUpperCase()
    const alreadyJoined = groups.find(g => (g.invite_code || '').toUpperCase() === clean)
    if (alreadyJoined) {
      setActiveGroup(alreadyJoined.id)
      setJoinMessage('You are already in this circle')
      setInviteCodeInput('')
      setActiveTab('members')
      return
    }
    // Lookup in Supabase directly
    const supaGroup = await findSupabaseGroupByCode(clean)
    if (supaGroup) {
      joinGroup(supaGroup)
      setJoinMessage('Joined circle successfully')
      setInviteCodeInput('')
      setActiveTab('members')
    } else {
      setJoinMessage('Invalid invite code. Please check with the circle admin.')
    }
    setTimeout(() => setJoinMessage(null), 3500)
  }

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    createGroup(newGroupName.trim(), newGroupDesc.trim(), newGroupVisibility)
    setNewGroupName('')
    setNewGroupDesc('')
    setShowCreateModal(false)
    setActiveTab('members')
    // Refresh public circles list
    fetchPublicGroupsFromSupabase().then(fetched => {
      if (fetched.length > 0) setRemotePublicCircles(fetched)
    }).catch(() => {})
  }

  const handleLeaveCircle = () => {
    if (!activeGroup) return
    if (isUserAdmin) {
      const otherMembers = effectiveLeaderboard.filter(m => m.user_id !== user.id)
      if (otherMembers.length > 0) {
        alert("As the Circle admin, you cannot leave while other members are in the Circle. You can delete the Circle if you wish to close it.")
        return
      }
    }
    if (window.confirm(`Are you sure you want to leave "${activeGroup.name}"?`)) {
      leaveGroup(activeGroup.id)
      setActiveTab('my-groups')
    }
  }

  const tabs: { key: Tab; label: string; unread?: boolean }[] = [
    { key: 'my-groups', label: 'My Circles' },
    { key: 'members', label: `Members (${effectiveLeaderboard.length})` },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'activity', label: 'Activity', unread: hasUnreadCircleActivity },
    { key: 'discover', label: 'Discover' },
  ]

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Circles</h1>
            <p className="text-sm text-[#5A6B5D] mt-1">
              Accountability with trusted peers. Task names and journals stay strictly private.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshGroupsAndMembers()}
              disabled={isRefreshing}
              className="gap-1.5"
              title="Refresh circles and members from cloud"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Create Circle
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#1E2220] rounded-xl border border-[#262C28] w-fit overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key)
              if (t.key === 'activity') markCircleActivityRead()
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2',
              activeTab === t.key
                ? 'bg-[#252A27] text-[#C5F36B] shadow-sm'
                : 'text-[#8B9A8E] hover:text-[#F5F5F0]'
            )}
          >
            <span>{t.label}</span>
            {t.unread && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366] shadow-[0_0_6px_#25D366]" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. My Circles Tab */}
      {activeTab === 'my-groups' && (
        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="py-12 text-center p-6 bg-[#181B19] border border-[#262C28] rounded-2xl">
              <Users className="w-10 h-10 text-[#C5F36B] mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-[#F5F5F0]">No Circles Joined Yet</h3>
              <p className="text-xs text-[#8B9A8E] mt-1 max-w-sm mx-auto mb-4">
                Create a circle to invite peers, or enter an invite code to join an existing circle.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create Circle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isActive={group.id === activeGroupId}
                  isUserAdmin={isCircleAdmin(group)}
                  adminName={getAdminName(group)}
                  onSelect={() => {
                    setActiveGroup(group.id)
                    setActiveTab('members')
                  }}
                />
              ))}
            </div>
          )}

          {/* Join with Invite Code Box */}
          <div className="pt-6 border-t border-[#262C28]">
            <h3 className="text-xs font-bold text-[#F5F5F0] uppercase tracking-wider mb-2">
              Join Circle by Invite Code
            </h3>
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <Input
                placeholder="Enter invite code (e.g. GRIND2026)"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="md">
                Join Circle
              </Button>
            </form>
            {joinMessage && (
              <p className={cn(
                'text-xs mt-2 font-medium',
                joinMessage.includes('successfully') ? 'text-[#4ADE80]' : 'text-[#F87171]'
              )}>
                {joinMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. Members Directory Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {!activeGroup ? (
            <div className="py-12 text-center p-6 bg-[#181B19] border border-[#262C28] rounded-2xl">
              <Users className="w-10 h-10 text-[#C5F36B] mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-[#F5F5F0]">No Circle Selected</h3>
              <p className="text-xs text-[#8B9A8E] mt-1 max-w-sm mx-auto mb-4">
                Select a circle from My Circles or create a new one.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create Circle
              </Button>
            </div>
          ) : (
            <>
              {/* Circle Info & Admin Banner */}
              <div className="p-5 bg-[#1E2220] border border-[#262C28] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-bold text-[#F5F5F0]">{activeGroup.name}</h2>
                    {isUserAdmin ? (
                      <Badge variant="warning" className="gap-1 font-semibold">
                        <Crown className="w-3.5 h-3.5 text-[#F59E0B]" /> You are the Admin
                      </Badge>
                    ) : (
                      <Badge variant="muted">Member</Badge>
                    )}
                    <span className="text-xs text-[#5A6B5D]">·</span>
                    <span className="text-xs text-[#5A6B5D]">{effectiveLeaderboard.length} members</span>
                  </div>
                  <p className="text-xs text-[#8B9A8E] line-clamp-1">{activeGroup.description || 'Accountability circle'}</p>
                </div>

                {/* Invite Code with Copy */}
                {activeGroup.invite_code && (
                  <div className="flex items-center gap-2 bg-[#181B19] px-3.5 py-2 rounded-xl border border-[#2E3530] shrink-0">
                    <span className="text-xs text-[#8B9A8E]">Invite Code:</span>
                    <span className="text-xs font-mono font-bold text-[#C5F36B] tracking-wider">{activeGroup.invite_code}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeGroup.invite_code || '')
                        setCopiedCode(true)
                        setTimeout(() => setCopiedCode(false), 2000)
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#8B9A8E] hover:text-[#F5F5F0] bg-[#252A27] px-2 py-1 rounded-md transition-colors ml-1"
                      title="Copy circle invite code"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-[#4ADE80]" />
                          <span className="text-[#4ADE80]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B5D]" />
                <input
                  type="text"
                  placeholder="Search circle members..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1E2220] border border-[#262C28] rounded-xl text-sm text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none focus:border-[#C5F36B]"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2.5">
                {displayedMembers.map(member => {
                  const isMemberAdmin = member.user_id === activeGroup.created_by || (isUserAdmin && member.user_id === user.id)
                  const isSelf = member.user_id === user.id
                  return (
                    <div
                      key={member.user_id}
                      onClick={() => setViewingFriend(member.user_id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group',
                        isSelf
                          ? 'bg-[rgba(197,243,107,0.04)] border-[rgba(197,243,107,0.2)]'
                          : 'bg-[#1E2220] border-[#262C28] hover:border-[#2E3530] hover:bg-[#252A27]'
                      )}
                    >
                      <Avatar src={member.avatar_url} name={member.display_name} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F5F5F0] truncate group-hover:text-[#C5F36B] transition-colors">
                            {member.display_name}
                          </span>
                          {isMemberAdmin && (
                            <Badge variant="warning" className="gap-1 text-[10px] font-semibold">
                              <Crown className="w-3 h-3 text-[#F59E0B]" /> Admin
                            </Badge>
                          )}
                          {!isMemberAdmin && (
                            <Badge variant="muted" className="text-[10px]">
                              Member
                            </Badge>
                          )}
                          {isSelf && (
                            <Badge variant="accent" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#5A6B5D]">
                          <span>{member.streak}d streak</span>
                          <span>·</span>
                          <span>{member.active_days} active days</span>
                          <span>·</span>
                          <span>{member.points.toLocaleString()} pts</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUserAdmin && !isSelf && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Remove ${member.display_name} from ${activeGroup.name}?`)) {
                                kickMember(activeGroup.id, member.user_id)
                              }
                            }}
                            className="p-1.5 hover:bg-[rgba(248,113,113,0.12)] rounded-lg text-[#5A6B5D] hover:text-[#F87171] transition-all"
                            title="Remove from circle"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                        {isSelf && (!isUserAdmin || effectiveLeaderboard.filter(m => m.user_id !== user.id).length === 0) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLeaveCircle()
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8B9A8E] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.1)] rounded-lg transition-all"
                            title="Leave circle"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Leave</span>
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewingFriend(member.user_id)
                          }}
                          className="text-xs text-[#8B9A8E] group-hover:text-[#C5F36B]"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {effectiveLeaderboard.length === 1 && (
                <div className="mt-4 p-5 bg-[#181B19] border border-[#262C28] rounded-2xl text-center">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(197,243,107,0.1)] text-[#C5F36B] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#F5F5F0]">Invite Members to {activeGroup.name}</h3>
                  <p className="text-xs text-[#8B9A8E] mt-1 max-w-md mx-auto">
                    You are the first member. Share your invite code with friends to start comparing daily consistency!
                  </p>
                </div>
              )}

              {/* Circle Management & Actions */}
              <div className="mt-8 pt-6 border-t border-[#262C28] space-y-4">
                <h3 className="text-xs font-bold text-[#5A6B5D] uppercase tracking-wider">Circle Settings</h3>

                {isUserAdmin ? (
                  <div className="p-4 bg-[#181B19] border border-[#262C28] rounded-xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[#F87171] flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-[#F87171]" />
                          Delete Circle
                        </h4>
                        <p className="text-xs text-[#8B9A8E] mt-0.5">
                          As the creator and admin, you have the option to permanently delete this circle for all members.
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete "${activeGroup.name}"? This cannot be undone.`)) {
                            deleteGroup(activeGroup.id)
                            setActiveTab('my-groups')
                          }
                        }}
                        className="gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Circle
                      </Button>
                    </div>

                    {effectiveLeaderboard.filter(m => m.user_id !== user.id).length > 0 && (
                      <div className="p-3 bg-[#1E2220] rounded-lg border border-[#262C28] text-xs text-[#8B9A8E]">
                        <p>
                          * As the Circle admin, you cannot leave while other members are in the circle. You can delete the circle if you wish to close it.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#181B19] border border-[#262C28] rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#F5F5F0]">Leave Circle</h4>
                      <p className="text-xs text-[#8B9A8E] mt-0.5">
                        You will leave this circle and no longer appear on its leaderboard.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLeaveCircle}
                      className="text-xs text-[#F87171] hover:bg-[rgba(248,113,113,0.1)] gap-1.5 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Leave Circle
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          {!activeGroup ? (
            <div className="py-12 text-center p-6 bg-[#181B19] border border-[#262C28] rounded-2xl">
              <Users className="w-10 h-10 text-[#C5F36B] mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-[#F5F5F0]">No circles yet</h3>
              <p className="text-xs text-[#8B9A8E] mt-1 max-w-sm mx-auto mb-4">
                Create a circle or join one with an invite code.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create Circle
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 p-4 bg-[#1E2220] border border-[#262C28] rounded-xl">
                <div>
                  <h2 className="text-sm font-bold text-[#F5F5F0] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#C5F36B]" />
                    {activeGroup.name} Leaderboard
                  </h2>
                  <p className="text-xs text-[#5A6B5D] mt-0.5">
                    Click a member to view their profile.
                  </p>
                </div>

                {/* Time period filter */}
                <div className="flex gap-1 p-1 bg-[#181B19] rounded-lg border border-[#2E3530]">
                  {(['daily', 'weekly', 'monthly', 'alltime'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLbFilter(f)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize',
                        lbFilter === f
                          ? 'bg-[#252A27] text-[#C5F36B]'
                          : 'text-[#5A6B5D] hover:text-[#8B9A8E]'
                      )}
                    >
                      {f === 'alltime' ? 'All Time' : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {effectiveLeaderboard.map(entry => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === user.id}
                    isAdmin={entry.user_id === activeGroup.created_by || (isUserAdmin && entry.user_id === user.id)}
                    onClick={() => setViewingFriend(entry.user_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#5A6B5D] uppercase tracking-wider">
              Circle Milestones & Activity ({allAnnouncements.length})
            </h2>
          </div>

          {allAnnouncements.length === 0 ? (
            <div className="py-8 text-center p-6 bg-[#181B19] border border-[#262C28] rounded-xl">
              <p className="text-xs text-[#5A6B5D]">No circle activity yet. Member achievements and milestones will appear here automatically!</p>
            </div>
          ) : (
            allAnnouncements.map(ann => (
              <Card key={ann.id} className="p-4 bg-[#1E2220] hover:border-[#2E3530] transition-colors">
                <div className="flex items-start gap-3.5">
                  <Avatar
                    src={ann.user?.avatar_url}
                    name={ann.user?.display_name ?? '?'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F5F5F0] font-medium leading-relaxed">
                      {ann.content}
                    </p>
                    <p className="text-xs text-[#5A6B5D] mt-1">
                      {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={ann.type === 'achievement' ? 'accent' : 'warning'} className="shrink-0">
                    {ann.type === 'achievement' ? 'Achievement' : 'Milestone'}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 5. Discover Circles Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B5D]" />
            <input
              placeholder="Search public accountability circles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1E2220] border border-[#262C28] rounded-xl text-sm text-[#F5F5F0] placeholder:text-[#5A6B5D] focus:outline-none focus:border-[#C5F36B]"
            />
          </div>

          <div className="space-y-3">
            {discoverableCircles.length === 0 ? (
              <div className="py-12 text-center p-6 bg-[#181B19] border border-[#262C28] rounded-2xl">
                <Users className="w-10 h-10 text-[#C5F36B] mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-[#F5F5F0]">No Circles Found</h3>
                <p className="text-xs text-[#8B9A8E] mt-1 max-w-sm mx-auto mb-4">
                  {searchQuery ? `No circles match "${searchQuery}"` : 'No public circles currently available.'}
                </p>
                <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Create Public Circle
                </Button>
              </div>
            ) : (
              discoverableCircles.map(g => {
                const isJoined = groups.some(myG => myG.id === g.id)
                const isAdmin = isCircleAdmin(g)
                return (
                  <Card key={g.id} className="p-5 hover:border-[#2E3530] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[rgba(197,243,107,0.08)] border border-[rgba(197,243,107,0.2)] flex items-center justify-center text-lg font-bold text-[#C5F36B] shrink-0">
                          {g.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-bold text-[#F5F5F0] truncate">{g.name}</h3>
                            <Badge variant="muted" className="text-[10px]">Public</Badge>
                            {isAdmin && (
                              <Badge variant="warning" className="gap-1 text-[10px] font-semibold">
                                <Crown className="w-3 h-3 text-[#F59E0B]" /> Admin (You)
                              </Badge>
                            )}
                            {isJoined && !isAdmin && (
                              <Badge variant="accent" className="text-[10px]">Joined</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#8B9A8E] line-clamp-2 mb-2">{g.description}</p>
                          <div className="flex items-center gap-3 text-xs text-[#5A6B5D]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {g.member_count} members
                            </span>
                            {g.invite_code && (
                              <span className="font-mono text-[11px] bg-[#181B19] px-2 py-0.5 rounded border border-[#262C28]">
                                Code: {g.invite_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {isJoined ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveGroup(g.id)
                              setActiveTab('members')
                            }}
                          >
                            View Circle
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              joinGroup(g)
                              setActiveTab('members')
                            }}
                            className="gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Join Circle
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          <div className="mt-8 p-6 bg-[#181B19] border border-[#262C28] rounded-2xl text-center">
            <Users className="w-8 h-8 text-[#C5F36B] mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-[#F5F5F0]">Keep circles small & focused</h3>
            <p className="text-xs text-[#8B9A8E] mt-1 max-w-md mx-auto leading-relaxed">
              Accountability works best with trusted peers who show up every day.
            </p>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#181B19] border border-[#262C28] rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-[#F5F5F0] mb-1">Create Circle</h2>
            <p className="text-xs text-[#5A6B5D] mb-4">Start a private group</p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                label="Circle Name"
                placeholder="e.g. 5AM Club"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                required
              />
              <Input
                label="Description"
                placeholder="Circle mission..."
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8B9A8E]">Privacy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGroupVisibility('private')}
                    className={cn(
                      'p-3 text-xs font-semibold rounded-xl border flex flex-col items-start gap-1 transition-all text-left',
                      newGroupVisibility === 'private'
                        ? 'bg-[rgba(197,243,107,0.1)] border-[#C5F36B] text-[#F5F5F0]'
                        : 'bg-[#1E2220] border-[#262C28] text-[#8B9A8E] hover:border-[#2E3530]'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className={cn('w-3.5 h-3.5', newGroupVisibility === 'private' ? 'text-[#C5F36B]' : 'text-[#8B9A8E]')} />
                      <span>Private</span>
                    </div>
                    <span className="text-[11px] text-[#5A6B5D] leading-tight font-normal">
                      Hidden from Discover. Joined only with Invite Code.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGroupVisibility('public')}
                    className={cn(
                      'p-3 text-xs font-semibold rounded-xl border flex flex-col items-start gap-1 transition-all text-left',
                      newGroupVisibility === 'public'
                        ? 'bg-[rgba(197,243,107,0.1)] border-[#C5F36B] text-[#F5F5F0]'
                        : 'bg-[#1E2220] border-[#262C28] text-[#8B9A8E] hover:border-[#2E3530]'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Globe className={cn('w-3.5 h-3.5', newGroupVisibility === 'public' ? 'text-[#C5F36B]' : 'text-[#8B9A8E]')} />
                      <span>Public</span>
                    </div>
                    <span className="text-[11px] text-[#5A6B5D] leading-tight font-normal">
                      Listed in Discover. Anyone can join with 1 click.
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="md" className="flex-1">
                  Create Circle
                </Button>
                <Button type="button" variant="ghost" size="md" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function GroupCard({
  group,
  isActive,
  isUserAdmin,
  adminName,
  onSelect
}: {
  group: Group
  isActive: boolean
  isUserAdmin: boolean
  adminName?: string
  onSelect: () => void
}) {
  const VisibilityIcon = group.visibility === 'public' ? Globe : Lock

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'p-5 transition-all cursor-pointer',
        isActive
          ? 'bg-[#1E2220] border-[#C5F36B]/40 shadow-[0_0_15px_rgba(197,243,107,0.06)]'
          : 'hover:border-[#2E3530]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[rgba(197,243,107,0.08)] border border-[rgba(197,243,107,0.2)] flex items-center justify-center text-xl font-bold text-[#C5F36B] shrink-0">
          {group.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-bold text-[#F5F5F0] truncate">{group.name}</h3>
            {isUserAdmin ? (
              <Badge variant="warning" className="gap-1 text-[10px] font-semibold">
                <Crown className="w-3 h-3 text-[#F59E0B]" /> Admin (You)
              </Badge>
            ) : adminName ? (
              <span className="text-[11px] text-[#5A6B5D] flex items-center gap-1">
                <Crown className="w-3 h-3 text-[#5A6B5D]" /> Admin: {adminName}
              </span>
            ) : null}
            {isActive && <Badge variant="accent">Active Circle</Badge>}
          </div>
          <p className="text-xs text-[#8B9A8E] mb-2 line-clamp-2">{group.description}</p>
          <div className="flex items-center gap-4 text-xs text-[#5A6B5D]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{group.member_count} members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <VisibilityIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{group.visibility}</span>
            </div>
            {group.invite_code && (
              <span className="text-[11px] font-mono bg-[#181B19] px-2 py-0.5 rounded border border-[#262C28]">
                Code: {group.invite_code}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-[#5A6B5D]', isActive && 'text-[#C5F36B]')} />
      </div>
    </Card>
  )
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  isAdmin,
  onClick
}: {
  entry: ReturnType<typeof useAppStore.getState>['leaderboard'][0]
  isCurrentUser: boolean
  isAdmin: boolean
  onClick: () => void
}) {
  const rankColor = entry.rank === 1 ? 'text-[#F59E0B]' : entry.rank === 2 ? 'text-[#94A3B8]' : entry.rank === 3 ? 'text-[#CD7F32]' : 'text-[#5A6B5D]'

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group',
        isCurrentUser
          ? 'bg-[rgba(197,243,107,0.04)] border-[rgba(197,243,107,0.2)]'
          : 'bg-[#1E2220] border-[#262C28] hover:border-[#2E3530] hover:bg-[#252A27]'
      )}
    >
      <div className="w-8 text-center font-bold text-sm">
        <span className={rankColor}>#{entry.rank}</span>
      </div>

      <Avatar src={entry.avatar_url} name={entry.display_name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#F5F5F0] truncate group-hover:text-[#C5F36B] transition-colors">
            {entry.display_name}
          </span>
          {isAdmin && (
            <Badge variant="warning" className="gap-1 text-[10px] font-semibold">
              <Crown className="w-3 h-3 text-[#F59E0B]" /> Admin
            </Badge>
          )}
          {isCurrentUser && <Badge variant="accent">You</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5A6B5D]">
          <span>{entry.streak}d streak</span>
          <span>·</span>
          <span>{entry.active_days} active days</span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-[#C5F36B]">{entry.points.toLocaleString()}</p>
        <p className="text-[10px] text-[#5A6B5D]">points</p>
      </div>
    </div>
  )
}
