import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BanIcon,
  AlertTriangle,
  Search,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Plus,
  Download,
  Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useTestRun,
  useTestRunResults,
  useCancelTestRun,
  isRunActive,
  useCustomColumns,
  useAddCustomColumn,
  useSaveCustomValue,
  useOverrideResult,
  usePrepareTestRunExport,
} from '../../hooks/use-test-runs'
import { RunStatusBadge, CaseStatusBadge } from '../../components/RunStatusBadge'
import { TestRunJobProgressDialog } from '../../components/TestRunJobProgressDialog'
import { downloadTestRunExcel } from '@/lib/test-run-api'
import type { TestCaseStatus } from '@/types/test-run'

function formatScore(value: number | null): string {
  return value == null ? '-' : `${Math.round(value * 100)}%`
}

function formatDuration(value: number | null): string {
  if (value == null) return '-'
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`
}

function formatErrorMessage(msg: string | null | undefined): string {
  if (!msg) return ''
  if (msg.includes('validation failed:')) {
    const jsonStart = msg.indexOf('[')
    if (jsonStart !== -1) {
      try {
        const jsonStr = msg.substring(jsonStart)
        const errors = JSON.parse(jsonStr)
        if (Array.isArray(errors)) {
          return 'Lỗi validate dữ liệu đầu vào:\n' + errors.map((err: any) => {
            const path = err.path ? err.path.join('.') : ''
            return `- Trường "${path}": ${err.message} (Nhận được: ${err.received}, Kì vọng: ${err.expected})`
          }).join('\n')
        }
      } catch {
        // Fallback
      }
    }
  }
  return msg
}

export function TestRunDetailPage() {
  const { publicId, runId } = useParams<{ publicId: string; runId: string }>()
  const runQuery = useTestRun(runId, true)
  const run = runQuery.data
  const poll = isRunActive(run)
  const resultsQuery = useTestRunResults(runId, poll, 0, 100) // fetch up to 100 cases
  const cancelMutation = useCancelTestRun(publicId)

  const customColumnsQuery = useCustomColumns(runId)
  const customColumns = customColumnsQuery.data
  const addColMutation = useAddCustomColumn(runId)
  const saveValueMutation = useSaveCustomValue(runId)
  const overrideMutation = useOverrideResult(runId)

  const [addColOpen, setAddColOpen] = useState(false)
  const [newColName, setNewColName] = useState('')

  const [exportJob, setExportJob] = useState<any>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const exportMutation = usePrepareTestRunExport(publicId, runId)

  const handleExportExcel = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (job) => {
        setExportJob(job)
        setExportDialogOpen(true)
      }
    })
  }

  const handleExportComplete = (completedJob: any) => {
    if (completedJob.status === 'COMPLETED' && publicId && runId) {
      void downloadTestRunExcel(publicId, runId, completedJob.publicId)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'ERROR'>('ALL')
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'index' | 'latency'>('index')

  const resultsList = resultsQuery.data?.content
  const processedCases = (run?.passedCases ?? 0) + (run?.failedCases ?? 0) + (run?.errorCases ?? 0)
  const totalCases = run?.totalCases ?? 0
  const progress = totalCases > 0 ? Math.round((processedCases / totalCases) * 100) : 0

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    let list = [...(resultsList ?? [])]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((item) => {
        const inputMatch = item.inputData?.toLowerCase().includes(q)
        const outputMatch = item.actualOutput?.toLowerCase().includes(q)
        const assertionMatch = item.assertions.some(
          (a) => a.reason?.toLowerCase().includes(q) || a.assertionName?.toLowerCase().includes(q)
        )
        return inputMatch || outputMatch || assertionMatch
      })
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter)
    }

    // Sort order
    if (sortBy === 'latency') {
      list.sort((a, b) => (b.latencyMs ?? 0) - (a.latencyMs ?? 0))
    } else {
      list.sort((a, b) => a.caseIndex - b.caseIndex)
    }

    return list
  }, [resultsList, searchQuery, statusFilter, sortBy])

  // Latency Metrics
  const latencyStats = useMemo(() => {
    const list = resultsList ?? []
    if (list.length === 0) return { min: 0, max: 0, avg: 0 }
    const validLatencies = list
      .map((r) => r.latencyMs)
      .filter((l): l is number => typeof l === 'number' && l > 0)
    if (validLatencies.length === 0) return { min: 0, max: 0, avg: 0 }

    const min = Math.min(...validLatencies)
    const max = Math.max(...validLatencies)
    const sum = validLatencies.reduce((a, b) => a + b, 0)
    const avg = Math.round(sum / validLatencies.length)

    return { min, max, avg }
  }, [resultsList])

  // Radial Chart variables
  const radialProps = useMemo(() => {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const scoreVal = run?.score ?? 0
    const strokeDashoffset = circumference - scoreVal * circumference
    return { radius, circumference, strokeDashoffset }
  }, [run?.score])

  const toggleCase = (id: string) => {
    const newExpanded = new Set(expandedCases)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCases(newExpanded)
  }

  const expandAll = () => {
    setExpandedCases(new Set(filteredCases.map((c) => c.publicId)))
  }

  const collapseAll = () => {
    setExpandedCases(new Set())
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to={`/projects/${publicId}/runs`}>
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Lịch sử lượt chạy
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{run?.name ?? 'Chi tiết lượt chạy'}</h1>
            {run && <RunStatusBadge status={run.status} />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tạo lúc: {run?.createdAt ? new Date(run.createdAt).toLocaleString('vi-VN') : 'Đang tải...'}
            {run?.finishedAt && ` · Hoàn thành: ${new Date(run.finishedAt).toLocaleString('vi-VN')}`}
          </p>
        </div>

        <div className="flex gap-2">
          {run && run.status === 'COMPLETED' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                onClick={() => setAddColOpen(true)}
              >
                <Plus data-icon="inline-start" />
                Thêm cột QC
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-9 rounded-lg"
                disabled={exportMutation.isPending}
                onClick={handleExportExcel}
              >
                {exportMutation.isPending ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
                Xuất Excel
              </Button>
            </>
          )}
          {run && (run.status === 'QUEUED' || run.status === 'RUNNING') && (
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => runId && cancelMutation.mutate(runId)}
              className="text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <BanIcon className="mr-1.5 size-4" />
              Hủy chạy test
            </Button>
          )}
        </div>
      </div>

      {run?.errorMessage && (
        <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5 animate-pulse" />
          <div className="flex flex-col gap-1">
            <AlertTitle className="font-bold">Lỗi hệ thống</AlertTitle>
            <AlertDescription className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
              {formatErrorMessage(run.errorMessage)}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Analytics Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Metric 1: Overall Radial Progress */}
        <Card className="rounded-xl shadow-sm md:col-span-1 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm số tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <svg className="size-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radialProps.radius}
                  className="text-muted/20 dark:text-muted/10 stroke-current"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radialProps.radius}
                  className="text-primary stroke-current transition-all duration-500 ease-out"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={radialProps.circumference}
                  strokeDashoffset={radialProps.strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono text-2xl font-bold text-foreground">
                {formatScore(run?.score ?? null)}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">Tính theo tỉ lệ các Case đạt yêu cầu</div>
          </CardContent>
        </Card>

        {/* Metric 2: Progress & Distribution */}
        <Card className="rounded-xl shadow-sm md:col-span-2 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tiến độ & Phân bố kết quả</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span>Tiến độ thực thi</span>
                <span>{progress}% ({processedCases}/{totalCases} cases)</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block mb-2 font-medium">Tỷ lệ các trạng thái</span>
              <div className="h-4 w-full flex rounded-lg overflow-hidden border">
                {run?.passedCases && run.passedCases > 0 ? (
                  <div
                    className="bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(run.passedCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Đạt: ${run.passedCases}`}
                  >
                    {run.passedCases}
                  </div>
                ) : null}
                {run?.failedCases && run.failedCases > 0 ? (
                  <div
                    className="bg-destructive text-white font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(run.failedCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Lỗi: ${run.failedCases}`}
                  >
                    {run.failedCases}
                  </div>
                ) : null}
                {run?.errorCases && run.errorCases > 0 ? (
                  <div
                    className="bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(run.errorCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Hỏng: ${run.errorCases}`}
                  >
                    {run.errorCases}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" /> Đạt ({run?.passedCases ?? 0})</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-destructive" /> Lỗi ({run?.failedCases ?? 0})</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> Hỏng ({run?.errorCases ?? 0})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Response Latency Overview */}
        <Card className="rounded-xl shadow-sm md:col-span-1 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian phản hồi API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4.5 py-4">
            <div className="grid grid-cols-3 text-center border-b pb-3 divide-x border-border/40">
              <div>
                <div className="text-[10px] text-muted-foreground">Min</div>
                <div className="font-mono text-sm font-semibold mt-0.5 text-foreground">{formatDuration(latencyStats.min)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Average</div>
                <div className="font-mono text-sm font-bold mt-0.5 text-primary">{formatDuration(latencyStats.avg)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Max</div>
                <div className="font-mono text-sm font-semibold mt-0.5 text-foreground">{formatDuration(latencyStats.max)}</div>
              </div>
            </div>

            {/* Custom Interactive SVG Latency Distribution Bar Chart */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">Biểu đồ độ trễ từng case (ms)</span>
              {resultsList && resultsList.length > 0 ? (
                <div className="h-[40px] w-full flex items-end justify-between border rounded bg-muted/20 p-1 gap-[1px]">
                  {resultsList.map((c) => {
                    const pct = latencyStats.max > 0 ? ((c.latencyMs ?? 0) / latencyStats.max) * 90 + 10 : 10
                    let barColor = 'bg-primary/50 hover:bg-primary'
                    if (c.status === 'FAILED') barColor = 'bg-destructive/40 hover:bg-destructive'
                    if (c.status === 'ERROR') barColor = 'bg-amber-500/40 hover:bg-amber-500'
                    return (
                      <div
                        key={c.publicId}
                        style={{ height: `${pct}%` }}
                        className={`flex-1 rounded-sm transition-colors ${barColor}`}
                        title={`Case #${c.caseIndex}: ${c.latencyMs}ms (${c.status})`}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="h-[40px] w-full bg-muted/20 rounded flex items-center justify-center text-[10px] text-muted-foreground">Chưa có kết quả</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Results Table & Filters Card */}
      <Card className="rounded-xl border border-muted/50 overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-card py-4 px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Báo cáo ca test chi tiết</CardTitle>
              <CardDescription className="text-xs">QC tìm kiếm dữ liệu, lọc trạng thái và mở rộng xem so khớp JSON.</CardDescription>
            </div>

            {/* Active filters bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm nội dung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-9 text-xs rounded-lg"
                />
              </div>

              {/* Status segmented filters control */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs select-none">
                {(['ALL', 'PASSED', 'FAILED', 'ERROR'] as const).map((status) => {
                  let label = 'Tất cả'
                  if (status === 'PASSED') label = 'Đạt'
                  if (status === 'FAILED') label = 'Lỗi'
                  if (status === 'ERROR') label = 'Hỏng'
                  return (
                    <Button
                      key={status}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2.5 rounded-md text-xs transition-all duration-200 ${
                        statusFilter === status
                          ? 'bg-background text-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                      }`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>

              {/* Sorting trigger */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs select-none">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2.5 rounded-md text-xs transition-all duration-200 ${
                    sortBy === 'index'
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                  }`}
                  onClick={() => setSortBy('index')}
                >
                  Sắp xếp: Case ID
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2.5 rounded-md text-xs transition-all duration-200 ${
                    sortBy === 'latency'
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                  }`}
                  onClick={() => setSortBy('latency')}
                >
                  Sắp xếp: Độ trễ
                </Button>
              </div>

              {/* Expand / Collapse All buttons */}
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-[10px] px-2 rounded-lg" onClick={expandAll}>
                  Mở hết
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] px-2 rounded-lg" onClick={collapseAll}>
                  Thu hết
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {resultsQuery.isLoading ? (
            <div className="p-8 flex flex-col gap-4">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-24 w-full rounded" />
              <Skeleton className="h-24 w-full rounded" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground font-medium bg-muted/5">
              Không tìm thấy ca test nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredCases.map((item) => {
                const isExpanded = expandedCases.has(item.publicId)
                const hasAssertions = item.assertions.length > 0
                return (
                  <div key={item.publicId} className="transition-all hover:bg-muted/5">
                    {/* Compact row summary */}
                    {(() => {
                      const displayStatus = item.override ? item.override.overriddenStatus : item.status
                      const displayScore = item.override ? item.override.overriddenScore : item.score
                      return (
                        <div
                          onClick={() => toggleCase(item.publicId)}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 cursor-pointer gap-3 select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-mono text-sm font-bold text-muted-foreground/80 shrink-0">#{item.caseIndex}</span>
                            <CaseStatusBadge status={displayStatus} />
                            {item.override && (
                              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5 select-none font-bold text-[10px] gap-1 shrink-0 py-0.5">
                                <Check data-icon="inline-start" />
                                QC Sửa
                              </Badge>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono font-medium text-foreground truncate max-w-lg" title={item.inputData ?? undefined}>
                                Input: {item.inputData}
                              </p>
                              {customColumns && customColumns.length > 0 && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex flex-wrap items-center gap-3 mt-1.5 pt-1 border-t border-border/20"
                                >
                                  {customColumns.map((col) => {
                                    const cellVal = item.customValues?.find((v) => v.customColumnPublicId === col.publicId)?.value ?? ''
                                    return (
                                      <div key={col.publicId} className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{col.columnName}:</span>
                                        <input
                                          type="text"
                                          className="w-28 h-6 px-1.5 text-[10px] rounded border bg-background/50 focus:bg-background focus:ring-1 focus:ring-ring focus:outline-none transition-all"
                                          defaultValue={cellVal}
                                          onBlur={(e) => {
                                            const val = e.target.value
                                            if (val !== cellVal) {
                                              saveValueMutation.mutate({
                                                resultPublicId: item.publicId,
                                                data: {
                                                  customColumnPublicId: col.publicId,
                                                  value: val,
                                                }
                                              })
                                            }
                                          }}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4.5 self-end sm:self-auto text-xs shrink-0">
                            <div>
                              <span className="text-muted-foreground">Score: </span>
                              <span className="font-mono font-bold text-foreground">{formatScore(displayScore)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Latency: </span>
                              <span className="font-mono font-semibold text-foreground">{formatDuration(item.latencyMs)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Assertions: </span>
                              <Badge variant="secondary" className="font-mono font-semibold">
                                {item.assertions.filter((a) => a.passed).length}/{item.assertions.length}
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUpIcon className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronDownIcon className="size-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Expanded details section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-muted/15 border-t border-border/30"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
                            {/* Left Column: API Inputs & Responses */}
                            <div className="flex flex-col gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Thông tin đầu vào (Input variables)</h4>
                                <div className="rounded-lg border bg-background/50 p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-sm">
                                  {item.inputData}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kết quả phản hồi thực tế (API Output)</h4>
                                  {item.actualOutput && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 text-primary hover:bg-primary/5"
                                      onClick={() => handleCopy(item.actualOutput!, 'API Output')}
                                    >
                                      <CopyIcon className="size-3 mr-1" /> Copy JSON
                                    </Button>
                                  )}
                                </div>
                                <pre className="rounded-lg border bg-zinc-950 text-zinc-200 p-3.5 text-xs font-mono max-h-[260px] overflow-y-auto leading-relaxed shadow-sm select-text selection:bg-zinc-800">
                                  {item.actualOutput ? (
                                    (() => {
                                      try {
                                        const parsed = JSON.parse(item.actualOutput)
                                        return JSON.stringify(parsed, null, 2)
                                      } catch {
                                        return item.actualOutput
                                      }
                                    })()
                                  ) : (
                                    <span className="text-zinc-500 italic">Không có dữ liệu trả về</span>
                                  )}
                                </pre>
                              </div>
                            </div>

                            {/* Right Column: Assertions & Rubrics Check Details */}
                            <div className="flex flex-col gap-4">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chi tiết các quy tắc xác thực (Assertions)</h4>
                              {!hasAssertions ? (
                                <div className="rounded-lg border bg-background/30 p-4 text-center text-xs text-muted-foreground italic">
                                  Không có quy tắc kiểm tra (assertions) nào được cấu hình cho case này.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3">
                                  {item.assertions.map((assertion) => {
                                    const isLlmJudge = assertion.assertionType === 'LLM_JUDGE'
                                    return (
                                      <div
                                        key={assertion.assertionName}
                                        className={`rounded-lg border p-3.5 shadow-sm transition-all bg-background ${
                                          assertion.passed
                                            ? 'border-emerald-500/20 hover:border-emerald-500/40'
                                            : 'border-destructive/20 hover:border-destructive/40'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2.5">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={assertion.passed ? 'outline' : 'destructive'} className="text-[10px] font-bold">
                                              {assertion.passed ? 'Pass' : 'Fail'}
                                            </Badge>
                                            <span className="font-semibold text-xs text-foreground">{assertion.assertionName}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                              {assertion.assertionType}
                                            </span>
                                          </div>
                                          <span className="font-mono text-xs font-bold text-foreground">{formatScore(assertion.score)}</span>
                                        </div>

                                        {/* Assertion comparison path details */}
                                        {assertion.responsePath && (
                                          <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                                            JSON Path: <strong className="text-foreground">{assertion.responsePath}</strong>
                                          </div>
                                        )}

                                        {/* Expected vs Actual logic */}
                                        {!isLlmJudge && (assertion.expectedValue !== null || assertion.actualValue !== null) && (
                                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/40 text-[10px] font-mono leading-relaxed bg-muted/10 p-1.5 rounded">
                                            <div>
                                              <span className="text-muted-foreground block">Kì vọng:</span>
                                              <span className="text-foreground font-semibold break-all">{assertion.expectedValue ?? 'null'}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Thực tế:</span>
                                              <span className="text-foreground font-semibold break-all">{assertion.actualValue ?? 'null'}</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Assertion feedback / reason */}
                                        {assertion.reason && (
                                          <div className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed ${
                                            assertion.passed ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/5 text-destructive'
                                          }`}>
                                            <strong className="font-semibold block mb-0.5">Lý do chấm điểm:</strong>
                                            <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{assertion.reason}</p>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* QC Override Panel */}
                              <div className="rounded-lg border bg-background p-4.5 shadow-sm mt-2">
                                <div className="flex items-center justify-between border-b pb-2.5 mb-4">
                                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hiệu chỉnh kết quả (QC Override)</h4>
                                  {item.override ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 font-bold text-[10px] py-0.5">
                                      <Check data-icon="inline-start" />
                                      Đã hiệu chỉnh bởi {item.override.correctedByUserEmail}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground text-[10px] py-0.5">Chưa hiệu chỉnh</Badge>
                                  )}
                                </div>

                                <form onSubmit={(e) => {
                                  e.preventDefault()
                                  const form = e.currentTarget
                                  const status = (form.elements.namedItem('status') as HTMLSelectElement).value as TestCaseStatus
                                  const score = parseFloat((form.elements.namedItem('score') as HTMLInputElement).value) / 100
                                  const reason = (form.elements.namedItem('reason') as HTMLTextAreaElement).value
                                  
                                  overrideMutation.mutate({
                                    resultPublicId: item.publicId,
                                    data: {
                                      overriddenStatus: status,
                                      overriddenScore: score,
                                      correctedReason: reason,
                                    }
                                  })
                                }}>
                                  <FieldGroup className="gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <Field>
                                        <FieldLabel className="text-xs font-semibold">Trạng thái QC</FieldLabel>
                                        <select
                                          name="status"
                                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring"
                                          defaultValue={item.override?.overriddenStatus ?? item.status}
                                        >
                                          <option value="PASSED">Đạt (PASSED)</option>
                                          <option value="FAILED">Không đạt (FAILED)</option>
                                          <option value="ERROR">Lỗi (ERROR)</option>
                                        </select>
                                      </Field>

                                      <Field>
                                        <FieldLabel className="text-xs font-semibold">Điểm số QC (%)</FieldLabel>
                                        <Input
                                          type="number"
                                          name="score"
                                          min="0"
                                          max="100"
                                          defaultValue={Math.round((item.override?.overriddenScore ?? item.score ?? 0) * 100)}
                                          placeholder="0-100"
                                          className="h-9 text-xs rounded-lg"
                                          required
                                        />
                                      </Field>
                                    </div>

                                    <Field>
                                      <FieldLabel className="text-xs font-semibold">Lý do hiệu chỉnh</FieldLabel>
                                      <textarea
                                        name="reason"
                                        rows={2}
                                        defaultValue={item.override?.correctedReason ?? ''}
                                        className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring transition-colors"
                                        placeholder="Nhập lý do hoặc bug ID..."
                                      />
                                    </Field>

                                    <div className="flex justify-end">
                                      <Button
                                        type="submit"
                                        size="sm"
                                        disabled={overrideMutation.isPending}
                                        className="h-8 text-xs rounded-lg"
                                      >
                                        {overrideMutation.isPending && <Spinner data-icon="inline-start" />}
                                        Lưu hiệu chỉnh
                                      </Button>
                                    </div>
                                  </FieldGroup>
                                </form>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addColOpen} onOpenChange={setAddColOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm cột QC tùy chỉnh</DialogTitle>
            <DialogDescription>
              Tạo trường thông tin đánh giá mới (Ví dụ: Bug ID, Ghi chú QC, ...).
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!newColName.trim()) return
              addColMutation.mutate(
                { columnName: newColName.trim(), dataType: 'TEXT' },
                {
                  onSuccess: () => {
                    setAddColOpen(false)
                    setNewColName('')
                  },
                }
              )
            }}
          >
            <FieldGroup className="gap-4 py-4">
              <Field>
                <FieldLabel>Tên cột</FieldLabel>
                <Input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Ví dụ: Bug ID, QC Notes"
                  autoFocus
                  required
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddColOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={addColMutation.isPending}>
                {addColMutation.isPending && <Spinner data-icon="inline-start" />}
                Thêm cột
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TestRunJobProgressDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        job={exportJob}
        onComplete={handleExportComplete}
      />
    </div>
  )
}
