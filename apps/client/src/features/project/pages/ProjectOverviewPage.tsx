import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CheckCircle2, Circle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { useProject, useSetupStatus } from '../hooks/use-projects'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ProjectOverviewPage() {
  const { t } = useTranslation('project')
  const { publicId } = useParams<{ publicId: string }>()
  const { data: project, isLoading: isProjectLoading } = useProject(publicId)
  const { data: status, isLoading: isStatusLoading } = useSetupStatus(publicId)

  if (isProjectLoading || isStatusLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Skeleton className="mb-2 h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const steps = [
    { key: 'targetConfig', label: t('nav.apiConfig'), done: status?.hasTargetConfig },
    { key: 'judgeConfig', label: t('nav.llmJudge'), done: status?.hasJudgeConfig },
    { key: 'datasetSchema', label: t('nav.datasetSchema'), done: status?.hasDatasetSchema },
    { key: 'verification', label: t('nav.verification'), done: status?.hasVerification },
    { key: 'datasets', label: t('nav.datasets'), done: status?.hasDatasets },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-5xl flex flex-col gap-8 p-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
        {project?.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.setupProgress')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4",
                  step.done ? "bg-muted/50" : "bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <Circle className="size-5 text-muted-foreground/30" />
                  )}
                  <span className={cn("font-medium", step.done && "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
                {!step.done && (
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.recentRuns')}</CardTitle>
            <CardDescription>{t('overview.noRunsHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('overview.noRuns')}</EmptyTitle>
                <EmptyDescription>{t('overview.noRunsHint')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
