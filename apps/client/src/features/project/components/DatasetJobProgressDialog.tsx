import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, CircleX, FileSpreadsheet, Loader2, PauseCircle } from 'lucide-react'
import { toast } from 'sonner'

import { cancelDatasetJob, streamDatasetJobEvents } from '@/lib/dataset-api'
import type { SchemaColumnResponse } from '@/types/config'
import type {
  DatasetColumnMappingAction,
  DatasetColumnMappingRequest,
  DatasetColumnMappingSuggestionResponse,
  DatasetJobEventResponse,
  DatasetJobResponse,
  DatasetJobStatus,
} from '@/types/dataset'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

import { useConfirmDatasetImport } from '../hooks/use-datasets'
import { JobProgressAnimation } from './JobProgressAnimation'

const DATASET_JOB_PHRASES = [
  'Đang đọc file và chuẩn hóa cột...',
  'Đối chiếu dữ liệu với schema...',
  'Kiểm tra lỗi từng dòng...',
  'Chuẩn bị version mới...',
  'Sắp hoàn tất...',
] as const

interface DatasetJobProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetPublicId: string | undefined
  job: DatasetJobResponse | null
  schemaColumns: readonly SchemaColumnResponse[]
  onComplete: (event: DatasetJobEventResponse) => void
}

