import { Link, useLocation } from 'react-router-dom'
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
  GitCompare
} from 'lucide-react'
import { motion } from 'motion/react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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
import { useSidebar } from '@/components/ui/sidebar-context'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectSwitcher } from './ProjectSwitcher'
import { useSetupStatus } from '@/features/project/hooks/use-projects'
import { cn } from '@/lib/utils'

export function ProjectSidebar({ publicId }: { publicId: string }) {
  const { t } = useTranslation('project')
  const location = useLocation()
  const { state } = useSidebar()
  const { data: status, isLoading } = useSetupStatus(publicId)

  const setupItems = [
    { name: t('nav.datasetSchema'), path: `/projects/${publicId}/config/schema`, icon: Table, done: status?.hasProjectSchema },
    { name: t('nav.apiConfig'), path: `/projects/${publicId}/config/target`, icon: Globe, done: status?.hasTargetConfig },
    { name: t('nav.llmJudge'), path: `/projects/${publicId}/config/ai`, icon: Settings, done: status?.hasAiConfig },
    { name: t('nav.verification'), path: `/projects/${publicId}/config/verification`, icon: CheckSquare, done: status?.hasVerification },
    { name: 'So sánh LLM', path: `/projects/${publicId}/config/compare`, icon: GitCompare },
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
      <SidebarHeader>
        <Link to="/projects" className="flex flex-col gap-2 pt-1 pb-5 mb-2 border-b border-slate-200/60 select-none cursor-pointer hover:opacity-80 transition-opacity">
          {state !== 'collapsed' ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4">
              <img src="/logo.png" className="h-[39px] w-auto object-contain" alt="VinFast Logo" />
              <span className="font-bold text-foreground tracking-tight text-[16px] text-center">
                {t('app.name', 'VinFast QC Copilot')}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center pt-2">
              <img src="/logo.png" className="h-8 w-auto object-contain" alt="VinFast Logo" />
            </div>
          )}
        </Link>
        <ProjectSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={cn(
                    "relative transition-all duration-200 select-none",
                    isOverviewActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  <Link to={`/projects/${publicId}`}>
                    <LayoutDashboard className="z-10" />
                    <span className="z-10 flex-1 truncate">{t('nav.overview')}</span>
                    {isOverviewActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-0 rounded-md bg-blue-50 z-0"
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
            <SidebarGroupLabel asChild className="group-data-[collapsible=icon]:hidden">
              <CollapsibleTrigger className="hover:text-foreground transition-colors cursor-pointer select-none text-xs font-semibold text-slate-500 uppercase tracking-wider h-8">
                {t('nav.setup', 'Thiết lập')}
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 size-3.5" />
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
                                isActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground font-medium"
                              )}
                            >
                              <Link to={item.path}>
                                <item.icon className="z-10" />
                                <span className="z-10 flex-1 truncate">{item.name}</span>
                                {item.done !== undefined && (
                                  <div className="z-10 shrink-0 group-data-[collapsible=icon]:hidden">
                                      {item.done ? (
                                        <span className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-emerald-500 text-emerald-500">
                                          <Check className="size-2 stroke-[2.5]" />
                                        </span>
                                      ) : (
                                        <span className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-transparent" />
                                      )}
                                  </div>
                                )}
                                {isActive && (
                                  <motion.div
                                    layoutId="active-sidebar-pill"
                                    className="absolute inset-0 rounded-md bg-blue-50 z-0"
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
          <SidebarGroupLabel className="select-none text-xs font-semibold text-slate-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            {t('nav.execution', 'Thực thi')}
          </SidebarGroupLabel>
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
                        isActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground font-medium"
                      )}
                    >
                      <Link to={item.path}>
                        <item.icon className="z-10" />
                        <span className="z-10 flex-1 truncate">{item.name}</span>
                        {item.done !== undefined && (
                          <div className="z-10 shrink-0 group-data-[collapsible=icon]:hidden">
                            {item.done ? (
                              <span className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-emerald-500 text-emerald-500">
                                <Check className="size-2 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-transparent" />
                            )}
                          </div>
                        )}
                        {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-0 rounded-md bg-blue-50 z-0"
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
      </SidebarContent>
    </>
  )
}
