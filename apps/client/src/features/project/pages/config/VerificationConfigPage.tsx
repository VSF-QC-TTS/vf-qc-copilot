import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  SaveIcon,
  ListChecksIcon,
  BrainCircuitIcon,
  CombineIcon,
  CopyIcon,
  HelpCircleIcon
} from 'lucide-react'

import type { VerificationMode, CheckOperator, ExpectedSource, OperatorCatalogResponse } from '@/types/config'
import { useVerificationConfig, useSaveVerificationConfig, useResponseFields, useOperatorCatalog } from '../../hooks/use-verification-config'
import { useProjectSchema } from '../../hooks/use-project-schema'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
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
  // Form & Global Prompt State
  // ---------------------------------------------------------------------------
  const [globalPrompt, setGlobalPrompt] = useState<string>('')

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
      // Find overall rubric global prompt if it exists
      const globalItem = config.llmRubrics.find(lr => lr.name === '__global__')
      setGlobalPrompt(globalItem ? globalItem.rubric : 'Hãy chấm điểm câu trả lời của bot dựa trên các tiêu chí sau:\n\n[TIÊU CHÍ]\n{{criteria}}')

      // Filter out global item from form's active llmRubrics criteria keys list
      const criteriaList = config.llmRubrics
        .filter(lr => lr.name !== '__global__')
        .map(lr => ({ ...lr, targetPath: lr.targetPath || null }))

      reset({
        mode: config.mode,
        fieldChecks: config.fieldChecks.map(fc => ({
          ...fc,
          expectedColumnKey: fc.expectedColumnKey || null,
          expectedValue: fc.expectedValue || null,
          threshold: fc.threshold || null,
        })),
        llmRubrics: criteriaList,
      })
    }
  }, [config, reset])

  const onSubmit = (values: FormData) => {
    // Collect active criteria rubrics
    const finalRubrics = [...(values.llmRubrics || [])]

    // If mode is OVERALL_RUBRIC, save the global prompt rubric rule
    if (values.mode === 'OVERALL_RUBRIC') {
      finalRubrics.push({
        publicId: config?.llmRubrics.find(lr => lr.name === '__global__')?.publicId || null,
        name: '__global__',
        targetPath: null,
        rubric: globalPrompt || '',
        threshold: 0.8,
        weight: 1.0,
        enabled: true,
        displayOrder: 0,
      } as any)
    }

    saveMutation.mutate({
      mode: values.mode as VerificationMode,
      fieldChecks: values.fieldChecks?.map(fc => ({
        ...fc,
        operator: fc.operator as CheckOperator,
        expectedSource: fc.expectedSource as ExpectedSource,
      })) as any,
      llmRubrics: finalRubrics as any,
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

  if (isLoading) return <VerificationSkeleton />

  const showFieldChecks = mode === 'FIELD_CHECKS_ONLY' || mode === 'RULE_AND_LLM'
  const showRubrics = mode === 'OVERALL_RUBRIC'

  // Generate output schema JSON preview reactively based on active criteria names
  const activeCriteriaList = watch('llmRubrics') || []
  const schemaJson = activeCriteriaList.length > 0
    ? `{\n` +
      activeCriteriaList.map(c => `  "${c.name || 'key'}": {\n    "pass": boolean,\n    "reason": string\n  }`).join(',\n') +
      `,\n  "overall": {\n    "pass": boolean,\n    "reason": string\n  }\n}`
    : `{\n  "overall": {\n    "pass": boolean,\n    "reason": string\n  }\n}`

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 max-w-[1050px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.verification.title" descriptionKey="config.verification.description" />

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b pb-4 w-full">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full border shadow-sm select-none">
            {Object.entries(MODE_META).map(([value, meta]) => {
              const isActive = mode === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => form.setValue('mode', value as any)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <meta.icon className="size-3.5" />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            {/* LEFT COLUMN: Configuration Workspace */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* FIELD CHECKS SECTION (Per-field & Hybrid) */}
              {showFieldChecks && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Quy tắc so khớp</h3>
                      <p className="text-xs text-muted-foreground">Các quy tắc trích xuất và đối chiếu trường dữ liệu cụ thể</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg cursor-pointer"
                      onClick={handleAddCheckRow}
                      disabled={editingCheckIndex !== null}
                    >
                      <PlusIcon className="size-3.5 mr-1" />
                      Thêm quy tắc
                    </Button>
                  </div>

                  {fieldChecksArray.fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl bg-muted/5">
                      <ListChecksIcon className="text-muted-foreground/30 mb-2 size-8 animate-pulse" />
                      <p className="text-sm text-muted-foreground font-semibold">Chưa có quy tắc nào</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">Ấn "Thêm quy tắc" để bắt đầu thiết lập</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {fieldChecksArray.fields.map((item, index) => {
                        const check = watch(`fieldChecks.${index}`)
                        const expectedLabel = check?.expectedSource === 'DATASET_COLUMN'
                          ? expectedColumns.find(c => c.publicId === check?.expectedColumnKey)?.columnName || check?.expectedColumnKey
                          : check?.expectedValue || '—'

                        const isEditing = editingCheckIndex === index

                        return (
                          <div key={item.id} className="transition-all duration-200">
                            {isEditing ? (
                              <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/15 dark:bg-blue-950/10 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <Field>
                                    <FieldLabel className="text-xs font-semibold">Response Field JSONPath</FieldLabel>
                                    <Controller control={control} name={`fieldChecks.${index}.responsePath`} render={({ field }) => (
                                      <Combobox
                                        options={(responseFields ?? []).map(f => ({ value: f, label: f }))}
                                        value={field.value || undefined}
                                        onChange={field.onChange}
                                        placeholder="Chọn trường dữ liệu..."
                                        emptyText="Không tìm thấy trường nào"
                                      />
                                    )} />
                                  </Field>

                                  <Field>
                                    <FieldLabel className="text-xs font-semibold">Trọng số (Weight)</FieldLabel>
                                    <Controller control={control} name={`fieldChecks.${index}.weight`} render={({ field }) => (
                                      <Input type="number" step="0.1" min="0" className="h-9 rounded-lg" {...field} />
                                    )} />
                                  </Field>
                                </div>

                                <div className="space-y-2">
                                  <FieldLabel className="text-xs font-semibold">Phương thức Verify</FieldLabel>
                                  <Controller control={control} name={`fieldChecks.${index}.operator`} render={({ field }) => (
                                    <div className="flex flex-wrap gap-1.5">
                                      {operatorOptions
                                        .filter((op: any) => ['EQUALS', 'CONTAINS', 'REGEX', 'LLM_JUDGE'].includes(op.value))
                                        .map((method) => {
                                          const isActive = field.value === method.value
                                        return (
                                          <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => {
                                              field.onChange(method.value)
                                              if (method.value === 'LLM_JUDGE') {
                                                form.setValue(`fieldChecks.${index}.expectedSource`, 'LITERAL')
                                              }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${
                                              isActive
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground'
                                            }`}
                                          >
                                            {method.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )} />
                                </div>

                                {check?.operator === 'LLM_JUDGE' ? (
                                  <div className="space-y-4">
                                    <Field>
                                      <FieldLabel className="text-xs font-semibold">Prompt chấm điểm</FieldLabel>
                                      <Controller control={control} name={`fieldChecks.${index}.expectedValue`} render={({ field }) => (
                                        <div className="space-y-2">
                                          <Textarea
                                            {...field}
                                            value={field.value || ''}
                                            className="min-h-[100px] font-mono text-xs leading-relaxed rounded-xl"
                                            placeholder="VD: Câu trả lời {response.answer} có giải thích đúng chính sách {dataset.expected_answer} không? Trả về pass/fail..."
                                          />
                                          <div className="flex flex-wrap gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const val = field.value || ''
                                                field.onChange(val + ' {response.answer}')
                                              }}
                                              className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800/40 cursor-pointer transition-all"
                                            >
                                              + response.answer
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const val = field.value || ''
                                                field.onChange(val + ' {dataset.expected_answer}')
                                              }}
                                              className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 cursor-pointer transition-all"
                                            >
                                              + dataset.expected_answer
                                            </button>
                                          </div>
                                        </div>
                                      )} />
                                    </Field>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <Field>
                                        <FieldLabel className="text-xs font-semibold">Ngưỡng đạt (Min Score)</FieldLabel>
                                        <Controller control={control} name={`fieldChecks.${index}.threshold`} render={({ field }) => (
                                          <Input type="number" step="0.05" min="0" max="1" placeholder="Mặc định: 0.8" {...field} value={field.value || ''} className="h-9 rounded-lg" />
                                        )} />
                                      </Field>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <FieldLabel className="text-xs font-semibold">Đối chiếu với dữ liệu kỳ vọng</FieldLabel>
                                    <div className="flex items-center gap-2">
                                      <Controller control={control} name={`fieldChecks.${index}.expectedSource`} render={({ field }) => (
                                        <Select value={field.value} onValueChange={(val) => {
                                          field.onChange(val)
                                          form.setValue(`fieldChecks.${index}.expectedColumnKey`, null)
                                          form.setValue(`fieldChecks.${index}.expectedValue`, null)
                                        }}>
                                          <SelectTrigger className="h-9 w-[110px] shrink-0 rounded-lg"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="DATASET_COLUMN">Dataset</SelectItem>
                                            <SelectItem value="LITERAL">Tĩnh</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )} />
                                      {check?.expectedSource === 'DATASET_COLUMN' ? (
                                        <Controller control={control} name={`fieldChecks.${index}.expectedColumnKey`} render={({ field }) => (
                                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                                            <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Chọn cột từ dataset..." /></SelectTrigger>
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
                                          <Input {...field} value={field.value || ''} placeholder="Giá trị tĩnh..." className="h-9 rounded-lg" />
                                        )} />
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end gap-2 pt-3 border-t border-dashed">
                                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => handleCancelEditRow(index)}>
                                    Hủy
                                  </Button>
                                  <Button type="button" size="sm" className="h-8 rounded-lg" onClick={() => handleSaveEditRow(index)}>
                                    Xác nhận
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card hover:shadow-md transition-all duration-200 relative group">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Badge className="font-mono text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg px-2 py-0.5 shadow-none">
                                      response.{check?.responsePath}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-semibold">đối chiếu</span>
                                    {check?.operator === 'LLM_JUDGE' ? (
                                      <Badge className="font-mono text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg px-2 py-0.5 shadow-none">
                                        LLM Judge
                                      </Badge>
                                    ) : check?.expectedSource === 'DATASET_COLUMN' ? (
                                      <Badge className="font-mono text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-2 py-0.5 shadow-none">
                                        dataset.{expectedLabel}
                                      </Badge>
                                    ) : (
                                      <Badge className="font-mono text-xs text-zinc-650 bg-zinc-50 dark:bg-zinc-850/30 border border-zinc-200 dark:border-zinc-700/40 rounded-lg px-2 py-0.5 shadow-none">
                                        "{expectedLabel}"
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] rounded-md font-mono border-zinc-200 dark:border-zinc-800">
                                      w: {check?.weight}
                                    </Badge>
                                    <Controller control={control} name={`fieldChecks.${index}.enabled`} render={({ field }) => (
                                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={editingCheckIndex !== null} className="scale-90" />
                                    )} />
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button type="button" variant="ghost" size="icon" className="size-7 rounded-lg active:scale-95 transition-transform" disabled={editingCheckIndex !== null} onClick={() => handleEditCheckRow(index)}>
                                        <PencilIcon className="size-3.5" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="icon" className="size-7 rounded-lg active:scale-95 transition-transform" disabled={editingCheckIndex !== null} onClick={() => handleDuplicateCheckRow(index)}>
                                        <CopyIcon className="size-3.5" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg active:scale-95 transition-transform" disabled={editingCheckIndex !== null} onClick={() => fieldChecksArray.remove(index)}>
                                        <TrashIcon className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {check?.operator === 'LLM_JUDGE' ? (
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl p-3.5 space-y-2">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prompt đánh giá</p>
                                      <p className="text-xs font-semibold leading-relaxed font-mono whitespace-pre-wrap text-zinc-850 dark:text-zinc-200">
                                        {check?.expectedValue}
                                      </p>
                                      <div className="flex items-center gap-4 text-[10.5px] text-muted-foreground pt-1.5 border-t border-dashed">
                                        <span>Model: <strong className="text-foreground">gpt-4o</strong></span>
                                        <span>Ngưỡng đạt: <strong className="text-foreground">score ≥ {check?.threshold || 0.8}</strong></span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl p-3">
                                      <div className="flex items-center gap-2 font-mono text-xs">
                                        <span className="text-blue-600 font-semibold">response.{check?.responsePath}</span>
                                        <span className="text-muted-foreground font-semibold">
                                          {check?.operator === 'EQUALS' ? '==' : check?.operator === 'CONTAINS' ? '⊇' : check?.operator}
                                        </span>
                                        <span className={check?.expectedSource === 'DATASET_COLUMN' ? 'text-emerald-600 font-semibold' : 'text-zinc-650 dark:text-zinc-350'}>
                                          {check?.expectedSource === 'DATASET_COLUMN' ? `dataset.${expectedLabel}` : `"${expectedLabel}"`}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>sample {check?.operator === 'LLM_JUDGE' ? '0.93 - pass' : 'pass'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SINGLE RUBRIC SECTION (OVERALL_RUBRIC) */}
              {showRubrics && (
                <div className="space-y-6">
                  {/* Single Global Rubric Prompt */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold">Rubric prompt</h3>
                      <p className="text-xs text-muted-foreground">Một prompt LLM chung để đánh giá toàn bộ response của Bot</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card space-y-3">
                      <Textarea
                        value={globalPrompt}
                        onChange={(e) => setGlobalPrompt(e.target.value)}
                        className="min-h-[140px] font-mono text-xs leading-relaxed rounded-xl"
                        placeholder="VD: Hãy chấm điểm câu trả lời dựa trên các tiêu chí sau..."
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGlobalPrompt(prev => prev + ' {response.answer}')}
                          className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800/40 cursor-pointer transition-all"
                        >
                          + response.answer
                        </button>
                        <button
                          type="button"
                          onClick={() => setGlobalPrompt(prev => prev + ' {dataset.expected_answer}')}
                          className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 cursor-pointer transition-all"
                        >
                          + dataset.expected_answer
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Criteria list (Keys definition) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">Tiêu chí chấm (Criteria keys)</h3>
                        <p className="text-xs text-muted-foreground">Danh sách các khía cạnh cần chấm điểm độc lập</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg cursor-pointer animate-in"
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
                        <PlusIcon className="size-3.5 mr-1" />
                        Thêm tiêu chí
                      </Button>
                    </div>

                    {llmRubricsArray.fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl bg-muted/5">
                        <BrainCircuitIcon className="text-muted-foreground/30 mb-2 size-8" />
                        <p className="text-sm text-muted-foreground font-semibold">Chưa có tiêu chí nào</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Ấn "Thêm tiêu chí" để cấu hình</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {llmRubricsArray.fields.map((item, index) => (
                          <div key={item.id} className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <Controller control={control} name={`llmRubrics.${index}.name`} render={({ field, fieldState }) => (
                                  <Input
                                    {...field}
                                    placeholder="Criteria key (VD: answer_correct)"
                                    className="h-8 text-xs font-mono font-semibold w-full sm:w-[220px] rounded-lg"
                                    aria-invalid={!!fieldState.error}
                                  />
                                )} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Controller control={control} name={`llmRubrics.${index}.enabled`} render={({ field }) => (
                                  <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-90" />
                                )} />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => llmRubricsArray.remove(index)}
                                >
                                  <TrashIcon className="size-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Field className="flex-1">
                                <FieldLabel className="text-xs font-semibold">Mô tả tiêu chí</FieldLabel>
                                <Controller control={control} name={`llmRubrics.${index}.rubric`} render={({ field, fieldState }) => (
                                  <Input
                                    {...field}
                                    placeholder="VD: Đúng ý nghĩa câu trả lời mẫu..."
                                    className="h-8 text-xs rounded-lg"
                                    aria-invalid={!!fieldState.error}
                                  />
                                )} />
                              </Field>
                              <div className="grid grid-cols-2 gap-2">
                                <Field>
                                  <FieldLabel className="text-xs font-semibold">Ngưỡng đạt</FieldLabel>
                                  <Controller control={control} name={`llmRubrics.${index}.threshold`} render={({ field, fieldState }) => (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="1"
                                      className="h-8 text-xs text-center rounded-lg"
                                      {...field}
                                      aria-invalid={!!fieldState.error}
                                    />
                                  )} />
                                </Field>
                                <Field>
                                  <FieldLabel className="text-xs font-semibold">Trọng số</FieldLabel>
                                  <Controller control={control} name={`llmRubrics.${index}.weight`} render={({ field }) => (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      className="h-8 text-xs text-center rounded-lg"
                                      {...field}
                                    />
                                  )} />
                                </Field>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end pt-4 border-t w-full">
                <Button type="submit" disabled={saveMutation.isPending} className="rounded-xl active:scale-[0.97] transition-all cursor-pointer">
                  {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                  Lưu cấu hình
                </Button>
              </div>

            </div>

            {/* RIGHT COLUMN: Sidebar panels */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Operators Glossary (For Per-field and Hybrid) */}
              {showFieldChecks && (
                <Card className="rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircleIcon className="size-3.5 text-zinc-500" />
                      Phương thức Verify
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs leading-relaxed text-muted-foreground">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Equals (Chính xác)</p>
                      <p>So sánh tuyệt đối bằng nhau giữa kết quả và dữ liệu mong đợi.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Contains (Chứa)</p>
                      <p>Kiểm tra xem kết quả có chứa chuỗi hoặc phần tử con mong muốn không.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Regex (Khớp chuỗi)</p>
                      <p>Xác thực theo biểu thức chính quy (regular expressions).</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Output Schema JSON preview (For Single Rubric) */}
              {showRubrics && (
                <Card className="rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden font-mono">
                  <CardHeader className="pb-3 border-b bg-muted/5">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      Output Schema (JSON)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed rounded-b-2xl overflow-x-auto select-all">
                    <pre><code>{schemaJson}</code></pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </TooltipProvider>
  )
}
