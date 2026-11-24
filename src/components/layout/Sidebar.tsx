import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Sun, Target, Flame,
  BookOpen, Users, Bell, User, Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Logo } from '@/components/ui'
import { GroupSwitcher } from './GroupSwitcher'

const mainNav = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/my-day', icon: Sun, label: 'My Day' },
  { to: '/goals', icon: Target, label: 'My Goals' },
  { to: '/consistency', icon: Flame, label: 'Consistency' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/groups', icon: Users, label: 'My Groups' },
]

const secondaryNav = [
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const user = useAppStore(state => state.user)
  const notifications = useAppStore(state => state.notifications)
  const hasUnreadCircleActivity = useAppStore(state => state.hasUnreadCircleActivity)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#181B19] border-r border-[#262C28] h-full shrink-0">
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#262C28]">
        <div className="mb-3">
          <Logo showText size="md" />
        </div>

        {/* Group Switcher */}
        <GroupSwitcher />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-2.5 pb-1 text-[10px] font-semibold text-[#5A6B5D] uppercase tracking-wider">
          Workspace
        </p>
        {mainNav.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            hasUnreadDot={item.to === '/groups' && hasUnreadCircleActivity}
          />
        ))}
      </nav>

      {/* Secondary nav */}
      <div className="px-2.5 py-2.5 border-t border-[#262C28] space-y-0.5">
        {secondaryNav.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            badge={item.to === '/notifications' && unreadCount > 0 ? unreadCount : undefined}
          />
        ))}
      </div>

      {/* User profile & Logout */}
      <div className="p-2 border-t border-[#262C28] flex items-center justify-between gap-2">
        <NavLink
          to="/profile"
          className="flex-1 flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#1E2220] transition-colors group min-w-0"
        >
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-7 h-7 rounded-full object-cover bg-[#2E3530] border border-[#2E3530] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F5F5F0] truncate">{user.display_name}</p>
            <p className="text-[10px] text-[#5A6B5D] truncate">{user.email}</p>
          </div>
        </NavLink>
        <button
          onClick={() => useAppStore.getState().logout()}
          className="p-2 text-[#5A6B5D] hover:text-[#F87171] hover:bg-[#1E2220] rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({
  to, icon: Icon, label, badge, hasUnreadDot
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
  hasUnreadDot?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group relative',
          isActive
            ? 'bg-[#1E2220] text-[#F5F5F0] font-semibold'
            : 'text-[#8B9A8E] hover:text-[#F5F5F0] hover:bg-[#1A1D1B]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#C5F36B]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#C5F36B]' : 'text-[#5A6B5D] group-hover:text-[#8B9A8E]')} />
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span className="ml-auto bg-[#C5F36B] text-[#101211] text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center justify-center">
              {badge}
            </span>
          )}
          {hasUnreadDot && (
            <span className="relative flex h-2.5 w-2.5 ml-auto" title="New Circle Activity">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366] shadow-[0_0_8px_#25D366]" />
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
