import { useState } from 'react'
import { ChevronsUpDown, Folder, Settings2, Plus, Check } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectsInfinite } from '@/features/project/hooks/use-projects'
import { CreateProjectDialog } from '@/features/project/components/CreateProjectDialog'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'

interface ProjectSwitcherProps extends Omit<ComponentProps<'div'>, 'ref'> {
  compact?: boolean
  tone?: 'default' | 'sidebar'
}

// Dynamically generate a beautiful dark-mode friendly background avatar color based on project name hash
const PROJECT_COLORS = [
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-sky-600 text-white',
  'bg-cyan-600 text-white',
  'bg-slate-800 text-white',
  'bg-blue-800 text-white'
]

const getAvatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PROJECT_COLORS.length
  return PROJECT_COLORS[index]
}

const getInitials = (name: string) => {
  return name.trim().charAt(0).toUpperCase() || 'P'
}

export function ProjectSwitcher({
  className
}: ProjectSwitcherProps) {
  const { t } = useTranslation('project')
  const navigate = useNavigate()
  const { publicId } = useParams<{ publicId: string }>()
  const { isMobile } = useSidebar()
  
  const [createOpen, setCreateOpen] = useState(false)

  const { data } = useProjectsInfinite()
  const projects = data?.pages.flatMap((p) => p.content) || []
  const currentProject = projects.find((p) => p.publicId === publicId)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                className
              )}
            >
              <div
                className={cn(
                  'flex aspect-square size-8 items-center justify-center rounded-lg font-bold text-sm tracking-wide shadow-sm transition-all',
                  currentProject
                    ? getAvatarColor(currentProject.name)
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {currentProject ? getInitials(currentProject.name) : <Folder className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-1">
                <span className="block truncate font-semibold text-foreground/90">
                  {currentProject?.name || t('switcher.selectProject')}
                </span>
                <span className="block truncate text-xs font-medium text-muted-foreground/80">
                  {t('switcher.workspaceLabel', 'Không gian QC')}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-muted-foreground/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[240px] px-1 py-1.5 border border-slate-200 bg-white rounded-md shadow-sm" 
          side={isMobile ? 'bottom' : 'right'}
        >
          <div className="px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-muted-foreground/80 uppercase">
            {t('switcher.switchLabel', 'Chuyển dự án')}
          </div>
          
          <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
            {projects.map((project) => {
              const isActive = project.publicId === publicId
              return (
                <DropdownMenuItem
                  key={project.publicId}
                  onClick={() => navigate(`/projects/${project.publicId}`)}
                  className={cn(
                    "cursor-pointer flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-md transition-colors hover:bg-slate-100",
                    isActive ? "bg-slate-50 font-bold" : ""
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'flex size-8.5 shrink-0 items-center justify-center rounded-lg font-bold text-sm tracking-wide shadow-sm',
                        getAvatarColor(project.name)
                      )}
                    >
                      {getInitials(project.name)}
                    </div>
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className="block truncate text-xs font-semibold text-foreground/90 leading-tight">
                        {project.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground/80 leading-normal pb-0.5">
                        {project.description || t('switcher.defaultDesc', 'Dự án QC Copilot')}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              )
            })}
          </div>
          
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t('switcher.noResults')}
            </div>
          ) : null}

          <DropdownMenuSeparator className="my-1.5" />
          
          <div className="flex flex-col gap-0.5">
            <DropdownMenuItem
              onClick={() => setCreateOpen(true)}
              className="cursor-pointer flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-muted-foreground focus:text-foreground"
            >
              <div className="flex size-8.5 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-500">
                <Plus className="size-4" />
              </div>
              <span className="text-xs font-medium">{t('switcher.createNew')}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-muted-foreground focus:text-foreground">
              <Link to="/projects" className="w-full flex items-center gap-2.5 px-2 py-1.5">
                <div className="flex size-8.5 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-500">
                  <Settings2 className="size-4" />
                </div>
                <span className="text-xs font-medium">{t('switcher.manage', 'Quản lý dự án')}</span>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarMenu>
  )
}
