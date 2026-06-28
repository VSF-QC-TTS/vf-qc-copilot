import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircleIcon, DatabaseIcon, FileSpreadsheetIcon, PlusIcon, TablePropertiesIcon, Target, AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDataset, useDatasets } from '../../hooks/use-datasets'
import { useSetupStatus } from '../../hooks/use-projects'
import { useProjectSchema } from '../../hooks/use-project-schema'

export function DatasetListPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { data, isLoading } = useDatasets(publicId)
  const { data: setupStatus } = useSetupStatus(publicId)
  const { data: schema } = useProjectSchema(publicId)
  const createMutation = useCreateDataset(publicId)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    createMutation.mutate(
      { name, description: description.trim() ? description : null },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setCreateOpen(false)
        },
      },
    )
  }

  const datasets = data?.content ?? []
  const hasProjectSchema = setupStatus?.hasProjectSchema ?? false
  const schemaColumns = schema?.columns ?? []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Quản lý dữ liệu test để import từ Excel, sinh bằng AI và xuất lại cho QC kiểm tra.
          </p>
        </div>
        {hasProjectSchema ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Tạo dataset
          </Button>
        ) : (
          <Button asChild type="button" variant="outline">
            <Link to={`/projects/${publicId}/config/schema`}>
              <TablePropertiesIcon data-icon="inline-start" />
              Cấu hình schema
            </Link>
          </Button>
        )}
      </div>

      {!hasProjectSchema ? (
        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Cần cấu hình dataset schema trước</AlertTitle>
          <AlertDescription>
            Dataset phải gắn với schema để import, sinh rows và validate từng cột. Tạo schema xong rồi quay lại tạo dataset.
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="h-44 animate-pulse rounded-xl border border-muted" />
          <Card className="h-44 animate-pulse rounded-xl border border-muted" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="rounded-xl border bg-card p-10">
          <Empty>
            <EmptyHeader>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                <DatabaseIcon className="size-6 text-muted-foreground" />
              </div>
              <EmptyTitle>Chưa có dataset</EmptyTitle>
              <EmptyDescription>
                {hasProjectSchema
                  ? 'Tạo dataset rồi import Excel hoặc dùng AI generate test rows.'
                  : 'Cấu hình dataset schema trước để tạo dataset.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((dataset) => {
            const total = dataset.latestVersion?.totalRows ?? 0
            const invalid = dataset.latestVersion?.invalidRows ?? 0
            const cleanliness = total > 0 ? Math.round(((total - invalid) / total) * 100) : 100

            return (
              <Link key={dataset.publicId} to={`/projects/${publicId}/datasets/${dataset.publicId}`}>
                <Card className="group h-full rounded-xl border border-muted-foreground/10 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-primary/5">
                          <FileSpreadsheetIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
                            {dataset.name}
                          </CardTitle>
                          <CardDescription className="truncate text-xs text-muted-foreground">
                            {dataset.description ?? 'Không có mô tả'}
                          </CardDescription>
                        </div>
                      </div>
                      <StatusBadge value={dataset.status} />
                    </div>

                    {/* Columns Tags Preview */}
                    {schemaColumns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-muted/50 pt-3">
                        {schemaColumns.map((col) => {
                          const isEvaluated = col.role?.toUpperCase() === 'EXPECTED' || col.role?.toUpperCase() === 'GROUND_TRUTH'
                          return (
                            <Badge
                              key={col.columnName}
                              variant="outline"
                              className={`h-5 text-[10px] font-mono px-2 py-0 border-muted-foreground/15 rounded-md ${
                                isEvaluated
                                  ? 'bg-primary/5 text-primary border-primary/20'
                                  : 'bg-muted/30 text-muted-foreground'
                              }`}
                            >
                              {isEvaluated && <Target className="mr-1 size-2.5" />}
                              {col.columnName}
                            </Badge>
                          )
                        })}
                      </div>
                    )}

                    {/* Bento Metrics Section */}
                    <div className="grid grid-cols-3 gap-2 border-t border-muted/50 pt-3 text-sm">
                      <div className="rounded-lg bg-muted/30 px-3 py-2 border border-muted/30 transition-colors group-hover:bg-muted/40">
                        <div className="text-[11px] font-medium text-muted-foreground">Tổng số testcase</div>
                        <div className="mt-1 text-lg font-bold text-card-foreground">{total}</div>
                      </div>

                      <div className="rounded-lg bg-muted/30 px-3 py-2 border border-muted/30 transition-colors group-hover:bg-muted/40">
                        <div className="text-[11px] font-medium text-muted-foreground">Độ sạch dữ liệu</div>
                        <div className="mt-1 text-lg font-bold text-card-foreground">
                          {total > 0 ? `${cleanliness}%` : '-'}
                        </div>
                      </div>

                      <div className={`rounded-lg px-3 py-2 border transition-colors ${
                        invalid > 0
                          ? 'bg-destructive/5 border-destructive/20 text-destructive'
                          : 'bg-muted/30 border-muted/30 text-muted-foreground group-hover:bg-muted/40'
                      }`}>
                        <div className="text-[11px] font-medium opacity-80">Số dòng lỗi</div>
                        <div className={`mt-1 text-lg font-bold flex items-center gap-1 ${invalid > 0 ? 'text-destructive' : 'text-card-foreground'}`}>
                          {invalid > 0 && <AlertTriangle className="size-4 shrink-0 text-destructive animate-pulse" />}
                          {invalid}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Phiên bản active: {dataset.latestVersion ? `v${dataset.latestVersion.versionNumber}` : '-'}</span>
                      {dataset.latestVersion?.createdAt && (
                        <span>Cập nhật: {new Date(dataset.latestVersion.createdAt).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen && hasProjectSchema} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Tạo dataset</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>Tên dataset</FieldLabel>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Mô tả</FieldLabel>
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                {createMutation.isPending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                Tạo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ value }: { value: string }) {
  if (value === 'ACTIVE') {
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Active</Badge>
  }
  return <Badge variant="outline">{value}</Badge>
}