export function DatasetJobProgressDialog({
  open,
  onOpenChange,
  datasetPublicId,
  job,
  schemaColumns,
  onComplete,
}: DatasetJobProgressDialogProps) {
  const [event, setEvent] = useState<DatasetJobEventResponse | null>(null)
  const [mappings, setMappings] = useState<DatasetColumnMappingRequest[]>([])
  const confirmMutation = useConfirmDatasetImport(datasetPublicId, event?.publicId)

  const currentStatus = event?.status ?? job?.status ?? 'QUEUED'
  const currentProgress = event?.progress ?? job?.progress ?? 0
  const isWaitingForMapping = currentStatus === 'NEEDS_CONFIRMATION'
  const isFinished = isTerminalStatus(currentStatus)

  const suggestions = useMemo(
    () => event?.mappingSuggestions ?? job?.mappingSuggestions ?? [],
    [event?.mappingSuggestions, job?.mappingSuggestions],
  )

  useEffect(() => {
    setEvent(job ? toInitialEvent(job) : null)
    setMappings([])
  }, [job])

  useEffect(() => {
    if (!open || !job) {
      return
    }

    const controller = new AbortController()
    void streamDatasetJobEvents(
      job.publicId,
      (nextEvent) => {
        setEvent(nextEvent)
        if (nextEvent.status === 'NEEDS_CONFIRMATION') {
          setMappings((current) => (current.length > 0 ? current : createDefaultMappings(nextEvent.mappingSuggestions)))
        }
        if (isTerminalStatus(nextEvent.status)) {
          onComplete(nextEvent)
        }
      },
      controller.signal,
    ).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      toast.error(error instanceof Error ? error.message : 'Không đọc được tiến trình job')
    })

    return () => controller.abort()
  }, [job, onComplete, open])

  function handleMappingActionChange(sourceColumn: string, action: DatasetColumnMappingAction): void {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.sourceColumn === sourceColumn
          ? {
              ...mapping,
              action,
              schemaColumnPublicId: action === 'MAP_TO_SCHEMA' ? mapping.schemaColumnPublicId : null,
            }
          : mapping,
      ),
    )
  }

  function handleTargetColumnChange(sourceColumn: string, schemaColumnPublicId: string): void {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.sourceColumn === sourceColumn
          ? { ...mapping, action: 'MAP_TO_SCHEMA', schemaColumnPublicId }
          : mapping,
      ),
    )
  }

  function handleNewColumnNameChange(sourceColumn: string, value: string): void {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.sourceColumn === sourceColumn ? { ...mapping, newColumnName: value } : mapping,
      ),
    )
  }

  function handleConfirm(): void {
    confirmMutation.mutate({ mappings })
  }

  async function handleCancel(): Promise<void> {
    if (!job || isFinished) {
      return
    }
    await cancelDatasetJob(job.publicId)
    toast.success('Đã gửi yêu cầu dừng job')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] overflow-hidden p-0 sm:max-w-[900px]">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="size-4" />
            Tiến trình dataset
          </DialogTitle>
          <DialogDescription>{event?.message ?? job?.message ?? 'Đang chuẩn bị job...'}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[420px] gap-0 bg-muted/20 md:grid-cols-[280px_1fr]">
          <aside className="border-b bg-background p-6 md:border-r md:border-b-0">
            <div className="flex flex-col gap-4">
              <StatusBadge status={currentStatus} />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>{currentStatus}</span>
                  <span>{currentProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${currentProgress}%` }} />
                </div>
              </div>
              {event?.errorMessage ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {event.errorMessage}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="flex min-h-[420px] flex-col justify-center overflow-auto bg-background">
            {isWaitingForMapping ? (
              <MappingConfirmation
                mappings={mappings}
                schemaColumns={schemaColumns}
                suggestions={suggestions}
                onActionChange={handleMappingActionChange}
                onTargetChange={handleTargetColumnChange}
                onNewNameChange={handleNewColumnNameChange}
              />
            ) : isFinished ? (
              <JobDoneView status={currentStatus} />
            ) : (
              <JobProgressAnimation phrases={DATASET_JOB_PHRASES} iconLabel="Dataset job progress" />
            )}
          </section>
        </div>

        <DialogFooter className="m-0 rounded-none">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isFinished || !job}>
            Dừng job
          </Button>
          {isWaitingForMapping ? (
            <Button type="button" onClick={handleConfirm} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              Xác nhận mapping
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={!isFinished}>
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MappingConfirmationProps {
  mappings: readonly DatasetColumnMappingRequest[]
  schemaColumns: readonly SchemaColumnResponse[]
  suggestions: readonly DatasetColumnMappingSuggestionResponse[]
  onActionChange: (sourceColumn: string, action: DatasetColumnMappingAction) => void
  onTargetChange: (sourceColumn: string, schemaColumnPublicId: string) => void
  onNewNameChange: (sourceColumn: string, value: string) => void
}

function MappingConfirmation({
  mappings,
  schemaColumns,
  suggestions,
  onActionChange,
  onTargetChange,
  onNewNameChange,
}: MappingConfirmationProps) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h3 className="text-sm font-semibold">Xác nhận mapping cột</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cột mới trong Excel cần được map vào schema, thêm thành cột mới hoặc bỏ qua.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cột Excel</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Đích</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping) => {
              const suggestion = suggestions.find((item) => item.sourceColumn === mapping.sourceColumn)
              return (
                <TableRow key={mapping.sourceColumn}>
                  <TableCell className="font-medium">{mapping.sourceColumn}</TableCell>
                  <TableCell>
                    <Select
                      value={mapping.action}
                      onValueChange={(value) => onActionChange(mapping.sourceColumn, value as DatasetColumnMappingAction)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAP_TO_SCHEMA">Map schema</SelectItem>
                        <SelectItem value="ADD_TO_SCHEMA">Thêm schema</SelectItem>
                        <SelectItem value="IGNORE">Bỏ qua</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {mapping.action === 'MAP_TO_SCHEMA' ? (
                      <Select
                        value={mapping.schemaColumnPublicId ?? ''}
                        onValueChange={(value) => onTargetChange(mapping.sourceColumn, value)}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Chọn cột schema" />
                        </SelectTrigger>
                        <SelectContent>
                          {schemaColumns.map((column) => (
                            <SelectItem key={column.publicId} value={column.publicId}>
                              {column.columnName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {mapping.action === 'ADD_TO_SCHEMA' ? (
                      <Input
                        value={mapping.newColumnName ?? suggestion?.targetColumn ?? mapping.sourceColumn}
                        onChange={(event) => onNewNameChange(mapping.sourceColumn, event.target.value)}
                        className="h-8 w-[220px]"
                      />
                    ) : null}
                    {mapping.action === 'IGNORE' ? <span className="text-sm text-muted-foreground">Không import cột này</span> : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: DatasetJobStatus }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="w-fit bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 data-icon="inline-start" />
        Hoàn tất
      </Badge>
    )
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="destructive" className="w-fit">
        <CircleX data-icon="inline-start" />
        Lỗi
      </Badge>
    )
  }
  if (status === 'NEEDS_CONFIRMATION') {
    return (
      <Badge className="w-fit bg-amber-500/10 text-amber-700 dark:text-amber-300">
        <PauseCircle data-icon="inline-start" />
        Cần xác nhận
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="w-fit">
      <Loader2 data-icon="inline-start" className="animate-spin" />
      Đang chạy
    </Badge>
  )
}

function JobDoneView({ status }: { status: DatasetJobStatus }) {
  const isSuccess = status === 'COMPLETED'
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-4 p-8 text-center">
      <div className={`flex size-14 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
        {isSuccess ? (
          <CheckCircle2 className="size-7 text-emerald-600" />
        ) : (
          <CircleAlert className="size-7 text-destructive" />
        )}
      </div>
      <div>
        <h3 className="text-base font-semibold">{isSuccess ? 'Job đã hoàn tất' : 'Job đã dừng hoặc lỗi'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuccess ? 'Dataset đã được cập nhật theo kết quả job.' : 'Kiểm tra thông báo lỗi ở panel bên trái.'}
        </p>
      </div>
    </div>
  )
}

function createDefaultMappings(
  suggestions: readonly DatasetColumnMappingSuggestionResponse[],
): DatasetColumnMappingRequest[] {
  return suggestions.map((suggestion) => ({
    sourceColumn: suggestion.sourceColumn,
    action: suggestion.newColumn ? 'ADD_TO_SCHEMA' : 'MAP_TO_SCHEMA',
    schemaColumnPublicId: suggestion.schemaColumnPublicId,
    newColumnName: suggestion.targetColumn,
    newColumnRole: 'EXPECTED',
    newColumnDataType: 'STRING',
  }))
}

function toInitialEvent(job: DatasetJobResponse): DatasetJobEventResponse {
  return {
    publicId: job.publicId,
    type: job.type,
    status: job.status,
    progress: job.progress,
    message: job.message,
    errorMessage: job.errorMessage,
    datasetPublicId: job.datasetPublicId,
    datasetVersionPublicId: job.datasetVersionPublicId,
    mappingSuggestions: job.mappingSuggestions,
  }
}

function isTerminalStatus(status: DatasetJobStatus): boolean {
  return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED'
}
