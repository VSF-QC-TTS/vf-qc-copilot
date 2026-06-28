import { useState } from 'react'
import { ChevronsUpDown, Folder, Settings2, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
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
import { useSidebar } from '@/components/ui/sidebar-context'

interface ProjectSwitcherProps extends Omit<ComponentProps<'div'>, 'ref'> {
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
    <div className={cn('mb-1 mt-1', compact ? 'min-w-0' : isCollapsed ? 'px-0' : 'px-2 lg:px-4', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.01 }} 
            whileTap={{ scale: 0.99 }} 
            className="w-full"
          >
            <Button
              variant="ghost"
              className={cn(
                'h-10 w-full justify-start overflow-hidden px-2.5 py-1.5 transition-all shadow-none border border-transparent select-none cursor-pointer',
                isCollapsed ? 'p-0 justify-center' : '',
                isSidebarTone &&
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-white/[0.04]'
              )}
              aria-label={t('switcher.selectProject')}
              title={currentProject?.name ?? t('switcher.selectProject')}
            >
              <span
                className={cn(
                  'flex size-6.5 shrink-0 items-center justify-center rounded-md',
                  isSidebarTone 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' 
                    : 'bg-muted text-muted-foreground',
                  !isCollapsed && 'mr-2'
                )}
              >
                <Folder className="size-3.5" />
              </span>
              {!isCollapsed && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span
                      className={cn(
                        'block truncate text-[9px] font-semibold uppercase tracking-wider leading-none mb-0.5',
                        isSidebarTone ? 'text-muted-foreground/70 dark:text-zinc-400/70' : 'text-muted-foreground/75'
                      )}
                    >
                      {t('switcher.switchLabel', 'Chuyển dự án')}
                    </span>
                    <span className="block truncate text-xs font-semibold text-foreground/80 leading-none">
                      {currentProject?.name || t('switcher.selectProject')}
                    </span>
                  </span>
                  <ChevronsUpDown className="ml-1.5 size-3.5 shrink-0 opacity-40" />
                </>
              )}
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]" side={isMobile ? 'bottom' : 'right'}>
          <DropdownMenuLabel>{t('switcher.switchLabel', 'Chuyển dự án')}</DropdownMenuLabel>
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
            <Plus className="mr-2 size-3.5" />
            {t('switcher.createNew')}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer text-muted-foreground">
            <Link to="/projects" className="w-full flex items-center">
              <Settings2 className="mr-2 size-3.5" />
              {t('switcher.manage', 'Quản lý dự án')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
