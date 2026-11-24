import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sun, Flame, Target, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

const mobileNav = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/my-day', icon: Sun, label: 'Today' },
  { to: '/consistency', icon: Flame, label: 'Consistency' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/groups', icon: Users, label: 'Groups' },
]

export function MobileNav() {
  const hasUnreadCircleActivity = useAppStore(state => state.hasUnreadCircleActivity)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#181B19] border-t border-[#262C28] z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {mobileNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors relative',
                isActive ? 'text-[#C5F36B]' : 'text-[#5A6B5D]'
              )
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {to === '/groups' && hasUnreadCircleActivity && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366] shadow-[0_0_6px_#25D366]" />
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
