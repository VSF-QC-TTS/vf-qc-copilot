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
} from 'lucide-react'
import { toast } from 'sonner'

import { downloadDatasetVersionExcel } from '@/lib/dataset-api'
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

  const columns = schema?.columns ?? EMPTY_COLUMNS
  const rows = rowsQuery.data?.content ?? EMPTY_ROWS
  const displayColumns = useMemo(() => {
    if (columns.length > 0) {
      return columns.map((column) => column.columnName)
    }
    return Array.from(new Set(rows.flatMap((row) => Object.keys(row.data))))
  }, [columns, rows])

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
    importMutation.mutate(file, {
      onSuccess: (nextJob) => {
        setJob(nextJob)
        setJobOpen(true)
      },
    })
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
          <Button type="button" variant="outline" onClick={handleImportClick} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Spinner data-icon="inline-start" /> : <FileUpIcon data-icon="inline-start" />}
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

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total rows" value={dataset.latestVersion?.totalRows ?? 0} />
        <MetricCard label="Valid rows" value={dataset.latestVersion?.validRows ?? 0} />
        <MetricCard label="Invalid rows" value={dataset.latestVersion?.invalidRows ?? 0} />
        <MetricCard label="Versions" value={dataset.versions.length} />
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Dataset rows</CardTitle>
              <CardDescription>QC nhìn được từng field, trạng thái validation và lỗi của từng dòng.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="w-[180px]">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => activateMutation.mutate()}
                disabled={!selectedVersionId || activateMutation.isPending}
              >
                {activateMutation.isPending ? <Spinner data-icon="inline-start" /> : <CheckCircle2Icon data-icon="inline-start" />}
                Active version
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dataset.versions.length === 0 ? (
            <div className="p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Chưa có version dữ liệu</EmptyTitle>
                  <EmptyDescription>Import Excel hoặc AI generate để tạo version đầu tiên.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Version này chưa có row.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">#</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  {displayColumns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                  <TableHead className="min-w-[240px]">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.publicId}>
                    <TableCell>{row.rowIndex + 1}</TableCell>
                    <TableCell>
                      <RowStatusBadge value={row.validationStatus} />
                    </TableCell>
                    {displayColumns.map((column) => (
                      <TableCell key={column} className="max-w-[260px] truncate">
                        {formatCell(row.data[column])}
                      </TableCell>
                    ))}
                    <TableCell className="max-w-[360px] whitespace-normal text-xs text-destructive">
                      {row.validationErrors.map((error) => error.message).join(' ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dataset.latestVersion?.invalidRows ? (
        <Alert>
          <AlertTitle>Dataset còn lỗi validation</AlertTitle>
          <AlertDescription>Version có dòng invalid sẽ không được active. Mở từng row để sửa hoặc import/generate lại.</AlertDescription>
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

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
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
