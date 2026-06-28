import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ActivityIcon, BarChart3Icon, ClockIcon, PlayIcon, SettingsIcon, type LucideIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreateTestRunDialog } from '../../components/CreateTestRunDialog'
import { RunStatusBadge } from '../../components/RunStatusBadge'
import { TestRunDetailSheet } from '../../components/TestRunDetailSheet'
import { useSetupStatus } from '../../hooks/use-projects'
import { useTestRuns } from '../../hooks/use-test-runs'
import type { TestRunResponse } from '@/types/test-run'

export function TestRunPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const runsQuery = useTestRuns(publicId)
  const { data: setupStatus } = useSetupStatus(publicId)
  const runs = runsQuery.data?.content ?? []
  const selectedRun = runs.find((run) => run.publicId === searchParams.get('run')) ?? null

  const isSetupComplete =
    setupStatus?.hasTargetConfig &&
    setupStatus?.hasAiConfig &&
    setupStatus?.hasProjectSchema &&
    setupStatus?.hasVerification &&
    setupStatus?.hasDatasets

  const summary = summarizeRuns(runs)

  function handleSelectRun(run: TestRunResponse): void {
    setSearchParams({ run: run.publicId })
  }

  function handleCreated(run: TestRunResponse): void {
    setSearchParams({ run: run.publicId })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Test Runs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Queue và theo dõi các lần chạy test qua backend runner.
          </p>
        </div>
        <Button type="button" disabled={!isSetupComplete} onClick={() => setCreateOpen(true)}>
          <PlayIcon data-icon="inline-start" />
          New run
        </Button>
      </div>

      {!isSetupComplete ? (
        <Alert>
          <SettingsIcon className="size-4" />
          <AlertTitle>Chưa đủ cấu hình để chạy test</AlertTitle>
          <AlertDescription>
            Hoàn tất API config, schema, verification và dataset active trước khi tạo run.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={BarChart3Icon} label="Total runs" value={String(summary.totalRuns)} />
        <MetricCard icon={ActivityIcon} label="Pass rate" value={summary.passRate} />
        <MetricCard icon={ClockIcon} label="Avg duration" value={summary.avgDuration} />
        <MetricCard icon={ActivityIcon} label="Active" value={String(summary.activeRuns)} />
      </div>

      {runsQuery.isLoading ? (
        <Skeleton className="h-80 rounded-lg" />
      ) : runs.length === 0 ? (
        <div className="rounded-xl border bg-card p-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có test run</EmptyTitle>
              <EmptyDescription>
                {isSetupComplete
                  ? 'Tạo run đầu tiên để kiểm tra target API với dataset active.'
                  : 'Hoàn tất cấu hình trước khi chạy test.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow
                  key={run.publicId}
                  className="cursor-pointer"
                  onClick={() => handleSelectRun(run)}
                  aria-selected={selectedRun?.publicId === run.publicId}
                >
                  <TableCell className="max-w-[260px] truncate font-medium">{run.name}</TableCell>
                  <TableCell>
                    <RunStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell>{formatScore(run.score)}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {run.passedCases}/{run.failedCases}/{run.errorCases} / {run.totalCases}
                    </span>
                  </TableCell>
                  <TableCell>{formatDuration(run.durationMs)}</TableCell>
                  <TableCell>{new Date(run.createdAt).toLocaleString('vi-VN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!setupStatus?.hasDatasets && publicId ? (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to={`/projects/${publicId}/datasets`}>Mở Datasets</Link>
          </Button>
        </div>
      ) : null}

      <CreateTestRunDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectPublicId={publicId}
        onCreated={handleCreated}
      />
      <TestRunDetailSheet
        open={Boolean(selectedRun)}
        onOpenChange={(open) => {
          if (!open) {
            setSearchParams({})
          }
        }}
        projectPublicId={publicId}
        run={selectedRun}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-muted/50 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-mono text-lg font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function summarizeRuns(runs: TestRunResponse[]) {
  const completedRuns = runs.filter((run) => run.status === 'COMPLETED')
  const activeRuns = runs.filter((run) => run.status === 'QUEUED' || run.status === 'RUNNING').length
  const totalPassed = completedRuns.reduce((sum, run) => sum + run.passedCases, 0)
  const totalCases = completedRuns.reduce((sum, run) => sum + run.totalCases, 0)
  const durations = completedRuns.map((run) => run.durationMs).filter((value): value is number => value != null)
  const avgDuration =
    durations.length === 0 ? '-' : formatDuration(Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length))

  return {
    totalRuns: runs.length,
    activeRuns,
    passRate: totalCases === 0 ? '-' : `${Math.round((totalPassed / totalCases) * 100)}%`,
    avgDuration,
  }
}

function formatScore(value: number | null): string {
  return value == null ? '-' : `${Math.round(value * 100)}%`
}

function formatDuration(value: number | null): string {
  if (value == null) {
    return '-'
  }
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`
}
