import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { useProject, useSetupStatus } from '@/features/project/hooks/use-projects'
import { PlayIcon } from 'lucide-react'
import { CreateTestRunDialog } from '@/features/project/components/CreateTestRunDialog'

export function ProjectToolbar() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const [createRunOpen, setCreateRunOpen] = useState(false)
  const { toggleSidebar } = useSidebar()
  const { data: project } = useProject(publicId)
  const { data: status } = useSetupStatus(publicId)

  const isSetupComplete = 
    status?.hasTargetConfig && 
    status?.hasAiConfig && 
    status?.hasProjectSchema && 
    status?.hasVerification &&
    status?.hasDatasets

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-2" onClick={toggleSidebar} />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link to="/projects">{t('list.title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{project?.name || '...'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button disabled={!isSetupComplete} size="sm" className="h-8" onClick={() => setCreateRunOpen(true)}>
                <PlayIcon data-icon="inline-start" />
                {t('toolbar.runTest')}
              </Button>
            </div>
          </TooltipTrigger>
          {!isSetupComplete && (
            <TooltipContent>
              <p>{t('toolbar.runTestDisabled')}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
      <CreateTestRunDialog
        open={createRunOpen}
        onOpenChange={setCreateRunOpen}
        projectPublicId={publicId}
        onCreated={(run) => navigate(`/projects/${publicId}/runs?run=${run.publicId}`)}
      />
    </header>
  )
}
