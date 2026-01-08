import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  const location = useLocation()

  // Tasks and Queues pages have their own full-height layout
  const isFullHeightPage = location.pathname === '/tasks' || location.pathname === '/queues'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={isFullHeightPage ? 'overflow-hidden min-h-0' : ''}>
        <div className={isFullHeightPage ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'flex-1 overflow-auto'}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
