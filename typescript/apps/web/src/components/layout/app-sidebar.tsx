import { Link, useLocation } from 'react-router'
import {
  Calendar,
  Users,
  ListTodo,
  LayoutDashboard,
  BarChart3,
  Settings,
  PanelLeft,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { ModeToggle } from '@/components/mode-toggle'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: ListTodo, label: 'Tasks', href: '/tasks' },
  { icon: Calendar, label: 'Appointments', href: '/appointments' },
  { icon: Users, label: 'Patients', href: '/patients' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function AppSidebar() {
  const location = useLocation()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        {isCollapsed ? (
          // When collapsed, show clickable expand button
          <button
            onClick={toggleSidebar}
            className="flex h-12 w-full items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Expand sidebar (B)"
          >
            <PanelLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        ) : (
          // When expanded, show logo and collapse button
          <div className="flex items-center justify-between px-2 py-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold">
                VX
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">VagusX</div>
                <div className="text-xs text-muted-foreground">AI Voice Tasks</div>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Collapse sidebar (B)"
            >
              <PanelLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Clickable area when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Expand sidebar"
          />
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.href} className="relative z-20">
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-center py-2 relative z-20">
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
