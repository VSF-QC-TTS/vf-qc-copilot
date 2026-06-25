import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Database,
  FileCheck2,
  Table,
  CheckCircle2,
  Circle,
  BarChart,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { ProjectSwitcher } from './ProjectSwitcher'
import { UserNav } from './UserNav'
import { useProjectsInfinite, useSetupStatus } from '@/features/project/hooks/use-projects'

export function AppSidebar() {
  const { publicId } = useParams<{ publicId: string }>()
  const location = useLocation()
  
  // If we are at /projects (no publicId), we show the Project List mode
  const isProjectListMode = !publicId

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        {isProjectListMode ? (
          <div className="flex h-12 items-center px-4">
            <span className="font-semibold">VF QC Copilot</span>
          </div>
        ) : (
          <ProjectSwitcher />
        )}
      </SidebarHeader>

      <SidebarContent>
        {isProjectListMode ? <ProjectListSidebar /> : <ProjectNavSidebar publicId={publicId} location={location} />}
      </SidebarContent>

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}

function ProjectListSidebar() {
  const { data } = useProjectsInfinite()
  const projects = data?.pages.flatMap((p) => p.content) || []

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((project) => (
            <SidebarMenuItem key={project.publicId}>
              <SidebarMenuButton asChild>
                <Link to={`/projects/${project.publicId}`}>
                  <span className="truncate">{project.name}</span>
                  <Badge variant="secondary" className="ml-auto flex shrink-0 size-2 p-0 rounded-full bg-emerald-500" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function ProjectNavSidebar({ publicId, location }: { publicId: string, location: any }) {
  const { t } = useTranslation('project')
  const { data: status } = useSetupStatus(publicId)

  const setupItems = [
    { name: t('nav.apiConfig'), path: `/projects/${publicId}/config/target`, icon: Database, done: status?.hasTargetConfig },
    { name: t('nav.llmJudge'), path: `/projects/${publicId}/config/judge`, icon: Settings, done: status?.hasJudgeConfig },
    { name: t('nav.datasetSchema'), path: `/projects/${publicId}/dataset-schema`, icon: Table, done: status?.hasDatasetSchema },
    { name: t('nav.verification'), path: `/projects/${publicId}/verification`, icon: FileCheck2, done: status?.hasVerification },
  ]

  const executionItems = [
    { name: t('nav.datasets'), path: `/projects/${publicId}/datasets`, icon: Database, done: status?.hasDatasets },
    { name: t('nav.testRuns'), path: `/projects/${publicId}/runs`, icon: BarChart },
  ]

  // Auto-collapse if all setup steps are done
  const isSetupDone =
    status?.hasTargetConfig &&
    status?.hasJudgeConfig &&
    status?.hasDatasetSchema &&
    status?.hasVerification &&
    status?.hasDatasets
  const defaultOpen = !isSetupDone

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === `/projects/${publicId}`}>
                <Link to={`/projects/${publicId}`}>
                  <LayoutDashboard className="size-4" />
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
              Setup & Configuration
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {setupItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.path} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                          </div>
                          {item.done !== undefined && (
                            item.done ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground/30" />
                            )
                          )}
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
        <SidebarGroupLabel>Execution</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {executionItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={item.path} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.done !== undefined && (
                        item.done ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/30" />
                        )
                      )}
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === `/projects/${publicId}/settings`}>
                <Link to={`/projects/${publicId}/settings`}>
                  <Settings className="size-4" />
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
