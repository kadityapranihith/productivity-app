import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { FriendProfileModal } from '@/components/profile/FriendProfileModal'
import { BadgeDetailModal } from '@/components/achievements/BadgeDetailModal'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#101211]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global Modals */}
      <FriendProfileModal />
      <BadgeDetailModal />
    </div>
  )
}
