import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DatabaseIcon, FileSpreadsheetIcon, PlusIcon } from 'lucide-react'

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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDataset, useDatasets } from '../../hooks/use-datasets'

export function DatasetListPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { data, isLoading } = useDatasets(publicId)
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Quản lý dữ liệu test để import từ Excel, sinh bằng AI và xuất lại cho QC kiểm tra.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Tạo dataset
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="h-40 animate-pulse rounded-lg" />
          <Card className="h-40 animate-pulse rounded-lg" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="rounded-lg border bg-card p-10">
          <Empty>
            <EmptyHeader>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
                <DatabaseIcon className="size-6 text-muted-foreground" />
              </div>
              <EmptyTitle>Chưa có dataset</EmptyTitle>
              <EmptyDescription>Tạo dataset rồi import Excel hoặc dùng AI generate test rows.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {datasets.map((dataset) => (
            <Link key={dataset.publicId} to={`/projects/${publicId}/datasets/${dataset.publicId}`}>
              <Card className="h-full rounded-lg transition-colors hover:border-primary/40">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileSpreadsheetIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{dataset.name}</CardTitle>
                        <CardDescription className="truncate">
                          {dataset.description ?? 'Không có mô tả'}
                        </CardDescription>
                      </div>
                    </div>
                    <StatusBadge value={dataset.status} />
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3 text-sm">
                  <Metric label="Rows" value={dataset.latestVersion?.totalRows ?? 0} />
                  <Metric label="Invalid" value={dataset.latestVersion?.invalidRows ?? 0} />
                  <Metric label="Version" value={dataset.latestVersion?.versionNumber ?? '-'} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function StatusBadge({ value }: { value: string }) {
  if (value === 'ACTIVE') {
    return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Active</Badge>
  }
  return <Badge variant="outline">{value}</Badge>
}
