import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useProject, useSetupStatus } from '@/features/project/hooks/use-projects'
import { PlayIcon } from 'lucide-react'
import { CreateTestRunDialog } from '@/features/project/components/CreateTestRunDialog'

export function ProjectToolbar() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const [createRunOpen, setCreateRunOpen] = useState(false)
  const { data: project } = useProject(publicId)
  const { data: status } = useSetupStatus(publicId)

  const isSetupComplete = 
    status?.hasTargetConfig && 
    status?.hasAiConfig && 
    status?.hasProjectSchema && 
    status?.hasVerification &&
    status?.hasDatasets

  const location = useLocation()
  let currentPageName = ''
  if (location.pathname.endsWith(`/projects/${publicId}`)) currentPageName = ''
  else if (location.pathname.includes('/config/schema')) currentPageName = t('nav.datasetSchema')
  else if (location.pathname.includes('/config/target')) currentPageName = t('nav.apiConfig')
  else if (location.pathname.includes('/config/ai')) currentPageName = t('nav.llmJudge')
  else if (location.pathname.includes('/config/verification')) currentPageName = t('nav.verification')
  else if (location.pathname.includes('/config/compare')) currentPageName = 'So sánh LLM'
  else if (location.pathname.includes('/datasets')) currentPageName = t('nav.datasets')
  else if (location.pathname.includes('/runs')) currentPageName = t('nav.testRuns')

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50 px-6">
      <SidebarTrigger className="-ml-2" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link to="/projects">{t('list.title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            {currentPageName ? (
              <BreadcrumbLink asChild>
                <Link to={`/projects/${publicId}`} className="text-sm font-semibold tracking-tight text-slate-500 hover:text-slate-900">
                  {project?.name || '...'}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="text-sm font-semibold tracking-tight text-slate-900">
                {project?.name || '...'}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {currentPageName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-semibold tracking-tight text-slate-900">
                  {currentPageName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button 
                disabled={!isSetupComplete} 
                className="h-9 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 hover:scale-[0.98] transition-all text-sm font-medium" 
                onClick={() => setCreateRunOpen(true)}
              >
                <PlayIcon className="mr-2 h-3.5 w-3.5" />
                {t('toolbar.runTest', 'Chạy test')}
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
