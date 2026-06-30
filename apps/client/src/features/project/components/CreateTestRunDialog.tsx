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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useDatasets } from '@/features/project/hooks/use-datasets'
import { useCreateTestRun } from '@/features/project/hooks/use-test-runs'
import { useCompareConfigs } from '@/features/project/hooks/use-ai-config'
import type { TestRunResponse } from '@/types/test-run'
import { Switch } from '@/components/ui/switch'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [isComparison, setIsComparison] = useState(false)
  const [selectedCompareConfigs, setSelectedCompareConfigs] = useState<string[]>([])
  const [comparePromptTemplate, setComparePromptTemplate] = useState('')
  const { data: datasetsData, isLoading: isDatasetsLoading } = useDatasets(projectPublicId)
  const { data: compareConfigs } = useCompareConfigs(projectPublicId)
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
        isComparison,
        compareAiConfigPublicIds: isComparison ? selectedCompareConfigs : null,
        comparePromptTemplate: isComparison ? comparePromptTemplate : null,
      },
      {
        onSuccess: (run) => {
          setName('')
          setIsComparison(false)
          setSelectedCompareConfigs([])
          setComparePromptTemplate('')
          onOpenChange(false)
          onCreated?.(run)
        },
      },
    )
  }

  const toggleCompareConfig = (id: string) => {
    setSelectedCompareConfigs(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
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

            {compareConfigs && compareConfigs.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/10">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none group"
                  onClick={() => setIsComparison(!isComparison)}
                >
                  <div className="space-y-0.5">
                    <FieldLabel className="text-base cursor-pointer group-hover:text-primary transition-colors">So sánh LLM (A/B Testing)</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Chạy song song dataset này với các mô hình AI khác để so sánh kết quả.
                    </p>
                  </div>
                  <Switch
                    className="pointer-events-none"
                    checked={isComparison}
                    onCheckedChange={setIsComparison}
                  />
                </div>
                
                {isComparison && (
                  <div className="flex flex-col gap-4 pt-4 border-t">
                    <Field>
                      <FieldLabel className="text-sm font-medium">Prompt cho LLM so sánh</FieldLabel>
                      <Textarea
                        value={comparePromptTemplate}
                        onChange={(e) => setComparePromptTemplate(e.target.value)}
                        placeholder="vd: Bạn là một trợ lý AI. Hãy trả lời câu hỏi sau: {{question}}"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Sử dụng {'{{variable}}'} để map với các cột trong dataset.</p>
                    </Field>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Chọn các mô hình để so sánh (tối đa 3):</p>
                    <div className="grid grid-cols-1 gap-2">
                      {compareConfigs.map(config => {
                        const isSelected = selectedCompareConfigs.includes(config.publicId)
                        return (
                          <div 
                            key={config.publicId}
                            onClick={() => toggleCompareConfig(config.publicId)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors",
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium leading-none mb-1">{config.name}</p>
                              <p className="text-xs text-muted-foreground">{config.provider} - {config.evaluationModel}</p>
                            </div>
                            <div className={cn(
                              "size-4 rounded-full border flex items-center justify-center [&>svg]:size-3",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                            )}>
                              {isSelected && <Check />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  </div>
                )}
              </div>
            )}
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
