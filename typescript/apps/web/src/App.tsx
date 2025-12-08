import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import HomePage from '@/pages/HomePage'
import TodayPage from '@/pages/TodayPage'
import UpcomingPage from '@/pages/UpcomingPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import AgentsPage from '@/pages/AgentsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/login'
import './index.css'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="physician-office-theme" attribute="class">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/patient/:id" element={<PatientDetailPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
