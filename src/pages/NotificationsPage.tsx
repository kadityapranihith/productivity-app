import { motion } from 'framer-motion'
import { Bell, Trophy, Calendar, Users, MessageSquare, CheckCheck } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'
import type { NotificationType } from '@/types'
import { cn } from '@/lib/utils'

function getIcon(type: NotificationType) {
  switch (type) {
    case 'achievement_unlocked': return <Trophy className="w-4 h-4 text-[#C5F36B]" />
    case 'monthly_badge': return <Calendar className="w-4 h-4 text-[#60A5FA]" />
    case 'yearly_milestone': return <Trophy className="w-4 h-4 text-[#F59E0B]" />
    case 'group_announcement': return <Users className="w-4 h-4 text-[#A78BFA]" />
    case 'group_join_request': return <Users className="w-4 h-4 text-[#34D399]" />
    case 'group_invitation': return <MessageSquare className="w-4 h-4 text-[#60A5FA]" />
    default: return <Bell className="w-4 h-4 text-[#8B9A8E]" />
  }
}

export function NotificationsPage() {
  const notifications = useAppStore(state => state.notifications)
  const markNotificationRead = useAppStore(state => state.markNotificationRead)
  const markAllNotificationsRead = useAppStore(state => state.markAllNotificationsRead)

  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F0]">Notifications</h1>
            <p className="text-sm text-[#8B9A8E] mt-1">
              Important circle milestones, achievements, and reminders.
            </p>
          </div>
          {unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
              className="gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </motion.div>

      <div className="space-y-6">
        {unread.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#C5F36B] uppercase tracking-wider mb-3">
              Unread Updates ({unread.length})
            </p>
            <div className="space-y-2">
              {unread.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => markNotificationRead(n.id)}
                />
              ))}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#5A6B5D] uppercase tracking-wider mb-3">
              Earlier
            </p>
            <div className="space-y-2">
              {read.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="p-12 text-center text-[#5A6B5D] bg-[#1E2220] border border-[#262C28] rounded-xl">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">You're all caught up! No notifications.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationItem({
  notification,
  onClick
}: {
  notification: ReturnType<typeof useAppStore.getState>['notifications'][0]
  onClick: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 transition-all cursor-pointer',
        !notification.read
          ? 'bg-[#1E2220] border-[rgba(197,243,107,0.25)] hover:border-[#C5F36B]/40'
          : 'bg-[#181B19] border-[#262C28] hover:border-[#2E3530]'
      )}
    >
      <div className="flex gap-3.5">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
          !notification.read
            ? 'bg-[rgba(197,243,107,0.08)] border-[rgba(197,243,107,0.2)]'
            : 'bg-[#1E2220] border-[#262C28]'
        )}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-semibold truncate',
              notification.read ? 'text-[#8B9A8E]' : 'text-[#F5F5F0]'
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-[#C5F36B] shrink-0 mt-1" />
            )}
          </div>
          <p className="text-xs text-[#8B9A8E] mt-0.5 leading-relaxed">
            {notification.body}
          </p>
          <p className="text-[10px] text-[#5A6B5D] mt-1.5 font-medium">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  )
}
