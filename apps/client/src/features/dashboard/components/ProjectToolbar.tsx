import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { useProject, useSetupStatus } from '@/features/project/hooks/use-projects'
import { PlayIcon } from 'lucide-react'

export function ProjectToolbar() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const { toggleSidebar } = useSidebar()
  const { data: project } = useProject(publicId)
  const { data: status } = useSetupStatus(publicId)

  const isSetupComplete =
    status?.hasTargetConfig &&
    status?.hasJudgeConfig &&
    status?.hasDatasetSchema &&
    status?.hasVerification &&
    status?.hasDatasets

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-2" onClick={toggleSidebar} />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link to="/projects">Projects</Link>
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
              <Button disabled={!isSetupComplete} size="sm" className="h-8">
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
    </header>
  )
}
