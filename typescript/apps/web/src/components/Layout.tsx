import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
  Button,
} from '@repo/ui'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    {
      title: 'Appointments',
      href: '/',
      icon: Calendar,
    },
    {
      title: 'Claims',
      href: '/claims',
      icon: FileText,
    },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed}>
        <SidebarHeader className="flex items-center justify-between">
          {!collapsed && <h2 className="text-xl font-bold">Health Portal</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={collapsed ? 'w-full' : ''}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <SidebarNavItem
                  key={item.href}
                  as={Link}
                  to={item.href}
                  active={isActive}
                  collapsed={collapsed}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {!collapsed && <span>{item.title}</span>}
                </SidebarNavItem>
              )
            })}
          </SidebarNav>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}
