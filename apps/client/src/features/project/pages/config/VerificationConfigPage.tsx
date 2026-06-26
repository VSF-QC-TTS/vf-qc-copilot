import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronDown,
  Info,
  SaveIcon,
  ShieldCheckIcon,
  ListChecksIcon,
  BrainCircuitIcon,
  CombineIcon,
} from 'lucide-react'

import type { VerificationMode, CheckOperator, ExpectedSource, OperatorCatalogResponse } from '@/types/config'
import { useVerificationConfig, useSaveVerificationConfig, useResponseFields, useOperatorCatalog } from '../../hooks/use-verification-config'
import { useDatasetSchema } from '../../hooks/use-dataset-schema'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { VerificationSkeleton } from '../../components/VerificationSkeleton'
import { FieldCheckDialog, type FieldCheckFormData } from '../../components/FieldCheckDialog'

// ---------------------------------------------------------------------------
// Mode metadata
// ---------------------------------------------------------------------------
const MODE_META: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  FIELD_CHECKS: {
    icon: ListChecksIcon,
    label: 'So khớp trường dữ liệu',
    description: 'So khớp từng trường dữ liệu giữa response API và dataset theo toán tử.',
  },
  OVERALL_RUBRIC: {
    icon: BrainCircuitIcon,
    label: 'LLM Judge chấm điểm',
    description: 'AI đánh giá tổng thể dựa trên tiêu chí rubric do bạn định nghĩa.',
  },
  RULE_AND_LLM: {
    icon: CombineIcon,
    label: 'Kết hợp (Rule + LLM)',
    description: 'Kết hợp cả so khớp trường dữ liệu và LLM Judge.',
  },
}

const FALLBACK_OPERATORS = [
  { value: 'EQUALS', label: 'Equals (Exact Match)' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'ICONTAINS', label: 'Contains (Case-insensitive)' },
  { value: 'NOT_CONTAINS', label: 'Not Contains' },
  { value: 'CONTAINS_ALL', label: 'Contains All' },
  { value: 'CONTAINS_ANY', label: 'Contains Any' },
  { value: 'STARTS_WITH', label: 'Starts With' },
  { value: 'REGEX', label: 'Regex Match' },
  { value: 'NOT_EMPTY', label: 'Not Empty' },
  { value: 'IS_JSON', label: 'Valid JSON' },
  { value: 'JAVASCRIPT', label: 'JavaScript Expression' },
  { value: 'LLM_JUDGE', label: 'LLM Judge' },
]

