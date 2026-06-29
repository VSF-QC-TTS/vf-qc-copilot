import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ActivityIcon, BarChart3Icon, ClockIcon, SettingsIcon, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { CreateTestRunDialog } from '../../components/CreateTestRunDialog'
import { RunStatusBadge } from '../../components/RunStatusBadge'
import { useSetupStatus } from '../../hooks/use-projects'
import { useTestRuns } from '../../hooks/use-test-runs'
import type { TestRunResponse } from '@/types/test-run'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
} as const

export function TestRunPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const runsQuery = useTestRuns(publicId)
  const { data: setupStatus } = useSetupStatus(publicId)
  const runs = runsQuery.data?.content ?? []

  const isSetupComplete =
    setupStatus?.hasTargetConfig &&
    setupStatus?.hasAiConfig &&
    setupStatus?.hasProjectSchema &&
    setupStatus?.hasVerification &&
    setupStatus?.hasDatasets

  const summary = summarizeRuns(runs)

  function handleSelectRun(run: TestRunResponse): void {
    navigate(`/projects/${publicId}/runs/${run.publicId}`)
  }

  function handleCreated(run: TestRunResponse): void {
    navigate(`/projects/${publicId}/runs/${run.publicId}`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lượt chạy test</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Quản lý và theo dõi các phiên chạy test qua runner hệ thống.
          </p>
        </div>
      </div>

      {!isSetupComplete ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Alert variant="destructive" className="border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200">
            <SettingsIcon />
            <AlertTitle>Chưa đủ cấu hình để chạy test</AlertTitle>
            <AlertDescription>
              Vui lòng hoàn tất API config, schema, verification và bộ dữ liệu (dataset) active trước khi tạo run.
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : null}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 border rounded-xl divide-x divide-y md:divide-y-0 overflow-hidden bg-card shadow-sm border-border/70"
      >
        <MetricCard 
          icon={BarChart3Icon} 
          label="Tổng số lượt chạy" 
          value={String(summary.totalRuns)} 
          index={0} 
        />
        <MetricCard 
          icon={ActivityIcon} 
          label="Tỷ lệ vượt qua" 
          value={summary.passRate} 
          index={1} 
        />
        <MetricCard 
          icon={ClockIcon} 
          label="Thời gian trung bình" 
          value={summary.avgDuration} 
          index={2} 
        />
        <MetricCard 
          icon={ActivityIcon} 
          label="Đang hoạt động" 
          value={String(summary.activeRuns)} 
          index={3} 
        />
      </motion.div>

      {runsQuery.isLoading ? (
        <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3 border-border/50">
            <Skeleton className="h-5 w-32 rounded animate-pulse" />
            <Skeleton className="h-5 w-24 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center py-3 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 flex-1 rounded animate-pulse" />
                <Skeleton className="h-4 w-20 rounded animate-pulse" />
                <Skeleton className="h-4 w-12 rounded animate-pulse" />
                <Skeleton className="h-4 w-24 rounded animate-pulse" />
                <Skeleton className="h-4 w-16 rounded animate-pulse" />
                <Skeleton className="h-4 w-32 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border bg-card p-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có lượt chạy test</EmptyTitle>
              <EmptyDescription>
                {isSetupComplete
                  ? 'Tạo lượt chạy đầu tiên để kiểm tra target API với dataset active.'
                  : 'Vui lòng hoàn tất cấu hình trước khi chạy test.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm border-border/70">
          <Table>
            <TableHeader className="bg-muted/20">
              <tr className="border-b">
                <TableHead className="py-3 px-3">Tên lượt chạy</TableHead>
                <TableHead className="py-3 px-3">Trạng thái</TableHead>
                <TableHead className="py-3 px-3">Điểm số</TableHead>
                <TableHead className="py-3 px-3">Ca test (Đạt/Lỗi/Hỏng/Tổng)</TableHead>
                <TableHead className="py-3 px-3">Thời gian chạy</TableHead>
                <TableHead className="py-3 px-3">Thời gian tạo</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {runs.map((run, index) => {
                return (
                  <motion.tr
                    key={run.publicId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    onClick={() => handleSelectRun(run)}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/30 select-none"
                  >
                    <TableCell className="max-w-[260px] truncate py-3.5 px-3 font-medium text-foreground">
                      {run.name}
                    </TableCell>
                    <TableCell className="py-3.5 px-3">
                      <RunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        {run.score !== null ? (
                          <>
                            <span className={cn(
                              "size-1.5 rounded-full shrink-0",
                              run.score >= 0.8 ? "bg-emerald-500" : run.score >= 0.5 ? "bg-amber-500" : "bg-destructive"
                            )} />
                            <span className="font-mono text-sm font-semibold">{formatScore(run.score)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title="Đạt">{run.passedCases}</span>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="text-destructive font-semibold" title="Lỗi (Failed)">{run.failedCases}</span>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="text-amber-500 font-semibold" title="Hỏng (Error)">{run.errorCases}</span>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="text-muted-foreground/90 font-semibold" title="Tổng số">{run.totalCases}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 font-mono text-xs text-muted-foreground/90">
                      {formatDuration(run.durationMs)}
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-xs text-muted-foreground/80">
                      {new Date(run.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                  </motion.tr>
                )
              })}
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
    </motion.div>
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
  index: number
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative flex flex-col justify-between p-5 transition-colors duration-300 hover:bg-muted/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{label}</span>
        <div className="rounded-lg bg-muted/60 p-1.5 text-muted-foreground group-hover:text-primary transition-colors">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">{value}</span>
      </div>
    </motion.div>
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
