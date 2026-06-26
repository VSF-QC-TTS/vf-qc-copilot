import { useState } from 'react'
import { ChevronsUpDown, Folder, Settings2, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useProjectsInfinite } from '@/features/project/hooks/use-projects'
import { CreateProjectDialog } from '@/features/project/components/CreateProjectDialog'
import { useSidebar } from '@/components/ui/sidebar'

interface ProjectSwitcherProps extends ComponentProps<'div'> {
  compact?: boolean
  tone?: 'default' | 'sidebar'
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

  const isSidebarTone = tone === 'sidebar'

  return (
    <div className={cn('mb-2 mt-2', compact ? 'min-w-0' : isCollapsed ? 'px-0' : 'px-2 lg:px-4', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-12 w-full justify-start overflow-hidden',
              isCollapsed ? 'p-0 justify-center' : 'px-3 py-2',
              isSidebarTone &&
                'border-border bg-muted/50 text-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.10] dark:hover:text-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#15181d]'
            )}
            aria-label={t('switcher.selectProject')}
            title={currentProject?.name ?? t('switcher.selectProject')}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                isSidebarTone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                !isCollapsed && 'mr-2'
              )}
            >
              <Folder />
            </span>
            {!isCollapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span
                    className={cn(
                      'block truncate text-[11px] font-medium uppercase',
                      isSidebarTone ? 'text-muted-foreground dark:text-zinc-400' : 'text-muted-foreground'
                    )}
                  >
                    {t('switcher.switchLabel', 'Switch project')}
                  </span>
                  <span className="block truncate">{currentProject?.name || t('switcher.selectProject')}</span>
                </span>
                <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]" side={isMobile ? 'bottom' : 'right'}>
          <DropdownMenuLabel>{t('switcher.switchLabel', 'Switch project')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.publicId}
              onClick={() => navigate(`/projects/${project.publicId}`)}
              className="cursor-pointer"
            >
              {project.name}
            </DropdownMenuItem>
          ))}
          
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t('switcher.noResults')}
            </div>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer text-muted-foreground mt-2"
          >
            <Plus className="mr-2" />
            {t('switcher.createNew')}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-muted-foreground">
            <Link to="/projects" className="w-full flex items-center">
              <Settings2 className="mr-2" />
              {t('switcher.manage', 'Manage projects')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
