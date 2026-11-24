import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, User, Edit3 } from 'lucide-react'
import { Card, SectionHeader, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { EditProfileModal } from '@/components/profile/EditProfileModal'

export function SettingsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Notification toggles state
  const [notifications, setNotifications] = useState({
    achievement: true,
    group: true,
    dailyReminder: false,
  })

  const user = useAppStore(state => state.user)
  const profile = useAppStore(state => state.profile)

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#F5F5F0]">Settings</h1>
      </motion.div>

      <div className="space-y-5">
        {/* Account Info & Edit Profile */}
        <Card className="p-5 bg-[#1E2220] border-[#262C28]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C5F36B]" />
              <SectionHeader title="Account Identity" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </div>
          <div className="flex items-center gap-4 p-3 bg-[#181B19] rounded-xl border border-[#262C28]">
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-12 h-12 rounded-full object-cover bg-[#252A27] border border-[#2E3530]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#F5F5F0] truncate">{user.display_name}</p>
              <p className="text-xs text-[#5A6B5D] truncate">{user.email}</p>
              <p className="text-[11px] text-[#8B9A8E] mt-0.5 truncate">{profile.bio || 'Bare-minimum habits builder'}</p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5 bg-[#1E2220] border-[#262C28]">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-[#C5F36B]" />
            <SectionHeader title="Notifications" />
          </div>
          <div className="space-y-1">
            <InteractiveToggleRow
              label="Achievement Milestones"
              desc="Alerts when you unlock active-day and monthly badges"
              enabled={notifications.achievement}
              onToggle={() => toggleNotification('achievement')}
            />
            <InteractiveToggleRow
              label="Circle Activity & Announcements"
              desc="Badge completions and milestone achievements in your groups"
              enabled={notifications.group}
              onToggle={() => toggleNotification('group')}
            />
            <InteractiveToggleRow
              label="Daily Commitments Reminder"
              desc="Reminder if scheduled tasks remain incomplete near evening"
              enabled={notifications.dailyReminder}
              onToggle={() => toggleNotification('dailyReminder')}
            />
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  )
}

function InteractiveToggleRow({
  label,
  desc,
  enabled,
  onToggle
}: {
  label: string
  desc: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-[#181B19]/50 transition-colors border-b border-[#1A1D1B] last:border-0"
    >
      <div>
        <p className="text-sm font-medium text-[#F5F5F0]">{label}</p>
        <p className="text-xs text-[#5A6B5D]">{desc}</p>
      </div>
      <div
        className={cn(
          'w-9 h-5 rounded-full flex items-center transition-colors shrink-0',
          enabled ? 'bg-[#C5F36B]' : 'bg-[#2E3530]'
        )}
      >
        <div
          className={cn(
            'w-3.5 h-3.5 bg-[#101211] rounded-full shadow transition-transform',
            enabled ? 'translate-x-4' : 'translate-x-1'
          )}
        />
      </div>
    </div>
  )
}
