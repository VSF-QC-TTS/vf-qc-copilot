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
import { useSidebar } from '@/components/ui/sidebar-context'

interface ProjectSwitcherProps extends Omit<ComponentProps<'div'>, 'ref'> {
  compact?: boolean
  tone?: 'default' | 'sidebar'
}

// Dynamically generate a beautiful dark-mode friendly background avatar color based on project name hash
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-indigo-600 text-white dark:bg-indigo-500/90',
    'bg-emerald-600 text-white dark:bg-emerald-500/90',
    'bg-amber-500 text-white dark:bg-amber-500/90',
    'bg-rose-600 text-white dark:bg-rose-500/90',
    'bg-sky-600 text-white dark:bg-sky-500/90',
    'bg-violet-600 text-white dark:bg-violet-500/90',
    'bg-teal-600 text-white dark:bg-teal-500/90'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const getInitials = (name: string) => {
  return name.trim().charAt(0).toUpperCase() || 'P'
}

export function ProjectSwitcher({
  compact,
  tone = 'sidebar',
  className,
  ...props
}: ProjectSwitcherProps) {
  const { t } = useTranslation('project')
  const navigate = useNavigate()
  const { publicId } = useParams<{ publicId: string }>()
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  
  const [createOpen, setCreateOpen] = useState(false)

  const { data } = useProjectsInfinite()
  const projects = data?.pages.flatMap((p) => p.content) || []
  const currentProject = projects.find((p) => p.publicId === publicId)

  return (
    <div className={cn('mb-1 mt-1', compact ? 'min-w-0' : isCollapsed ? 'px-0' : 'px-2 lg:px-4', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="w-full">
            <button
              className={cn(
                'h-12 w-full px-3 py-2 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 rounded-xl select-none cursor-pointer flex items-center gap-2.5 outline-none transition-all',
                isCollapsed ? 'p-0 h-8 w-8 mx-auto justify-center border-none hover:bg-transparent shadow-none' : 'justify-between'
              )}
              aria-label={t('switcher.selectProject')}
              title={currentProject?.name ?? t('switcher.selectProject')}
            >
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm tracking-wide shadow-sm transition-all',
                  currentProject
                    ? getAvatarColor(currentProject.name)
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
                )}
              >
                {currentProject ? getInitials(currentProject.name) : <Folder className="size-4" />}
              </div>
              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left flex flex-col gap-0.5 ml-0.5">
                    <span className="block truncate text-xs font-semibold text-foreground/90 leading-tight">
                      {currentProject?.name || t('switcher.selectProject')}
                    </span>
                    <span className="block truncate text-[10px] font-medium text-muted-foreground/80 leading-normal pb-0.5">
                      {t('switcher.workspaceLabel', 'Không gian QC')}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1.5 size-4 shrink-0 text-muted-foreground/60" />
                </>
              )}
            </button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[240px] px-1 py-1.5" 
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
                    "cursor-pointer flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-lg transition-colors focus:bg-zinc-100 dark:focus:bg-zinc-800",
                    isActive ? "bg-zinc-100/70 dark:bg-zinc-800/70 font-medium" : ""
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
              <div className="flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-muted-foreground/60">
                <Plus className="size-4" />
              </div>
              <span className="text-xs font-medium">{t('switcher.createNew')}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-muted-foreground focus:text-foreground">
              <Link to="/projects" className="w-full flex items-center gap-2.5 px-2 py-1.5">
                <div className="flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-muted-foreground/60">
                  <Settings2 className="size-4" />
                </div>
                <span className="text-xs font-medium">{t('switcher.manage', 'Quản lý dự án')}</span>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
