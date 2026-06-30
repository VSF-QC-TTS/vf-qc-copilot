import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  Users,
  ArrowLeft
} from 'lucide-react'
import { motion } from 'motion/react'

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function AdminSidebar() {
  const location = useLocation()
  const isUsersActive = location.pathname === '/admin/users'

  return (
    <>
      <SidebarHeader>
        <Link to="/projects" className="flex items-center gap-2 px-3 py-2.5 m-2 select-none cursor-pointer hover:bg-slate-100 rounded-md transition-colors border border-slate-200 bg-slate-50">
          <ArrowLeft className="size-4 text-slate-500" />
          <span className="font-semibold text-sm text-foreground">
            Quay lại Dự án
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="select-none text-xs font-semibold text-slate-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden mt-2">
            <ShieldCheck className="mr-1.5 size-4" />
            Quản trị Hệ thống
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "relative transition-all duration-200 select-none",
                    isUsersActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  <Link to="/admin/users">
                    <Users className="z-10" />
                    <span className="z-10 flex-1 truncate">Người dùng</span>
                    {isUsersActive && (
                      <motion.div
                        layoutId="active-admin-sidebar-pill"
                        className="absolute inset-0 z-0 rounded-md bg-blue-50"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}