export function VerificationConfigPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: config, isLoading } = useVerificationConfig(publicId)
  const { data: schemaData } = useDatasetSchema(publicId)
  const { data: responseFields } = useResponseFields(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const expectedColumns = schemaData?.columns.filter(c => c.role === 'EXPECTED_OUTPUT') || []

  const operatorOptions = operatorCatalog
    ? operatorCatalog.map((op: OperatorCatalogResponse) => ({ value: op.operator, label: op.displayName }))
    : FALLBACK_OPERATORS

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const schema = z.object({
    mode: z.enum(['FIELD_CHECKS', 'OVERALL_RUBRIC', 'RULE_AND_LLM']),
    fieldChecks: z.array(z.object({
      publicId: z.string().nullable().optional(),
      responsePath: z.string().min(1),
      operator: z.string(),
      expectedSource: z.string(),
      expectedColumn: z.string().nullable().optional(),
      expectedValue: z.string().nullable().optional(),
      threshold: z.coerce.number().min(0).max(1).nullable().optional(),
      weight: z.coerce.number().min(0),
      enabled: z.boolean(),
      displayOrder: z.number(),
    })).optional(),
    llmRubrics: z.array(z.object({
      publicId: z.string().nullable().optional(),
      name: z.string().min(1),
      targetPath: z.string().nullable().optional(),
      rubric: z.string().min(1),
      threshold: z.coerce.number().min(0).max(1),
      weight: z.coerce.number().min(0),
      enabled: z.boolean(),
      displayOrder: z.number(),
    })).optional(),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { mode: 'FIELD_CHECKS', fieldChecks: [], llmRubrics: [] },
  })

  const { control, handleSubmit, reset, watch } = form
  const fieldChecksArray = useFieldArray({ control, name: 'fieldChecks' })
  const llmRubricsArray = useFieldArray({ control, name: 'llmRubrics' })
  const mode = watch('mode')

  useEffect(() => {
    if (config) {
      reset({
        mode: config.mode,
        fieldChecks: config.fieldChecks.map(fc => ({
          ...fc,
          expectedColumn: fc.expectedColumn || null,
          expectedValue: fc.expectedValue || null,
          threshold: fc.threshold || null,
        })),
        llmRubrics: config.llmRubrics.map(lr => ({ ...lr, targetPath: lr.targetPath || null })),
      })
    }
  }, [config, reset])

  const onSubmit = (values: FormData) => {
    saveMutation.mutate({
      mode: values.mode as VerificationMode,
      fieldChecks: values.fieldChecks?.map(fc => ({
        ...fc,
        operator: fc.operator as CheckOperator,
        expectedSource: fc.expectedSource as ExpectedSource,
      })) as any,
      llmRubrics: values.llmRubrics as any,
    })
  }

  // ---------------------------------------------------------------------------
  // Field Check Dialog state
  // ---------------------------------------------------------------------------
  const [checkDialogOpen, setCheckDialogOpen] = useState(false)
  const [editingCheckIndex, setEditingCheckIndex] = useState<number | null>(null)

  const handleAddCheck = (data: FieldCheckFormData) => {
    if (editingCheckIndex !== null) {
      // Update existing
      const existing = fieldChecksArray.fields[editingCheckIndex]
      fieldChecksArray.update(editingCheckIndex, {
        ...existing,
        ...data,
        displayOrder: editingCheckIndex,
      })
    } else {
      // Append new
      fieldChecksArray.append({
        publicId: null,
        ...data,
        enabled: true,
        displayOrder: fieldChecksArray.fields.length,
      })
    }
    setEditingCheckIndex(null)
  }

  const handleEditCheck = (index: number) => {
    setEditingCheckIndex(index)
    setCheckDialogOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Rubric expand state
  // ---------------------------------------------------------------------------
  const [expandedRubric, setExpandedRubric] = useState<number | null>(null)

  if (isLoading) return <VerificationSkeleton />

  const modeMeta = MODE_META[mode] || MODE_META.FIELD_CHECKS
  const showFieldChecks = mode === 'FIELD_CHECKS' || mode === 'RULE_AND_LLM'
  const showRubrics = mode === 'OVERALL_RUBRIC' || mode === 'RULE_AND_LLM'

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.verification.title" descriptionKey="config.verification.description" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheckIcon className="size-5" />
                Cấu hình kiểm tra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="space-y-6">
                {/* Mode Selector */}
                <Controller control={control} name="mode" render={({ field }) => (
                  <Field>
                    <FieldLabel>Chế độ kiểm tra</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[320px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(MODE_META).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            <span className="flex items-center gap-2">
                              <meta.icon className="size-4 text-muted-foreground" />
                              {meta.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">{modeMeta.description}</p>
                  </Field>
                )} />

                <Separator />

                {/* ============================================= */}
                {/* FIELD CHECKS SECTION                          */}
                {/* ============================================= */}
                {showFieldChecks && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">Quy tắc so khớp</h3>
                        <p className="text-xs text-muted-foreground">Mỗi quy tắc so sánh 1 trường response với giá trị kỳ vọng</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingCheckIndex(null); setCheckDialogOpen(true) }}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Thêm quy tắc
                      </Button>
                    </div>

                    {fieldChecksArray.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-lg">
                        <ListChecksIcon className="size-5 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Chưa có quy tắc nào</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Ấn "Thêm quy tắc" để bắt đầu</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Response Field</TableHead>
                              <TableHead className="w-[130px]">Toán tử</TableHead>
                              <TableHead>Kỳ vọng</TableHead>
                              <TableHead className="w-[70px] text-center">Trọng số</TableHead>
                              <TableHead className="w-[60px] text-center">Bật</TableHead>
                              <TableHead className="w-[70px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fieldChecksArray.fields.map((item, index) => {
                              const check = watch(`fieldChecks.${index}`)
                              const opLabel = operatorOptions.find((o: any) => o.value === check?.operator)?.label ?? check?.operator
                              const expectedLabel = check?.expectedSource === 'DATASET_COLUMN'
                                ? check?.expectedColumn
                                : check?.expectedValue || '—'

                              return (
                                <TableRow key={item.id} className="group">
                                  <TableCell>
                                    <span className="font-mono text-xs">{check?.responsePath}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{opLabel}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      {check?.expectedSource === 'DATASET_COLUMN' && (
                                        <Badge variant="secondary" className="text-[10px]">Dataset</Badge>
                                      )}
                                      <span className="text-sm font-mono">{expectedLabel}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Controller control={control} name={`fieldChecks.${index}.weight`} render={({ field }) => (
                                      <Input type="number" step="0.1" min="0" className="h-7 w-14 text-center text-xs mx-auto" {...field} />
                                    )} />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Controller control={control} name={`fieldChecks.${index}.enabled`} render={({ field }) => (
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    )} />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => handleEditCheck(index)}>
                                        <PencilIcon className="size-3.5" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => fieldChecksArray.remove(index)}>
                                        <TrashIcon className="size-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {showFieldChecks && showRubrics && <Separator />}

                {/* ============================================= */}
                {/* LLM RUBRICS SECTION                           */}
                {/* ============================================= */}
                {showRubrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">Tiêu chí LLM Judge</h3>
                        <p className="text-xs text-muted-foreground">AI chấm điểm response dựa trên rubric do bạn viết</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => llmRubricsArray.append({
                          publicId: null,
                          name: '',
                          targetPath: null,
                          rubric: '',
                          threshold: 0.8,
                          weight: 1.0,
                          enabled: true,
                          displayOrder: llmRubricsArray.fields.length,
                        })}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Thêm tiêu chí
                      </Button>
                    </div>

                    {llmRubricsArray.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-lg">
                        <BrainCircuitIcon className="size-5 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Chưa có tiêu chí nào</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Ấn "Thêm tiêu chí" để tạo rubric mới</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {llmRubricsArray.fields.map((item, index) => {
                          const isExpanded = expandedRubric === index
                          return (
                            <Collapsible key={item.id} open={isExpanded} onOpenChange={(open) => setExpandedRubric(open ? index : null)}>
                              <div className="border rounded-lg overflow-hidden">
                                {/* Collapsed header */}
                                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                                  <CollapsibleTrigger asChild>
                                    <button type="button" className="flex items-center gap-2 flex-1 text-left">
                                      <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                      <Controller control={control} name={`llmRubrics.${index}.name`} render={({ field }) => (
                                        <span className="text-sm font-medium">{field.value || `Tiêu chí ${index + 1}`}</span>
                                      )} />
                                    </button>
                                  </CollapsibleTrigger>
                                  <div className="flex items-center gap-3">
                                    <Controller control={control} name={`llmRubrics.${index}.threshold`} render={({ field }) => (
                                      <span className="text-xs text-muted-foreground">≥ {field.value}</span>
                                    )} />
                                    <Controller control={control} name={`llmRubrics.${index}.weight`} render={({ field }) => (
                                      <Badge variant="outline" className="text-[10px]">w: {field.value}</Badge>
                                    )} />
                                    <Controller control={control} name={`llmRubrics.${index}.enabled`} render={({ field }) => (
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => llmRubricsArray.remove(index)}>
                                      <TrashIcon className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded content */}
                                <CollapsibleContent>
                                  <div className="px-4 py-4 space-y-4 border-t">
                                    <div className="grid grid-cols-2 gap-4">
                                      <Controller control={control} name={`llmRubrics.${index}.name`} render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                          <FieldLabel>Tên tiêu chí</FieldLabel>
                                          <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. Accuracy" />
                                          <FieldError errors={[fieldState.error]} />
                                        </Field>
                                      )} />
                                      <Controller control={control} name={`llmRubrics.${index}.targetPath`} render={({ field }) => (
                                        <Field>
                                          <FieldLabel className="flex items-center gap-1.5">
                                            Target Path
                                            <Tooltip>
                                              <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground" /></TooltipTrigger>
                                              <TooltipContent><p className="max-w-xs">Đường dẫn trỏ tới trường dữ liệu bạn muốn AI chấm. Ví dụ: $.data.answer</p></TooltipContent>
                                            </Tooltip>
                                          </FieldLabel>
                                          <Input {...field} value={field.value || ''} placeholder="$.data.answer" />
                                        </Field>
                                      )} />
                                    </div>
                                    <Controller control={control} name={`llmRubrics.${index}.rubric`} render={({ field, fieldState }) => (
                                      <Field data-invalid={!!fieldState.error}>
                                        <FieldLabel>Rubric Prompt</FieldLabel>
                                        <Textarea {...field} className="min-h-[80px]" aria-invalid={!!fieldState.error} placeholder="Mô tả tiêu chí đánh giá cho AI..." />
                                        <FieldError errors={[fieldState.error]} />
                                      </Field>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                      <Controller control={control} name={`llmRubrics.${index}.threshold`} render={({ field, fieldState }) => (
                                        <Field data-invalid={!!fieldState.error}>
                                          <FieldLabel className="flex items-center gap-1.5">
                                            Ngưỡng Pass
                                            <Tooltip>
                                              <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground" /></TooltipTrigger>
                                              <TooltipContent><p className="max-w-xs">Pass khi điểm ≥ ngưỡng. Ví dụ: 0.8</p></TooltipContent>
                                            </Tooltip>
                                          </FieldLabel>
                                          <Input type="number" step="0.1" min="0" max="1" {...field} />
                                          <FieldError errors={[fieldState.error]} />
                                        </Field>
                                      )} />
                                      <Controller control={control} name={`llmRubrics.${index}.weight`} render={({ field }) => (
                                        <Field>
                                          <FieldLabel className="flex items-center gap-1.5">
                                            Trọng số
                                            <Tooltip>
                                              <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground" /></TooltipTrigger>
                                              <TooltipContent><p className="max-w-xs">Độ quan trọng của tiêu chí này khi tính điểm tổng.</p></TooltipContent>
                                            </Tooltip>
                                          </FieldLabel>
                                          <Input type="number" step="0.1" min="0" {...field} />
                                        </Field>
                                      )} />
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-2 border-t">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                    Lưu cấu hình
                  </Button>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>

        {/* Field Check Dialog */}
        <FieldCheckDialog
          open={checkDialogOpen}
          onOpenChange={(open) => { setCheckDialogOpen(open); if (!open) setEditingCheckIndex(null) }}
          responseFields={responseFields ?? []}
          expectedColumns={expectedColumns}
          operatorOptions={operatorOptions}
          editingCheck={editingCheckIndex !== null ? (() => {
            const c = fieldChecksArray.fields[editingCheckIndex]
            return c ? {
              responsePath: c.responsePath,
              operator: c.operator,
              expectedSource: (c.expectedSource as 'DATASET_COLUMN' | 'STATIC_VALUE') || 'DATASET_COLUMN',
              expectedColumn: c.expectedColumn ?? null,
              expectedValue: c.expectedValue ?? null,
              threshold: c.threshold ?? null,
              weight: c.weight,
            } : null
          })() : null}
          onSubmit={handleAddCheck}
        />
      </motion.div>
    </TooltipProvider>
  )
}
