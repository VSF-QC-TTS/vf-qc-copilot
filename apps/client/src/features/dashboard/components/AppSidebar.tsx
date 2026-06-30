import { useLocation, useParams } from 'react-router-dom'
import { Sidebar, SidebarFooter } from '@/components/ui/sidebar'
import { UserNav } from './UserNav'
import { AdminSidebar } from './AdminSidebar'
import { ProjectSidebar } from './ProjectSidebar'
import { GlobalSidebar } from './GlobalSidebar'

export function AppSidebar() {
  const { publicId } = useParams<{ publicId: string }>()
  const location = useLocation()

  const isAdminRoute = location.pathname.startsWith('/admin')
  const isProjectRoute = Boolean(publicId) && !isAdminRoute

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      {isAdminRoute ? (
        <AdminSidebar />
      ) : isProjectRoute ? (
        <ProjectSidebar publicId={publicId as string} />
      ) : (
        <GlobalSidebar />
      )}

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}
