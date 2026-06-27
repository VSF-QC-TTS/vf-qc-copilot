import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Globe,
  CheckSquare,
  Table,
  CheckCircle2,
  Circle,
  BarChart,
  LayoutDashboard,
  ChevronRight,
  Database,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import { useSidebar, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectSwitcher } from './ProjectSwitcher'
import { UserNav } from './UserNav'
import { useSetupStatus } from '@/features/project/hooks/use-projects'

export function AppSidebar() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const location = useLocation()
  const { state } = useSidebar()

  const isProjectListMode = !publicId

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex flex-col gap-2 pt-2">
          {state !== 'collapsed' && (
            <div className="flex h-8 items-center px-4">
              <span className="font-semibold text-foreground/80 tracking-tight">{t('app.name')}</span>
            </div>
          )}
          <ProjectSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isProjectListMode ? null : <ProjectNavSidebar publicId={publicId} location={location} />}
      </SidebarContent>

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}



function ProjectNavSidebar({ publicId, location }: { publicId: string; location: any }) {
  const { t } = useTranslation('project')
  const { data: status, isLoading } = useSetupStatus(publicId)

  const setupItems = [
    { name: t('nav.targetConfig'), path: `/projects/${publicId}/config/target`, icon: Globe, done: status?.hasTargetConfig },
    { name: t('nav.llmJudge'), path: `/projects/${publicId}/config/ai`, icon: Settings, done: status?.hasAiConfig },
    { name: t('nav.datasetSchema'), path: `/projects/${publicId}/config/schema`, icon: Table, done: status?.hasProjectSchema },
    { name: t('nav.verification'), path: `/projects/${publicId}/config/verification`, icon: CheckSquare, done: status?.hasVerification },
  ]

  const executionItems = [
    { name: t('nav.datasets'), path: `/projects/${publicId}/datasets`, icon: Database, done: status?.hasDatasets },
    { name: t('nav.testRuns'), path: `/projects/${publicId}/runs`, icon: BarChart },
  ]

  const isSetupComplete = 
    status?.hasTargetConfig && 
    status?.hasAiConfig && 
    status?.hasProjectSchema && 
    status?.hasVerification &&
    status?.hasDatasets
  const defaultOpen = !isSetupComplete

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === `/projects/${publicId}`}>
                <Link to={`/projects/${publicId}`}>
                  <LayoutDashboard />
                  <span>{t('nav.overview')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger>
              {t('nav.setup')}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 flex-1 rounded" />
                        </div>
                      </SidebarMenuItem>
                    ))
                    : setupItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link to={item.path} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <item.icon />
                                  <span>{item.name}</span>
                                </div>
                                {item.done !== undefined &&
                                  (item.done ? (
                                    <CheckCircle2 className="text-emerald-500" />
                                  ) : (
                                    <Circle className="text-muted-foreground/50" />
                                  ))}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.execution')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {executionItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon />
                          <span>{item.name}</span>
                        </div>
                      {item.done !== undefined &&
                        (item.done ? (
                          <CheckCircle2 className="text-emerald-500" />
                        ) : (
                          <Circle className="text-muted-foreground/50" />
                        ))}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === `/projects/${publicId}/settings`}>
                <Link to={`/projects/${publicId}/settings`}>
                  <Settings />
                  <span>{t('nav.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
