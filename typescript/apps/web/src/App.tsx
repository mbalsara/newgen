import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TasksProvider } from '@/contexts/tasks-context'
import { AppLayout } from '@/components/layout/app-layout'

// Pages
import HomePage from '@/pages/HomePage'
import AppointmentsPage from '@/pages/AppointmentsPage'
import PatientsPage from '@/pages/PatientsPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import TasksPage from '@/pages/TasksPage'
import QueuePage from '@/pages/QueuePage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/login'

import './index.css'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vagusx-theme" attribute="class">
      <TasksProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes (no sidebar) */}
            <Route path="/auth/login" element={<LoginPage />} />

            {/* Main app routes (with sidebar) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patient/:id" element={<PatientDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/queues" element={<QueuePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Legacy routes (redirect for backwards compatibility) */}
            <Route path="/today" element={<Navigate to="/appointments" replace />} />
            <Route path="/upcoming" element={<Navigate to="/appointments" replace />} />
            <Route path="/agents" element={<Navigate to="/settings" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TasksProvider>
    </ThemeProvider>
  )
}

export default App
