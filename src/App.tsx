import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { MyDayPage } from '@/pages/MyDayPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { ConsistencyPage } from '@/pages/ConsistencyPage'
import { AchievementsPage } from '@/pages/AchievementsPage'
import { JournalPage } from '@/pages/JournalPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AuthPage } from '@/pages/AuthPage'
import { useAppStore } from '@/lib/store'

export default function App() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated)
  const syncWithCloud = useAppStore(state => state.syncWithCloud)

  // Rehydrate latest cloud data on mount or after login
  useEffect(() => {
    if (isAuthenticated) {
      syncWithCloud()
    }
  }, [isAuthenticated, syncWithCloud])

  return (
    <Routes>
      <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/overview" replace />} />
      <Route path="/" element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<DashboardPage />} />
        <Route path="my-day" element={<MyDayPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="consistency" element={<ConsistencyPage />} />
        <Route path="achievements" element={<Navigate to="/consistency?tab=badges" replace />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/overview" : "/auth"} replace />} />
    </Routes>
  )
}
