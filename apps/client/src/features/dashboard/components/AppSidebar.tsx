import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Globe,
  CheckSquare,
  Table,
  Check,
  BarChart,
  LayoutDashboard,
  ChevronRight,
  Database,
} from 'lucide-react'
import { motion } from 'motion/react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectSwitcher } from './ProjectSwitcher'
import { UserNav } from './UserNav'
import { useSetupStatus } from '@/features/project/hooks/use-projects'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const location = useLocation()
  const { state } = useSidebar()

  const isProjectListMode = !publicId

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader>
        <div className="flex flex-col gap-2 pt-2 select-none">
          {state !== 'collapsed' ? (
            <div className="flex h-8 items-center justify-center gap-2.5 px-4">
              <img src="/logo.png" className="sidebar-logo" alt="VinFast Logo" />
              <span className="font-semibold text-foreground/80 tracking-tight text-sm flex items-center">
                {t('app.name')}
              </span>
            </div>
          ) : (
            <div className="flex h-8 items-center justify-center">
              <img src="/logo.png" className="sidebar-logo" alt="VinFast Logo" />
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
    { name: t('nav.apiConfig'), path: `/projects/${publicId}/config/target`, icon: Globe, done: status?.hasTargetConfig },
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

  const isOverviewActive = location.pathname === `/projects/${publicId}`

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className={cn(
                  "relative transition-all duration-200 select-none",
                  isOverviewActive ? "font-medium text-sidebar-accent-foreground" : "text-muted-foreground/80 hover:text-foreground"
                )}
              >
                <Link to={`/projects/${publicId}`}>
                  <div className="flex items-center gap-2 z-10">
                    <LayoutDashboard />
                    <span>{t('nav.overview')}</span>
                  </div>
                  {isOverviewActive && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-md bg-sidebar-accent z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="hover:text-foreground transition-colors cursor-pointer select-none">
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
                          <SidebarMenuButton 
                            asChild 
                            className={cn(
                              "relative transition-all duration-200 select-none",
                              isActive ? "font-medium text-sidebar-accent-foreground" : "text-muted-foreground/80 hover:text-foreground"
                            )}
                          >
                            <Link to={item.path} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 z-10">
                                <item.icon />
                                <span>{item.name}</span>
                              </div>
                              {item.done !== undefined && (
                                <div className="z-10 shrink-0">
                                  {item.done ? (
                                    <span className="flex size-4 items-center justify-center rounded-full bg-success-500/10 text-success-500">
                                      <Check className="size-2.5" />
                                    </span>
                                  ) : (
                                    <span className="flex size-4 items-center justify-center rounded-full border border-muted-foreground/15 bg-muted/10 text-transparent" />
                                  )}
                                </div>
                              )}
                              {isActive && (
                                <motion.div
                                  layoutId="active-sidebar-pill"
                                  className="absolute inset-0 rounded-md bg-sidebar-accent z-0"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
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
        <SidebarGroupLabel className="select-none">{t('nav.execution')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {executionItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild
                    className={cn(
                      "relative transition-all duration-200 select-none",
                      isActive ? "font-medium text-sidebar-accent-foreground" : "text-muted-foreground/80 hover:text-foreground"
                    )}
                  >
                    <Link to={item.path} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 z-10">
                        <item.icon />
                        <span>{item.name}</span>
                      </div>
                      {item.done !== undefined && (
                        <div className="z-10 shrink-0">
                          {item.done ? (
                            <span className="flex size-4 items-center justify-center rounded-full bg-success-500/10 text-success-500">
                              <Check className="size-2.5" />
                            </span>
                          ) : (
                            <span className="flex size-4 items-center justify-center rounded-full border border-muted-foreground/15 bg-muted/10 text-transparent" />
                          )}
                        </div>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="active-sidebar-pill"
                          className="absolute inset-0 rounded-md bg-sidebar-accent z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
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
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild
                className={cn(
                  "relative transition-all duration-200 select-none",
                  location.pathname === `/projects/${publicId}/settings` ? "font-medium text-sidebar-accent-foreground" : "text-muted-foreground/80 hover:text-foreground"
                )}
              >
                <Link to={`/projects/${publicId}/settings`}>
                  <div className="flex items-center gap-2 z-10">
                    <Settings />
                    <span>{t('nav.settings')}</span>
                  </div>
                  {location.pathname === `/projects/${publicId}/settings` && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-md bg-sidebar-accent z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
