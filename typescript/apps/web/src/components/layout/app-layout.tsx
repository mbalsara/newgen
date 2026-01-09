import { Outlet, useLocation } from 'react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  const location = useLocation()

  // Tasks, Queues, and Settings pages have their own full-height layout
  const isFullHeightPage = location.pathname === '/tasks' || location.pathname === '/queues' || location.pathname === '/settings'

  return (
    <SidebarProvider className={isFullHeightPage ? 'h-svh max-h-svh' : ''}>
      <AppSidebar />
      <SidebarInset className={isFullHeightPage ? 'overflow-hidden' : ''}>
        <div className={isFullHeightPage ? 'h-full flex flex-col overflow-hidden' : 'flex-1 overflow-auto'}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
