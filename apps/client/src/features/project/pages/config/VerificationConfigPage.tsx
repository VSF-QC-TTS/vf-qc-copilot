import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
  CheckIcon,
  XIcon,
  CopyIcon
} from 'lucide-react'

import type { VerificationMode, CheckOperator, ExpectedSource, OperatorCatalogResponse } from '@/types/config'
import { useVerificationConfig, useSaveVerificationConfig, useResponseFields, useOperatorCatalog } from '../../hooks/use-verification-config'
import { useProjectSchema } from '../../hooks/use-project-schema'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { VerificationSkeleton } from '../../components/VerificationSkeleton'

// ---------------------------------------------------------------------------
// Mode metadata
// ---------------------------------------------------------------------------
const MODE_META: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  FIELD_CHECKS_ONLY: {
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
  const { data: schemaData } = useProjectSchema(publicId)
  const { data: responseFields } = useResponseFields(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const expectedColumns = schemaData?.columns || []

  const operatorOptions = operatorCatalog
    ? operatorCatalog.map((op: OperatorCatalogResponse) => ({ value: op.operator, label: op.displayName }))
    : FALLBACK_OPERATORS

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const schema = z.object({
    mode: z.enum(['FIELD_CHECKS_ONLY', 'OVERALL_RUBRIC', 'RULE_AND_LLM']),
    fieldChecks: z.array(z.object({
      publicId: z.string().nullable().optional(),
      responsePath: z.string().min(1),
      operator: z.string(),
      expectedSource: z.string(),
      expectedColumnKey: z.string().nullable().optional(),
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
    defaultValues: { mode: 'FIELD_CHECKS_ONLY', fieldChecks: [], llmRubrics: [] },
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
          expectedColumnKey: fc.expectedColumnKey || null,
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
  // Field Check Inline Edit state
  // ---------------------------------------------------------------------------
  const [editingCheckIndex, setEditingCheckIndex] = useState<number | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingSnapshot, setEditingSnapshot] = useState<any>(null)

  const handleAddCheckRow = () => {
    if (editingCheckIndex !== null) return // Prevent multiple edits
    const newIndex = fieldChecksArray.fields.length
    fieldChecksArray.append({
      publicId: null,
      responsePath: '',
      operator: 'EQUALS',
      expectedSource: 'DATASET_COLUMN',
      expectedColumnKey: null,
      expectedValue: null,
      threshold: 1.0,
      weight: 1.0,
      enabled: true,
      displayOrder: newIndex,
    } as any)
    setEditingCheckIndex(newIndex)
    setIsAddingNew(true)
    setEditingSnapshot(null)
  }

  const handleDuplicateCheckRow = (index: number) => {
    if (editingCheckIndex !== null) return // Prevent duplicate while editing
    const current = fieldChecksArray.fields[index] as any
    fieldChecksArray.append({
      ...current,
      publicId: null, // Reset ID for new row
      displayOrder: fieldChecksArray.fields.length,
    })
  }

  const handleEditCheckRow = (index: number) => {
    if (editingCheckIndex !== null) return
    setEditingSnapshot(fieldChecksArray.fields[index])
    setEditingCheckIndex(index)
    setIsAddingNew(false)
  }

  const handleCancelEditRow = (index: number) => {
    if (isAddingNew) {
      fieldChecksArray.remove(index)
    } else if (editingSnapshot) {
      fieldChecksArray.update(index, editingSnapshot)
    }
    setEditingCheckIndex(null)
    setIsAddingNew(false)
    setEditingSnapshot(null)
  }

  const handleSaveEditRow = (index: number) => {
    // Check required fields before saving
    const current = watch(`fieldChecks.${index}`)
    if (!current?.responsePath || !current?.operator) {
      toast.error('Vui lòng chọn Response Field và Toán tử')
      return
    }
    if (current?.expectedSource === 'DATASET_COLUMN' && !current?.expectedColumnKey) {
      toast.error('Vui lòng chọn Cột Dataset kỳ vọng')
      return
    }
    if (current?.expectedSource === 'LITERAL' && !current?.expectedValue) {
      toast.error('Vui lòng nhập Giá trị kỳ vọng')
      return
    }

    setEditingCheckIndex(null)
    setIsAddingNew(false)
    setEditingSnapshot(null)
  }

  // ---------------------------------------------------------------------------
  // Rubric expand state
  // ---------------------------------------------------------------------------
  const [expandedRubric, setExpandedRubric] = useState<number | null>(null)

  if (isLoading) return <VerificationSkeleton />

  const modeMeta = MODE_META[mode] || MODE_META.FIELD_CHECKS_ONLY
  const showFieldChecks = mode === 'FIELD_CHECKS_ONLY' || mode === 'RULE_AND_LLM'
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
                <ShieldCheckIcon />
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
                              <meta.icon className="text-muted-foreground" />
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
                        onClick={handleAddCheckRow}
                        disabled={editingCheckIndex !== null}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Thêm quy tắc
                      </Button>
                    </div>

                    {fieldChecksArray.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-lg">
                        <ListChecksIcon className="text-muted-foreground/40 mb-2" />
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
                            <AnimatePresence mode="popLayout" initial={false}>
                              {fieldChecksArray.fields.map((item, index) => {
                                const check = watch(`fieldChecks.${index}`)
                                const opLabel = operatorOptions.find((o: any) => o.value === check?.operator)?.label ?? check?.operator
                                const expectedLabel = check?.expectedSource === 'DATASET_COLUMN'
                                  ? expectedColumns.find(c => c.publicId === check?.expectedColumnKey)?.columnName || check?.expectedColumnKey
                                  : check?.expectedValue || '—'

                                const isEditing = editingCheckIndex === index

                                return (
                                  <motion.tr
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                    animate={{ opacity: 1, y: 0, backgroundColor: isEditing ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0)' }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.2 }}
                                    className="group h-12 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                  >
                                    {isEditing ? (
                                    <>
                                      <TableCell className="p-2">
                                        <Controller control={control} name={`fieldChecks.${index}.responsePath`} render={({ field }) => (
                                          <Combobox
                                            options={(responseFields ?? []).map(f => ({ value: f, label: f }))}
                                            value={field.value || undefined}
                                            onChange={field.onChange}
                                            placeholder="Chọn field..."
                                            emptyText="Không tìm thấy field"
                                          />
                                        )} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <Controller control={control} name={`fieldChecks.${index}.operator`} render={({ field }) => (
                                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                                            <SelectTrigger className="h-8"><SelectValue placeholder="Toán tử" /></SelectTrigger>
                                            <SelectContent>
                                              {operatorOptions.map((op: any) => (
                                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <div className="flex items-center gap-2">
                                          {['NOT_EMPTY', 'IS_JSON'].includes(check?.operator || '') ? (
                                            <span className="text-xs italic text-muted-foreground ml-2">Không áp dụng</span>
                                          ) : (
                                            <>
                                              <Controller control={control} name={`fieldChecks.${index}.expectedSource`} render={({ field }) => (
                                                <Select value={field.value} onValueChange={(val) => {
                                                  field.onChange(val)
                                                  form.setValue(`fieldChecks.${index}.expectedColumnKey`, null)
                                                  form.setValue(`fieldChecks.${index}.expectedValue`, null)
                                                }}>
                                                  <SelectTrigger className="h-8 w-[100px] shrink-0"><SelectValue /></SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="DATASET_COLUMN">Dataset</SelectItem>
                                                    <SelectItem value="LITERAL">Static</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              )} />
                                              {check?.expectedSource === 'DATASET_COLUMN' ? (
                                                <Controller control={control} name={`fieldChecks.${index}.expectedColumnKey`} render={({ field }) => (
                                                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Chọn cột..." /></SelectTrigger>
                                                    <SelectContent>
                                                      {expectedColumns.map(col => (
                                                        <SelectItem key={col.publicId} value={col.publicId}>
                                                          {col.columnName}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                )} />
                                              ) : (
                                                <Controller control={control} name={`fieldChecks.${index}.expectedValue`} render={({ field }) => (
                                                  <Input {...field} value={field.value || ''} placeholder="Giá trị..." className="h-8" />
                                                )} />
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        <Controller control={control} name={`fieldChecks.${index}.weight`} render={({ field }) => (
                                          <Input type="number" step="0.1" min="0" className="h-8 w-14 text-center text-xs mx-auto" {...field} />
                                        )} />
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        <Controller control={control} name={`fieldChecks.${index}.enabled`} render={({ field }) => (
                                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        )} />
                                      </TableCell>
                                      <TableCell className="p-2">
                                        <div className="flex justify-end gap-1">
                                          <Button type="button" variant="ghost" size="icon" className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleSaveEditRow(index)}>
                                            <CheckIcon />
                                          </Button>
                                          <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancelEditRow(index)}>
                                            <XIcon />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </>
                                  ) : (
                                    <>
                                      <TableCell>
                                        <span className="font-mono text-xs">{check?.responsePath}</span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">{opLabel}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1.5">
                                          {['NOT_EMPTY', 'IS_JSON'].includes(check?.operator || '') ? (
                                            <span className="text-xs text-muted-foreground">—</span>
                                          ) : check?.expectedSource === 'DATASET_COLUMN' ? (
                                            <>
                                              <Badge variant="secondary" className="text-[10px]">Dataset</Badge>
                                              <span className="text-sm font-mono">{expectedLabel}</span>
                                            </>
                                          ) : (
                                            <span className="text-sm font-mono">{expectedLabel}</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant="outline" className="text-[10px]">w: {check?.weight}</Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Controller control={control} name={`fieldChecks.${index}.enabled`} render={({ field }) => (
                                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={editingCheckIndex !== null} />
                                        )} />
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={editingCheckIndex !== null} onClick={() => handleEditCheckRow(index)}>
                                            <PencilIcon />
                                          </Button>
                                          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={editingCheckIndex !== null} onClick={() => handleDuplicateCheckRow(index)}>
                                            <CopyIcon />
                                          </Button>
                                          <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" disabled={editingCheckIndex !== null} onClick={() => fieldChecksArray.remove(index)}>
                                            <TrashIcon />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </>
                                  )}
                                  </motion.tr>
                                )
                              })}
                            </AnimatePresence>
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
                        <BrainCircuitIcon className="text-muted-foreground/40 mb-2" />
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
                                      <ChevronDown className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
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
                                      <TrashIcon />
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
                                          <Input {...field} aria-invalid={!!fieldState.error} placeholder="VD: Độ chính xác (Accuracy)" />
                                          <FieldError errors={[fieldState.error]} />
                                        </Field>
                                      )} />
                                      <Controller control={control} name={`llmRubrics.${index}.targetPath`} render={({ field }) => (
                                        <Field>
                                          <FieldLabel className="flex items-center gap-1.5">
                                            Target Path
                                            <Tooltip>
                                              <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                                              <TooltipContent><p className="max-w-xs">Đường dẫn trỏ tới trường dữ liệu bạn muốn AI chấm. Ví dụ: $.data.answer</p></TooltipContent>
                                            </Tooltip>
                                          </FieldLabel>
                                          <Combobox
                                            options={(responseFields ?? []).map(f => ({ value: f, label: f }))}
                                            value={field.value || undefined}
                                            onChange={field.onChange}
                                            placeholder="Chọn $.data.answer"
                                            emptyText="Không tìm thấy trường nào"
                                          />
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
                                              <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
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
                                              <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
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
      </motion.div>
    </TooltipProvider>
  )
}
