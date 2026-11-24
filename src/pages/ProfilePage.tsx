import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Camera, Edit3, Download, RotateCcw, LogOut, CheckCircle2 } from 'lucide-react'
import { Card, Button, Badge, Avatar, StatCard, SectionHeader } from '@/components/ui'
import { ConsistencyHeatmap } from '@/components/heatmap/ConsistencyHeatmap'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { useAppStore } from '@/lib/store'

export function ProfilePage() {
  const currentYear = new Date().getFullYear()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const user = useAppStore(state => state.user)
  const profile = useAppStore(state => state.profile)
  const stats = useAppStore(state => state.stats)
  const achievements = useAppStore(state => state.achievements)
  const userAchievements = useAppStore(state => state.userAchievements)
  const heatmapData = useAppStore(state => state.heatmapData)
  const setInspectingBadge = useAppStore(state => state.setInspectingBadge)
  const resetToFreshAccount = useAppStore(state => state.resetToFreshAccount)
  const logout = useAppStore(state => state.logout)

  const earnedAchs = userAchievements.map(ua => ({
    ...ua,
    achievement: achievements.find(a => a.id === ua.achievement_id)
  }))

  const handleExportData = () => {
    const state = useAppStore.getState()
    const exportData = {
      exported_at: new Date().toISOString(),
      user: state.user,
      profile: state.profile,
      stats: state.stats,
      tasks: state.tasks,
      goals: state.goals,
      completions: state.completions,
      journalEntries: state.journalEntries,
      userAchievements: state.userAchievements,
      groups: state.groups,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barely-productive-${user.display_name.toLowerCase().replace(/\s+/g, '-')}-data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportNotice('Data backup exported successfully!')
    setTimeout(() => setExportNotice(null), 4000)
  }

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Profile</h1>
      </motion.div>

      {/* Profile Card */}
      <Card className="p-6 bg-[#1E2220] border-[#262C28]">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative">
            <Avatar src={user.avatar_url} name={user.display_name} size="xl" />
            <button
              onClick={() => setIsEditModalOpen(true)}
              title="Change Avatar"
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#C5F36B] rounded-full flex items-center justify-center hover:bg-[#D4F88A] transition-colors shadow"
            >
              <Camera className="w-3.5 h-3.5 text-[#101211]" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#F5F5F0]">{user.display_name}</h2>
                <p className="text-xs text-[#5A6B5D] font-mono">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            </div>
            <p className="text-sm text-[#8B9A8E] mt-2.5 leading-relaxed">
              {profile.bio || 'Showing up daily.'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.map(interest => (
                <Badge key={interest} variant="muted" className="capitalize">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Streak" value={`${stats.current_streak}d`} accent />
        <StatCard label="Longest Streak" value={`${stats.longest_streak}d`} sub="all time" />
        <StatCard label="Active Days" value={stats.active_days_this_year} sub={`in ${currentYear}`} />
        <StatCard label="Total Points" value={stats.total_points.toLocaleString()} sub="lifetime" />
      </div>

      {/* Heatmap */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <SectionHeader
          title="Consistency Matrix"
          subtitle={`Your ${currentYear} showing-up map`}
          className="mb-4"
        />
        <ConsistencyHeatmap data={heatmapData} compact />
      </Card>

      {/* Earned Badges Showcase */}
      <Card className="p-5 md:p-6 bg-[#1E2220] border-[#262C28]">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Badges"
            subtitle={`${earnedAchs.length} earned`}
          />
        </div>
        {earnedAchs.length === 0 ? (
          <p className="text-sm text-[#5A6B5D] text-center py-6">No badges earned yet. Keep showing up!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {earnedAchs.map(ua => ua.achievement && (
              <button
                key={ua.id}
                onClick={() => setInspectingBadge(ua.achievement!)}
                className="flex flex-col items-center gap-2 p-3 bg-[rgba(197,243,107,0.04)] border border-[rgba(197,243,107,0.2)] rounded-xl hover:bg-[rgba(197,243,107,0.08)] transition-all text-center group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{ua.achievement.icon}</span>
                <span className="text-xs font-semibold text-[#F5F5F0] truncate w-full">{ua.achievement.name}</span>
                <span className="text-[10px] text-[#5A6B5D]">{format(new Date(ua.earned_at), 'MMM yyyy')}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Data & Account */}
      <Card className="p-5 bg-[#1E2220] border-[#262C28]">
        <SectionHeader
          title="Data & Account"
          subtitle="Manage your personal data backup and account actions"
          className="mb-4"
        />

        {exportNotice && (
          <div className="mb-4 p-3 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.25)] rounded-xl flex items-center gap-2 text-xs text-[#4ADE80]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="gap-2 text-[#F5F5F0] hover:text-[#C5F36B] border-[#2E3530]"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to start a fresh slate? All tasks and points will reset to 0.')) {
                resetToFreshAccount()
              }
            }}
            className="gap-2 text-[#C5F36B] border-[rgba(197,243,107,0.3)] hover:bg-[rgba(197,243,107,0.1)]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Progress
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="gap-2 text-[#F87171] border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.1)]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  )
}
