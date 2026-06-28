import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PlayIcon, TablePropertiesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useDatasets } from '@/features/project/hooks/use-datasets'
import { useCreateTestRun } from '@/features/project/hooks/use-test-runs'
import type { TestRunResponse } from '@/types/test-run'

interface CreateTestRunDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectPublicId: string | undefined
  onCreated?: (run: TestRunResponse) => void
}

export function CreateTestRunDialog({
  open,
  onOpenChange,
  projectPublicId,
  onCreated,
}: CreateTestRunDialogProps) {
  const [name, setName] = useState('')
  const [datasetPublicId, setDatasetPublicId] = useState('')
  const { data: datasetsData, isLoading: isDatasetsLoading } = useDatasets(projectPublicId)
  const createRun = useCreateTestRun(projectPublicId)

  const runnableDatasets = useMemo(
    () =>
      (datasetsData?.content ?? []).filter(
        (dataset) => dataset.status === 'ACTIVE' && Boolean(dataset.activeVersion),
      ),
    [datasetsData?.content],
  )

  useEffect(() => {
    if (open && !datasetPublicId && runnableDatasets.length > 0) {
      setDatasetPublicId(runnableDatasets[0].publicId)
    }
  }, [datasetPublicId, open, runnableDatasets])

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    createRun.mutate(
      {
        name: name.trim() || null,
        datasetPublicId: datasetPublicId || null,
      },
      {
        onSuccess: (run) => {
          setName('')
          onOpenChange(false)
          onCreated?.(run)
        },
      },
    )
  }

  const hasRunnableDataset = runnableDatasets.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo test run</DialogTitle>
            <DialogDescription>Chọn dataset active để queue run qua backend runner.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Tên run</FieldLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="vd. Smoke run API chính"
              />
            </Field>

            <Field>
              <FieldLabel>Dataset</FieldLabel>
              {hasRunnableDataset ? (
                <Select value={datasetPublicId} onValueChange={setDatasetPublicId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {runnableDatasets.map((dataset) => (
                      <SelectItem key={dataset.publicId} value={dataset.publicId}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Chưa có dataset active. Tạo hoặc active dataset trước khi chạy test.
                </div>
              )}
            </Field>
          </div>

          <DialogFooter>
            {!hasRunnableDataset && projectPublicId ? (
              <Button asChild type="button" variant="outline">
                <Link to={`/projects/${projectPublicId}/datasets`}>
                  <TablePropertiesIcon data-icon="inline-start" />
                  Mở Datasets
                </Link>
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={!projectPublicId || !hasRunnableDataset || !datasetPublicId || createRun.isPending}
            >
              {createRun.isPending || isDatasetsLoading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              Chạy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
