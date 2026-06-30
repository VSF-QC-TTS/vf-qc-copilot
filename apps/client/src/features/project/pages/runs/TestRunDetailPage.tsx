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
import { useTestRunMetrics } from '../../hooks/useTestRunMetrics'
import { useTestRunFilters } from '../../hooks/useTestRunFilters'
import { RunStatusBadge, CaseStatusBadge } from '../../components/RunStatusBadge'
import { TestRunJobProgressDialog } from '../../components/TestRunJobProgressDialog'
import { TestRunCompareCharts } from '../../components/TestRunCompareCharts'
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
  const [expandedAssertions, setExpandedAssertions] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState<'index' | 'latency'>('index')

  const resultsList = useMemo(() => resultsQuery.data?.content || [], [resultsQuery.data?.content])
  const isRunning = run?.status === 'QUEUED' || run?.status === 'RUNNING'

  const { metrics, latencyStats, radialProps } = useTestRunMetrics(run, resultsList, isRunning, resultsQuery.data?.totalElements)
  const { totalCases, processedCases, passedCases, failedCases, errorCases, computedScore, progress } = metrics
  
  const { filteredCases } = useTestRunFilters(resultsList, searchQuery, statusFilter as any, sortBy as any)

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

  const expandAllAssertions = () => {
    const next: Record<string, boolean> = {}
    filteredCases.forEach(c => next[c.publicId] = true)
    setExpandedAssertions(next)
  }

  const collapseAllAssertions = () => {
    setExpandedAssertions({})
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-16 px-6 md:px-12 py-24 md:py-32 font-sans bg-[#FBFBFA] min-h-[100dvh]">
      {/* Header section */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-[#EAEAEA] pb-12">
        <div className="flex flex-col gap-6 max-w-4xl">
          <Button asChild variant="ghost" className="w-fit -ml-3 text-[#787774] hover:text-[#111111] hover:bg-transparent">
            <Link to={`/projects/${publicId}/runs`}>
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Lịch sử lượt chạy
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-[clamp(2.5rem,4vw,4rem)] leading-[1.1] tracking-[-0.03em] text-[#111111] mb-6">
              {run?.name ?? 'Chi tiết lượt chạy'}
            </h1>
            <div className="flex items-center gap-3 font-mono text-xs text-[#787774]">
              {run && <RunStatusBadge status={run.status} />}
              <span>
                Tạo lúc: {run?.createdAt ? new Date(run.createdAt).toLocaleString('vi-VN') : 'Đang tải...'}
                {run?.finishedAt && ` · Hoàn thành: ${new Date(run.finishedAt).toLocaleString('vi-VN')}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 pb-2">
          {run && run.status === 'COMPLETED' && (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-5 border-[#EAEAEA] bg-white text-[#111111] hover:bg-[#F7F6F3] rounded shadow-none"
                onClick={() => setAddColOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm cột QC
              </Button>

              <Button
                type="button"
                variant="default"
                className="h-11 px-5 bg-[#111111] text-white hover:bg-[#333333] hover:scale-[0.98] transition-all rounded shadow-none"
                disabled={exportMutation.isPending}
                onClick={handleExportExcel}
              >
                {exportMutation.isPending ? <Spinner data-icon="inline-start" /> : <Download className="mr-2 h-4 w-4" />}
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
              className="h-11 px-5 border-[#FDEBEC] bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#f9d7d8] rounded shadow-none"
            >
              <BanIcon className="mr-2 h-4 w-4" />
              Hủy chạy test
            </Button>
          )}
        </div>
      </div>

      {run?.errorMessage && (
        <Alert variant="destructive" className="bg-[#FDEBEC] text-[#9F2F2D] border-[#EAEAEA] rounded shadow-none">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <AlertTitle className="font-bold">Lỗi hệ thống</AlertTitle>
            <AlertDescription className="text-xs font-mono whitespace-pre-wrap break-all leading-[1.6]">
              {formatErrorMessage(run.errorMessage)}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Analytics Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-4 grid-flow-dense">
        {/* Metric 1: Overall Radial Progress */}
        <div className="border border-[#EAEAEA] bg-white rounded-md md:col-span-1 flex flex-col justify-between overflow-hidden p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
          <div className="pb-4 border-b border-[#EAEAEA] mb-4">
            <h3 className="text-xs font-bold text-[#787774] uppercase tracking-widest">Điểm số tổng quan</h3>
          </div>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative flex items-center justify-center">
              <svg className="size-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radialProps.radius}
                  className="text-[#EAEAEA] stroke-current"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radialProps.radius}
                  className="text-[#111111] stroke-current transition-all duration-500 ease-out"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={radialProps.circumference}
                  strokeDashoffset={radialProps.strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono text-3xl font-bold text-[#111111]">
                {formatScore(computedScore)}
              </span>
            </div>
            <div className="mt-4 text-xs text-[#787774] font-mono">Tỉ lệ ca test đạt yêu cầu</div>
          </div>
        </div>

        {/* Metric 2: Progress & Distribution */}
        <div className="border border-[#EAEAEA] bg-white rounded-md md:col-span-2 flex flex-col justify-between overflow-hidden p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
          <div className="pb-4 border-b border-[#EAEAEA] mb-4">
            <h3 className="text-xs font-bold text-[#787774] uppercase tracking-widest">Tiến độ & Phân bố kết quả</h3>
          </div>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div>
              <div className="flex justify-between text-sm mb-2 font-mono text-[#111111]">
                <span>Tiến độ thực thi</span>
                <span>{progress}% ({processedCases}/{totalCases} cases)</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-[#F7F6F3]">
                <div
                  className="h-full rounded bg-[#111111] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs text-[#787774] block mb-3 font-mono">Tỷ lệ các trạng thái</span>
              <div className="h-6 w-full flex rounded overflow-hidden border border-[#EAEAEA] bg-[#F7F6F3]">
                {passedCases > 0 && (
                  <div
                    className="bg-[#EDF3EC] text-[#346538] font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(passedCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Đạt: ${passedCases}`}
                  >
                    {passedCases}
                  </div>
                )}
                {failedCases > 0 && (
                  <div
                    className="bg-[#FDEBEC] text-[#9F2F2D] font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(failedCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Lỗi: ${failedCases}`}
                  >
                    {failedCases}
                  </div>
                )}
                {errorCases > 0 && (
                  <div
                    className="bg-[#FBF3DB] text-[#956400] font-mono text-[10px] font-bold flex items-center justify-center transition-all"
                    style={{ width: `${(errorCases / Math.max(processedCases, 1)) * 100}%` }}
                    title={`Hỏng: ${errorCases}`}
                  >
                    {errorCases}
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-3 text-xs text-[#787774] font-mono">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#EDF3EC] border border-[#346538]/30" /> Đạt ({passedCases})</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#FDEBEC] border border-[#9F2F2D]/30" /> Lỗi ({failedCases})</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#FBF3DB] border border-[#956400]/30" /> Hỏng ({errorCases})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Response Latency Overview */}
        <div className="border border-[#EAEAEA] bg-white rounded-md md:col-span-1 flex flex-col justify-between overflow-hidden p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
          <div className="pb-4 border-b border-[#EAEAEA] mb-4">
            <h3 className="text-xs font-bold text-[#787774] uppercase tracking-widest">Thời gian phản hồi API</h3>
          </div>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 text-center divide-x divide-[#EAEAEA]">
              <div>
                <div className="text-[10px] text-[#787774] font-mono uppercase">Min</div>
                <div className="font-mono text-sm font-bold mt-1 text-[#111111]">{formatDuration(latencyStats.min)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#787774] font-mono uppercase">Avg</div>
                <div className="font-mono text-sm font-bold mt-1 text-[#111111]">{formatDuration(latencyStats.avg)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#787774] font-mono uppercase">Max</div>
                <div className="font-mono text-sm font-bold mt-1 text-[#111111]">{formatDuration(latencyStats.max)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-[#EAEAEA]">
              <span className="text-[10px] text-[#787774] font-mono uppercase text-center mb-1">Phân bố độ trễ (ms)</span>
              {resultsList && resultsList.length > 0 ? (
                <div className="h-10 w-full flex items-end justify-between border border-[#EAEAEA] rounded bg-[#F7F6F3] p-1 gap-[1px]">
                  {resultsList.map((c) => {
                    const pct = latencyStats.max > 0 ? ((c.latencyMs ?? 0) / latencyStats.max) * 90 + 10 : 10
                    let barColor = 'bg-[#EAEAEA] hover:bg-[#111111]'
                    if (c.status === 'FAILED') barColor = 'bg-[#FDEBEC] hover:bg-[#9F2F2D]'
                    if (c.status === 'ERROR') barColor = 'bg-[#FBF3DB] hover:bg-[#956400]'
                    return (
                      <div
                        key={c.publicId}
                        style={{ height: `${pct}%` }}
                        className={`flex-1 rounded-[1px] transition-colors ${barColor}`}
                        title={`Case #${c.caseIndex}: ${c.latencyMs}ms (${c.status})`}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="h-10 w-full bg-[#F7F6F3] rounded flex items-center justify-center text-[10px] text-[#787774] font-mono">Chưa có kết quả</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {run?.runType === 'COMPARISON' && resultsList && resultsList.length > 0 && (
        <TestRunCompareCharts results={resultsList} />
      )}

      {/* Main Results Table & Filters Card */}
      <div className="border border-[#EAEAEA] bg-white rounded-md flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
        <div className="p-6 border-b border-[#EAEAEA] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#111111] mb-2">Báo cáo ca test chi tiết</h3>
            <p className="text-sm text-[#787774] leading-[1.6]">Tìm kiếm dữ liệu, lọc trạng thái và mở rộng xem so khớp JSON.</p>
          </div>

          {/* Active filters bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#787774]" />
              <Input
                type="text"
                placeholder="Tìm kiếm nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm rounded border-[#EAEAEA] shadow-none bg-[#F7F6F3] focus-visible:ring-1 focus-visible:ring-[#111111]"
              />
            </div>

            {/* Status segmented filters control */}
            <div className="flex items-center gap-1 rounded border border-[#EAEAEA] bg-[#F7F6F3] p-1 text-sm select-none">
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
                    className={`h-8 px-3 rounded-[3px] text-xs transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgb(0,0,0,0.05)] font-bold'
                        : 'text-[#787774] hover:bg-[#EAEAEA]/50 hover:text-[#111111]'
                    }`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>

            {/* Sorting trigger */}
            <div className="flex items-center gap-1 rounded border border-[#EAEAEA] bg-[#F7F6F3] p-1 text-sm select-none">
              <Button
                type="button"
                variant="ghost"
                className={`h-8 px-3 rounded-[3px] text-xs transition-all duration-200 ${
                  sortBy === 'index'
                    ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgb(0,0,0,0.05)] font-bold'
                    : 'text-[#787774] hover:bg-[#EAEAEA]/50 hover:text-[#111111]'
                }`}
                onClick={() => setSortBy('index')}
              >
                Sắp xếp: Case ID
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`h-8 px-3 rounded-[3px] text-xs transition-all duration-200 ${
                  sortBy === 'latency'
                    ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgb(0,0,0,0.05)] font-bold'
                    : 'text-[#787774] hover:bg-[#EAEAEA]/50 hover:text-[#111111]'
                }`}
                onClick={() => setSortBy('latency')}
              >
                Sắp xếp: Độ trễ
              </Button>
            </div>

            {/* Expand / Collapse All buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 text-xs px-3 rounded border-[#EAEAEA] text-[#111111] hover:bg-[#F7F6F3]" onClick={expandAll}>
                Mở hết
              </Button>
              <Button variant="outline" className="h-10 text-xs px-3 rounded border-[#EAEAEA] text-[#111111] hover:bg-[#F7F6F3]" onClick={collapseAll}>
                Thu hết
              </Button>
            </div>
          </div>
        </div>

        <div className="p-0">
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
                                    const cellVal = item.customValues?.find((v: any) => v.customColumnPublicId === col.publicId)?.value ?? ''
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
                                {item.assertions.filter((a: any) => a.passed).length}/{item.assertions.length}
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
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Thông tin đầu vào (Input variables)</h4>
                                <div className="rounded-lg border bg-background/80 p-3 text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-sm">
                                  {item.inputData}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Kết quả phản hồi thực tế (API Output)</h4>
                                  {item.actualOutput && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2.5 text-primary hover:bg-primary/5"
                                      onClick={() => handleCopy(item.actualOutput!, 'API Output')}
                                    >
                                      <CopyIcon className="size-3 mr-1" /> Copy JSON
                                    </Button>
                                  )}
                                </div>
                                <pre className="rounded-lg border bg-background text-foreground p-4 text-sm font-mono max-h-[300px] overflow-y-auto leading-relaxed shadow-sm select-text selection:bg-primary/20">
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
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Chi tiết các quy tắc xác thực (Assertions)</h4>
                                {hasAssertions && (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground" onClick={expandAllAssertions}>Mở hết</Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground" onClick={collapseAllAssertions}>Thu hết</Button>
                                  </div>
                                )}
                              </div>
                              {!hasAssertions ? (
                                <div className="rounded-lg border bg-background/30 p-4 text-center text-sm text-muted-foreground italic">
                                  Không có quy tắc kiểm tra (assertions) nào được cấu hình cho case này.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3">
                                  {item.assertions.map((assertion: any) => {
                                    const isLlmJudge = assertion.assertionType === 'LLM_JUDGE'
                                    const isAssertionsListExpanded = expandedAssertions[item.publicId] ?? (item.assertions.length <= 1)

                                    return (
                                      <div
                                        key={assertion.assertionName}
                                        className="rounded-lg border border-border bg-background p-4 shadow-sm transition-all"
                                      >
                                        <div 
                                          className="flex items-start justify-between gap-2.5 cursor-pointer select-none"
                                          onClick={() => setExpandedAssertions(prev => ({ ...prev, [item.publicId]: !isAssertionsListExpanded }))}
                                        >
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={assertion.passed ? 'outline' : 'destructive'} className={`text-xs font-bold ${assertion.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}`}>
                                              {assertion.passed ? 'Pass' : 'Fail'}
                                            </Badge>
                                            <span className="font-semibold text-sm text-foreground">{assertion.assertionName}</span>
                                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                              {assertion.assertionType}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-foreground">{formatScore(assertion.score)}</span>
                                            {isAssertionsListExpanded ? <ChevronUpIcon className="size-4 text-muted-foreground" /> : <ChevronDownIcon className="size-4 text-muted-foreground" />}
                                          </div>
                                        </div>

                                        <AnimatePresence>
                                          {isAssertionsListExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                              className="overflow-hidden"
                                            >
                                              {/* Assertion comparison path details */}
                                              {assertion.responsePath && (
                                                <div className="text-xs text-muted-foreground font-mono mt-1">
                                                  JSON Path: <strong className="text-foreground">{assertion.responsePath}</strong>
                                                </div>
                                              )}

                                              {/* Expected vs Actual logic */}
                                              {!isLlmJudge && (assertion.expectedValue !== null || assertion.actualValue !== null) && (
                                                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40 text-xs font-mono leading-relaxed bg-muted/20 p-2.5 rounded-md">
                                                  <div>
                                                    <span className="text-muted-foreground block mb-1">Kì vọng:</span>
                                                    <span className="text-foreground font-semibold break-all">{assertion.expectedValue ?? 'null'}</span>
                                                  </div>
                                                  <div>
                                                    <span className="text-muted-foreground block mb-1">Thực tế:</span>
                                                    <span className="text-foreground font-semibold break-all">{assertion.actualValue ?? 'null'}</span>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Assertion feedback / reason */}
                                              {assertion.reason && (
                                                <div className="mt-3 p-3 rounded-lg border border-border/50 text-sm leading-relaxed bg-muted/30">
                                                  <strong className={`font-semibold block mb-1 ${assertion.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                                    Lý do chấm điểm:
                                                  </strong>
                                                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/80">{assertion.reason}</p>
                                                </div>
                                              )}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* QC Override Panel */}
                              <div className="rounded-lg border bg-background p-5 shadow-sm mt-2">
                                <div className="flex items-center justify-between border-b pb-3 mb-4">
                                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Hiệu chỉnh kết quả (QC Override)</h4>
                                  {item.override ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 font-bold text-xs py-0.5 px-2">
                                      <Check data-icon="inline-start" />
                                      Đã hiệu chỉnh bởi {item.override.correctedByUserEmail}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground text-xs py-0.5 px-2">Chưa hiệu chỉnh</Badge>
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
        </div>
      </div>

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
