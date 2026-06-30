import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, LogOut, Moon, Sun, User, ShieldCheck } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { useAuth } from '@/features/auth/auth-session'

export function UserNav() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()
  const { isMobile } = useSidebar()

  if (!user) return null

  const initials = user.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                {user.avatarUrl && (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="rounded-full"
                  />
                )}
                <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user.displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded border border-slate-200 bg-white shadow-sm"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100 rounded-md transition-colors focus:bg-slate-100 py-2 px-3">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  {t('user.profile', 'Hồ sơ cá nhân')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer hover:bg-slate-100 rounded-md transition-colors focus:bg-slate-100 py-2 px-3">
                <Sun className="mr-2 h-4 w-4 dark:hidden" />
                <Moon className="mr-2 h-4 w-4 hidden dark:block" />
                {t('user.toggleTheme', 'Đổi giao diện')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {user.role === 'ADMIN' && (
              <>
                <DropdownMenuSeparator className="bg-slate-200 my-1" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-100 rounded-md transition-colors focus:bg-slate-100 py-2 px-3">
                    <Link to="/admin/users">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {t('user.admin', 'Quản trị Hệ thống')}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator className="bg-slate-200 my-1" />
            <DropdownMenuItem onClick={() => logout()} className="cursor-pointer hover:bg-red-50 text-red-600 rounded-md transition-colors focus:bg-red-50 focus:text-red-600 py-2 px-3">
              <LogOut className="mr-2 h-4 w-4" />
              {t('user.logout', 'Đăng xuất')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
