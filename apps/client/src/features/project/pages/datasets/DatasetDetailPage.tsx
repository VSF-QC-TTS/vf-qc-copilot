import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  BotIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileUpIcon,
  PencilIcon,
  PlayIcon,
  Target,
  LayoutGrid,
  BookOpen,
  TableProperties,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { downloadDatasetVersionExcel, getExcelSheets } from '@/lib/dataset-api'
import type { SchemaColumnResponse } from '@/types/config'
import type { DatasetJobEventResponse, DatasetJobResponse, DatasetRowResponse } from '@/types/dataset'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useProjectSchema } from '../../hooks/use-project-schema'
import { useVerificationConfig } from '../../hooks/use-verification-config'
import {
  useActivateDatasetVersion,
  useDataset,
  useDatasetRows,
  useGenerateDatasetRows,
  useImportDatasetExcel,
  usePrepareDatasetExport,
  useSaveDatasetRows,
} from '../../hooks/use-datasets'
import { DatasetJobProgressDialog } from '../../components/DatasetJobProgressDialog'

const EMPTY_COLUMNS: readonly SchemaColumnResponse[] = []
const EMPTY_ROWS: readonly DatasetRowResponse[] = []

export function DatasetDetailPage() {
  const { publicId, datasetId } = useParams<{ publicId: string; datasetId: string }>()
  const queryClient = useQueryClient()
  const { data: dataset, isLoading } = useDataset(datasetId)
  const { data: schema } = useProjectSchema(publicId)
  const latestVersionId = dataset?.latestVersion?.publicId
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(latestVersionId)
  const rowsQuery = useDatasetRows(datasetId, selectedVersionId)
  const importMutation = useImportDatasetExcel(datasetId)
  const generateMutation = useGenerateDatasetRows(datasetId)
  const exportMutation = usePrepareDatasetExport(datasetId, selectedVersionId)
  const activateMutation = useActivateDatasetVersion(datasetId, selectedVersionId)
  const saveRowsMutation = useSaveDatasetRows(datasetId, selectedVersionId)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [job, setJob] = useState<DatasetJobResponse | null>(null)
  const [jobOpen, setJobOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [context, setContext] = useState('')
  const [notes, setNotes] = useState('')
  const [rowCount, setRowCount] = useState(10)
  const [rowsJson, setRowsJson] = useState('[]')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetSelectOpen, setSheetSelectOpen] = useState(false)
  const [selectedSheet, setSelectedSheet] = useState('')
  const [isReadingSheets, setIsReadingSheets] = useState(false)
  const { data: verificationConfig } = useVerificationConfig(publicId)
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'library'>('table')
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0)

  const columns = schema?.columns ?? EMPTY_COLUMNS
  const rows = rowsQuery.data?.content ?? EMPTY_ROWS
  const selectedVersion = useMemo(() => {
    return dataset?.versions.find((v) => v.publicId === selectedVersionId)
  }, [dataset?.versions, selectedVersionId])

  const isSelectedVersionActive = dataset?.activeVersion?.publicId === selectedVersionId
  const canActivate = selectedVersion && selectedVersion.status !== 'ACTIVE' && selectedVersion.status !== 'INVALID'
  const displayColumns = useMemo(() => {
    if (columns.length > 0) {
      return columns.map((column) => column.columnName)
    }
    return Array.from(new Set(rows.flatMap((row) => Object.keys(row.data))))
  }, [columns, rows])

  const evaluatedColumns = useMemo(() => {
    const cols = new Set<string>()
    if (!verificationConfig?.items || verificationConfig.items.length === 0) {
      return cols
    }

    const columnMap = new Map<string, string>()
    columns.forEach((col) => {
      if (col.publicId) {
        columnMap.set(col.publicId, col.columnName)
      }
    })

    for (const item of verificationConfig.items) {
      if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion?.expectedColumnKey) {
        const colName = columnMap.get(item.fieldAssertion.expectedColumnKey)
        if (colName) {
          cols.add(colName)
        }
      } else if (item.type === 'LLM_JUDGE' && item.referenceColumnKeys) {
        item.referenceColumnKeys.forEach((key) => {
          const colName = columnMap.get(key)
          if (colName) {
            cols.add(colName)
          }
        })
      }
    }
    return cols
  }, [columns, verificationConfig])

  useEffect(() => {
    setSelectedRowIndex(0)
  }, [selectedVersionId])

  useEffect(() => {
    if (latestVersionId && !selectedVersionId) {
      setSelectedVersionId(latestVersionId)
    }
  }, [latestVersionId, selectedVersionId])

  useEffect(() => {
    if (editOpen) {
      setRowsJson(JSON.stringify(rows.map((row) => row.data), null, 2))
    }
  }, [editOpen, rows])

  const handleJobComplete = useCallback(
    (event: DatasetJobEventResponse): void => {
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] })
      queryClient.invalidateQueries({ queryKey: ['datasets', publicId] })
      queryClient.invalidateQueries({ queryKey: ['datasetRows', datasetId] })
      queryClient.invalidateQueries({ queryKey: ['projectSchema', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
      if (event.datasetVersionPublicId) {
        setSelectedVersionId(event.datasetVersionPublicId)
      }
      if (event.type === 'EXPORT_EXCEL' && event.status === 'COMPLETED' && event.datasetVersionPublicId && datasetId) {
        void downloadDatasetVersionExcel(datasetId, event.datasetVersionPublicId).catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : 'Không tải được file export')
        })
      }
    },
    [datasetId, publicId, queryClient],
  )

  function handleImportClick(): void {
    inputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setIsReadingSheets(true)
    getExcelSheets(datasetId!, file)
      .then((sheetNames) => {
        setIsReadingSheets(false)
        if (sheetNames.length <= 1) {
          const defaultSheet = sheetNames[0] || null
          importMutation.mutate({ file, sheetName: defaultSheet }, {
            onSuccess: (nextJob) => {
              setJob(nextJob)
              setJobOpen(true)
            },
          })
        } else {
          setPendingFile(file)
          setSheets(sheetNames)
          setSelectedSheet(sheetNames[0])
          setSheetSelectOpen(true)
        }
      })
      .catch((err: any) => {
        setIsReadingSheets(false)
        toast.error(err instanceof Error ? err.message : 'Không đọc được danh sách sheet từ file Excel')
      })
  }

  function handleSheetConfirm(): void {
    if (!pendingFile || !selectedSheet) {
      return
    }
    importMutation.mutate(
      { file: pendingFile, sheetName: selectedSheet },
      {
        onSuccess: (nextJob) => {
          setJob(nextJob)
          setJobOpen(true)
          setSheetSelectOpen(false)
          setPendingFile(null)
          setSheets([])
        },
        onError: () => {
          setSheetSelectOpen(false)
          setPendingFile(null)
          setSheets([])
        }
      }
    )
  }

  function handleGenerateSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    generateMutation.mutate(
      { context, rowCount, notes: notes.trim() ? notes : null },
      {
        onSuccess: (nextJob) => {
          setGenerateOpen(false)
          setJob(nextJob)
          setJobOpen(true)
        },
      },
    )
  }

  function handleExport(): void {
    exportMutation.mutate(undefined, {
      onSuccess: (nextJob) => {
        setJob(nextJob)
        setJobOpen(true)
      },
    })
  }

  function handleSaveRows(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    try {
      const parsed = JSON.parse(rowsJson) as unknown
      if (!Array.isArray(parsed) || parsed.some((row) => row === null || typeof row !== 'object' || Array.isArray(row))) {
        toast.error('Rows phải là JSON array object')
        return
      }
      saveRowsMutation.mutate(
        { rows: parsed as Record<string, unknown>[] },
        {
          onSuccess: () => setEditOpen(false),
        },
      )
    } catch {
      toast.error('JSON rows không hợp lệ')
    }
  }

  const renderRowsContent = () => {
    if (dataset!.versions.length === 0) {
      return (
        <div className="p-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có version dữ liệu</EmptyTitle>
              <EmptyDescription>Import Excel hoặc AI generate để tạo version đầu tiên.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )
    }

    if (rows.length === 0) {
      return <div className="p-10 text-center text-sm text-muted-foreground">Version này chưa có row.</div>
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3 bg-muted/10">
          {rows.map((row) => {
            const isInvalid = row.validationStatus === 'INVALID'
            return (
              <Card
                key={row.publicId}
                className={`flex flex-col rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  isInvalid ? 'border-destructive/30 bg-destructive/5' : 'border-muted/50 bg-card'
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                  <span className="font-mono text-xs font-bold text-muted-foreground">Testcase #{row.rowIndex + 1}</span>
                  <RowStatusBadge value={row.validationStatus} />
                </CardHeader>
                <div className="flex flex-1 flex-col gap-3 p-4 text-xs">
                  {displayColumns.map((column) => {
                    const isEvaluated = evaluatedColumns.has(column)
                    return (
                      <div
                        key={column}
                        className={`rounded-lg p-2.5 border ${
                          isEvaluated
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/30 border-muted/20'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          <span>{column}</span>
                          {isEvaluated && (
                            <span className="flex items-center gap-1 text-primary text-[9px] font-sans font-medium">
                              <Target className="size-2.5" />
                              Trường chấm
                            </span>
                          )}
                        </div>
                        <div className="font-mono whitespace-pre-wrap break-all text-card-foreground">
                          {formatCell(row.data[column]) || <span className="italic text-muted-foreground">Trống</span>}
                        </div>
                      </div>
                    )
                  })}

                  {isInvalid && (
                    <div className="mt-auto flex items-start gap-1.5 rounded-lg bg-destructive/10 p-3 text-destructive border border-destructive/15">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <div className="font-bold text-[10px] uppercase">Lỗi validation</div>
                        <div>{row.validationErrors.map((error) => error.message).join('; ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )
    }

    if (viewMode === 'library') {
      const selectedRow = rows[selectedRowIndex]
      return (
        <div className="grid min-h-[460px] grid-cols-1 divide-y md:grid-cols-[280px_1fr] md:divide-y-0 md:divide-x border-t">
          {/* Master list */}
          <div className="h-[460px] overflow-y-auto bg-card">
            {rows.map((row, idx) => {
              const isSelected = idx === selectedRowIndex
              const firstKey = displayColumns[0]
              const snippet = firstKey ? formatCell(row.data[firstKey]) : ''

              return (
                <button
                  key={row.publicId}
                  type="button"
                  onClick={() => setSelectedRowIndex(idx)}
                  className={`w-full text-left p-4 transition-all flex flex-col gap-2 border-b last:border-b-0 ${
                    isSelected
                      ? 'bg-primary/5 border-l-4 border-l-primary'
                      : 'hover:bg-muted/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold text-muted-foreground">#{row.rowIndex + 1}</span>
                    <RowStatusBadge value={row.validationStatus} />
                  </div>
                  {snippet && (
                    <p className="text-xs text-muted-foreground line-clamp-2 break-all font-mono">
                      {snippet}
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="p-6 overflow-y-auto h-[460px] bg-muted/5 flex flex-col gap-6">
            {selectedRow ? (
              <>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-card-foreground">Chi tiết Testcase #{selectedRow.rowIndex + 1}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {selectedRow.publicId}</p>
                  </div>
                  <RowStatusBadge value={selectedRow.validationStatus} />
                </div>

                {selectedRow.validationStatus === 'INVALID' && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-4 text-destructive border border-destructive/20 shadow-sm">
                    <AlertTriangle className="size-5 shrink-0 mt-0.5 text-destructive" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-destructive/90">Lỗi kiểm tra tính hợp lệ</h4>
                      <ul className="list-disc list-inside mt-1.5 text-xs flex flex-col gap-1.5">
                        {selectedRow.validationErrors.map((error, idx) => (
                          <li key={idx}>
                            <span className="font-mono font-bold text-destructive/90">{error.columnName}</span>: {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {displayColumns.map((column) => {
                    const isEvaluated = evaluatedColumns.has(column)
                    return (
                      <div
                        key={column}
                        className={`rounded-xl border p-4 shadow-sm bg-card ${
                          isEvaluated ? 'border-primary/20 ring-1 ring-primary/5' : 'border-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase font-bold border-b pb-2 mb-3">
                          <span>{column}</span>
                          {isEvaluated && (
                            <span className="flex items-center gap-1 text-primary text-[10px] font-sans font-medium">
                              <Target className="size-3 text-primary" />
                              Cột chấm điểm
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm whitespace-pre-wrap break-all leading-relaxed text-card-foreground">
                          {formatCell(selectedRow.data[column]) || <span className="italic text-muted-foreground">Trống</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Vui lòng chọn một testcase ở danh sách bên trái.
              </div>
            )}
          </div>
        </div>
      )
    }

    // Default Table view
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">#</TableHead>
            <TableHead className="w-[110px]">Trạng thái</TableHead>
            {displayColumns.map((column) => {
              const isEvaluated = evaluatedColumns.has(column)
              return (
                <TableHead key={column} className={isEvaluated ? 'text-primary font-semibold' : ''}>
                  <div className="flex items-center gap-1.5">
                    {column}
                    {isEvaluated && (
                      <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary border border-primary/20 font-medium">
                        <Target className="size-2.5" />
                        Được chấm
                      </span>
                    )}
                  </div>
                </TableHead>
              )
            })}
            <TableHead className="min-w-[240px]">Chi tiết lỗi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.publicId}
              className={row.validationStatus === 'INVALID' ? 'bg-destructive/5 hover:bg-destructive/10' : ''}
            >
              <TableCell className="font-mono text-xs">{row.rowIndex + 1}</TableCell>
              <TableCell>
                <RowStatusBadge value={row.validationStatus} />
              </TableCell>
              {displayColumns.map((column) => (
                <TableCell key={column} className="max-w-[260px] truncate font-mono text-xs">
                  {formatCell(row.data[column])}
                </TableCell>
              ))}
              <TableCell className="max-w-[360px] whitespace-normal text-xs font-medium text-destructive">
                {row.validationErrors.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>{row.validationErrors.map((error) => error.message).join('; ')}</span>
                  </div>
                ) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (isLoading || !dataset) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
        <Card className="h-32 animate-pulse rounded-lg" />
        <Card className="h-[420px] animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to={`/projects/${publicId}/datasets`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Datasets
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{dataset.name}</h1>
            <DatasetStatusBadge value={dataset.status} />
            {dataset.latestVersion ? <VersionStatusBadge value={dataset.latestVersion.status} /> : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {dataset.description ?? 'Import Excel, sinh rows bằng AI hoặc chỉnh dữ liệu thủ công theo schema dự án.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
          <Button
            type="button"
            variant="outline"
            onClick={handleImportClick}
            disabled={importMutation.isPending || isReadingSheets}
          >
            {importMutation.isPending || isReadingSheets ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <FileUpIcon data-icon="inline-start" />
            )}
            Import Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => setGenerateOpen(true)}>
            <BotIcon data-icon="inline-start" />
            AI generate
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditOpen(true)} disabled={!selectedVersionId}>
            <PencilIcon data-icon="inline-start" />
            Edit JSON
          </Button>
          <Button type="button" onClick={handleExport} disabled={!selectedVersionId || exportMutation.isPending}>
            {exportMutation.isPending ? <Spinner data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Tổng số câu test" value={dataset.latestVersion?.totalRows ?? 0} />
        <MetricCard label="Hợp lệ" value={dataset.latestVersion?.validRows ?? 0} />
        <MetricCard
          label="Số dòng lỗi"
          value={dataset.latestVersion?.invalidRows ?? 0}
          isAlert={!!dataset.latestVersion?.invalidRows}
        />
        <MetricCard label="Tổng số phiên bản" value={dataset.versions.length} />
      </div>

      {/* Warnings about inactive versions */}
      {!dataset.activeVersion ? (
        <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
          <AlertTriangle className="size-4 text-destructive animate-pulse" />
          <AlertTitle className="font-bold">Chưa có phiên bản dữ liệu hoạt động</AlertTitle>
          <AlertDescription className="text-xs mt-1 leading-relaxed">
            Dataset này chưa được kích hoạt phiên bản hoạt động nào. QC bắt buộc phải chọn một phiên bản hợp lệ (ví dụ: <strong className="underline">v1</strong>) ở danh sách dưới và nhấn nút <strong className="underline">Kích hoạt (Active version)</strong> để có thể sử dụng dữ liệu này khi <strong>Chạy Test</strong>.
          </AlertDescription>
        </Alert>
      ) : !isSelectedVersionActive ? (
        <Alert className="bg-amber-500/5 text-amber-600 border-amber-500/20 rounded-xl">
          <Info className="size-4 text-amber-600" />
          <AlertTitle className="font-bold">Đang xem phiên bản chưa kích hoạt</AlertTitle>
          <AlertDescription className="text-xs mt-1 leading-relaxed">
            Bạn đang xem dữ liệu của phiên bản <strong>v{selectedVersion?.versionNumber}</strong> (chưa kích hoạt). Hệ thống vẫn đang sử dụng phiên bản hoạt động <strong>v{dataset.activeVersion.versionNumber}</strong> để chạy đánh giá. Nhấn nút <strong className="underline">Kích hoạt (Active version)</strong> bên dưới để áp dụng phiên bản này.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="rounded-xl border border-muted/50 overflow-hidden">
        <CardHeader className="border-b bg-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Dataset rows</CardTitle>
              <CardDescription className="text-xs">QC nhìn được từng field, trạng thái validation và lỗi của từng dòng.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle Buttons */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs">
                <Button
                  type="button"
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 rounded-md text-xs"
                  onClick={() => setViewMode('table')}
                >
                  <TableProperties className="mr-1.5 size-3.5" />
                  Bảng
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 rounded-md text-xs"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="mr-1.5 size-3.5" />
                  Thẻ Grid
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'library' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 rounded-md text-xs"
                  onClick={() => setViewMode('library')}
                >
                  <BookOpen className="mr-1.5 size-3.5" />
                  Thư viện
                </Button>
              </div>

              {/* Version Selector */}
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Chọn version" />
                </SelectTrigger>
                <SelectContent>
                  {dataset.versions.map((version) => (
                    <SelectItem key={version.publicId} value={version.publicId}>
                      v{version.versionNumber} · {version.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isSelectedVersionActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 cursor-default hover:bg-emerald-500/5 hover:text-emerald-600 font-medium"
                  disabled
                >
                  <CheckCircle2Icon className="mr-1.5 size-4" />
                  Phiên bản đang hoạt động
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all cursor-pointer relative"
                  onClick={() => activateMutation.mutate()}
                  disabled={!selectedVersionId || !canActivate || activateMutation.isPending}
                >
                  {activateMutation.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <CheckCircle2Icon data-icon="inline-start" />
                  )}
                  Kích hoạt (Active version)
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {renderRowsContent()}
        </CardContent>
      </Card>

      {dataset.latestVersion?.invalidRows ? (
        <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
          <AlertTriangle className="size-4" />
          <AlertTitle className="font-bold">Dataset còn lỗi validation</AlertTitle>
          <AlertDescription className="text-xs">
            Phiên bản có các dòng dữ liệu không hợp lệ (Invalid) sẽ không được phép kích hoạt (Active). Hãy kiểm tra chi tiết từng hàng hoặc tiến hành nhập lại dữ liệu sạch.
          </AlertDescription>
        </Alert>
      ) : null}

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <form onSubmit={handleGenerateSubmit}>
            <DialogHeader>
              <DialogTitle>AI generate dataset rows</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>Context nghiệp vụ</FieldLabel>
                <Textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  className="min-h-[180px] font-mono text-sm"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <Field>
                  <FieldLabel>Số rows</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={rowCount}
                    onChange={(event) => setRowCount(Number(event.target.value))}
                  />
                </Field>
                <Field>
                  <FieldLabel>Ghi chú</FieldLabel>
                  <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={generateMutation.isPending || !context.trim()}>
                {generateMutation.isPending ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
                Sinh rows
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[780px]">
          <form onSubmit={handleSaveRows}>
            <DialogHeader>
              <DialogTitle>Edit rows JSON</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={rowsJson}
                onChange={(event) => setRowsJson(event.target.value)}
                className="min-h-[420px] font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveRowsMutation.isPending}>
                {saveRowsMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
                Lưu draft version
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={sheetSelectOpen} onOpenChange={setSheetSelectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chọn sheet dữ liệu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              File Excel của bạn chứa nhiều sheet. Vui lòng chọn sheet muốn nhập dữ liệu:
            </p>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSheetSelectOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleSheetConfirm} disabled={importMutation.isPending}>
              {importMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              Tiến hành nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DatasetJobProgressDialog
        open={jobOpen}
        onOpenChange={setJobOpen}
        datasetPublicId={datasetId}
        job={job}
        schemaColumns={columns}
        onComplete={handleJobComplete}
      />
    </div>
  )
}

function MetricCard({ label, value, isAlert }: { label: string; value: number | string; isAlert?: boolean }) {
  return (
    <Card className={`rounded-xl transition-all border ${
      isAlert
        ? 'bg-destructive/5 border-destructive/20 text-destructive shadow-sm animate-pulse'
        : 'bg-card border-muted/50'
    }`}>
      <CardContent className="p-5">
        <div className={`text-xs font-semibold ${isAlert ? 'text-destructive/80' : 'text-muted-foreground'}`}>{label}</div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}

function DatasetStatusBadge({ value }: { value: string }) {
  if (value === 'ACTIVE') {
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Active</Badge>
  }
  return <Badge variant="outline">{value}</Badge>
}

function VersionStatusBadge({ value }: { value: string }) {
  if (value === 'INVALID') {
    return <Badge variant="destructive">Invalid version</Badge>
  }
  if (value === 'VALID' || value === 'ACTIVE') {
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{value}</Badge>
  }
  return <Badge variant="outline">{value}</Badge>
}

function RowStatusBadge({ value }: { value: string }) {
  if (value === 'VALID') {
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Valid</Badge>
  }
  return <Badge variant="destructive">Invalid</Badge>
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
