import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectsInfinite } from '@/features/project/hooks/use-projects'
import { cn } from '@/lib/utils'
import { CreateProjectDialog } from '@/features/project/components/CreateProjectDialog'

export function ProjectSwitcher() {
  const { t } = useTranslation('project')
  const navigate = useNavigate()
  const { publicId } = useParams<{ publicId: string }>()
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, hasNextPage, fetchNextPage } = useProjectsInfinite()

  // Flatten pages and filter locally
  const projects = data?.pages.flatMap((p) => p.content).filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || []
  const activeProject = projects.find((p) => p.publicId === publicId)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-bold">VF</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeProject?.name || 'Select Project'}
                  </span>
                  <span className="truncate text-xs">QC Copilot</span>
                </div>
                <ChevronsUpDown className="ml-auto" data-icon="inline-end" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              side={isMobile ? 'bottom' : 'right'}
              align="start"
            >
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  className="flex h-10 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                  placeholder={t('switcher.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="max-h-64 overflow-y-auto p-1">
                {projects.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No projects found.
                  </p>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.publicId}
                      onClick={() => {
                        navigate(`/projects/${project.publicId}`)
                        setOpen(false)
                      }}
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        publicId === project.publicId && "bg-accent text-accent-foreground"
                      )}
                    >
                      {publicId === project.publicId && (
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))
                )}
                {hasNextPage && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.preventDefault()
                      fetchNextPage()
                    }}
                  >
                    Load more...
                  </Button>
                )}
              </ScrollArea>
              <div className="border-t p-1">
                <button
                  onClick={() => {
                    setOpen(false)
                    setCreateOpen(true)
                  }}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('switcher.createNew')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
