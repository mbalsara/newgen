import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { UserProvider } from '@/contexts/user-context'
import { TasksProvider } from '@/contexts/tasks-context'
import { AppLayout } from '@/components/layout/app-layout'

// Pages
import AppointmentsPage from '@/pages/AppointmentsPage'
import PatientsPage from '@/pages/PatientsPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import TasksPage from '@/pages/TasksPage'
import DashboardPage from '@/pages/DashboardPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'
import AgentsSummaryPage from '@/pages/AgentsSummaryPage'
import AgentDetailPage from '@/pages/AgentDetailPage'
import PromptBuilderPage from '@/pages/PromptBuilderPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/login'

import './index.css'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vagusx-theme" attribute="class">
      <UserProvider>
        <TasksProvider>
          <BrowserRouter>
          <Routes>
            {/* Auth routes (no sidebar) */}
            <Route path="/auth/login" element={<LoginPage />} />

            {/* Main app routes (with sidebar) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patient/:id" element={<PatientDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/agents" element={<AgentsSummaryPage />} />
              <Route path="/agents/:id" element={<AgentDetailPage />} />
              <Route path="/agents/:id/prompt-builder" element={<PromptBuilderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Legacy routes (redirect for backwards compatibility) */}
            <Route path="/today" element={<Navigate to="/appointments" replace />} />
            <Route path="/upcoming" element={<Navigate to="/appointments" replace />} />
            <Route path="/queues" element={<Navigate to="/" replace />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
          </BrowserRouter>
        </TasksProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
