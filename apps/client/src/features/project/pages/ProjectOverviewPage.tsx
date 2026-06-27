import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CheckCircle2, Circle, BarChart3, Activity, Clock, Database } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const steps = [
    { key: 'targetConfig', label: t('nav.apiConfig'), done: status?.hasTargetConfig, path: `/projects/${publicId}/config/target` },
    { key: 'aiConfig', label: t('nav.llmJudge'), done: status?.hasAiConfig, path: `/projects/${publicId}/config/ai` },
    { key: 'projectSchema', label: t('nav.datasetSchema'), done: status?.hasProjectSchema, path: `/projects/${publicId}/config/schema` },
    { key: 'verification', label: t('nav.verification'), done: status?.hasVerification, path: `/projects/${publicId}/verification` },
    { key: 'datasets', label: t('nav.datasets'), done: status?.hasDatasets, path: `/projects/${publicId}/datasets` },
  ]

  const completedSteps = steps.filter((s) => s.done).length
  const totalSteps = steps.length

  // Mock stats - will be replaced with real API data later
  const stats = [
    { label: t('overview.totalRuns'), value: '0', icon: BarChart3, color: 'text-blue-500' },
    { label: t('overview.passRate'), value: '-', icon: Activity, color: 'text-emerald-500' },
    { label: t('overview.avgLatency'), value: '-', icon: Clock, color: 'text-amber-500' },
    { label: t('overview.setupSteps'), value: `${completedSteps}/${totalSteps}`, icon: Database, color: 'text-violet-500' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-5xl flex flex-col gap-6 p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{project?.name}</h1>
        {project?.description && (
          <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('rounded-lg bg-muted/50 p-2', stat.color)}>
                  <stat.icon className="size-4" />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight font-mono">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Setup progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('overview.setupProgress')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  step.done ? "bg-muted/30" : "bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </motion.div>
                  ) : (
                    <Circle className="size-4 text-muted-foreground/30" />
                  )}
                  <span className={cn("text-sm font-medium", step.done && "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
                {!step.done && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link to={step.path}>{t('common.configure')}</Link>
                  </Button>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Recent runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('overview.recentRuns')}</CardTitle>
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
