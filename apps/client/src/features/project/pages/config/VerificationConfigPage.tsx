import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertCircleIcon, SaveIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { OperatorCatalogResponse, VerificationItemRequest, VerificationMode } from '@/types/config'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { VerificationSkeleton } from '../../components/VerificationSkeleton'
import {
  useOperatorCatalog,
  useResponseFields,
  useSaveVerificationConfig,
  useVerificationConfig,
} from '../../hooks/use-verification-config'
import { useProjectSchema } from '../../hooks/use-project-schema'
import { VerificationItemCard } from '../../components/verification/VerificationItemCard'
import { VerificationItemToolbar } from '../../components/verification/VerificationItemToolbar'
import { VerificationModeTabs } from '../../components/verification/VerificationModeTabs'
import { VerificationSummary } from '../../components/verification/VerificationSummary'
import {
  createFieldItem,
  createGroupItem,
  createLlmItem,
  itemCompatibleWithMode,
  normalizeResponseItem,
  prepareSubmitValues,
  validateVerificationForm,
  type VerificationFormValues,
} from '../../components/verification/verification-form'

const EMPTY_FORM_VALUES: VerificationFormValues = {
  mode: 'FIELD_CHECKS',
  threshold: 0.8,
  items: [],
}

const FALLBACK_OPERATORS: OperatorCatalogResponse[] = [
  {
    operator: 'EQUALS',
    displayName: 'Bằng',
    description: 'So khớp chính xác',
    category: 'TEXT',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'NOT_EQUALS',
    displayName: 'Khác',
    description: 'Giá trị thực tế khác kỳ vọng',
    category: 'TEXT',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'CONTAINS',
    displayName: 'Chứa',
    description: 'Giá trị thực tế chứa kỳ vọng',
    category: 'TEXT',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'NOT_CONTAINS',
    displayName: 'Không chứa',
    description: 'Giá trị thực tế không chứa kỳ vọng',
    category: 'TEXT',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'REGEX',
    displayName: 'Regex',
    description: 'Giá trị thực tế khớp biểu thức chính quy',
    category: 'TEXT',
    requiresExpected: true,
    supportedExpectedSources: ['STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'GREATER_THAN',
    displayName: 'Lớn hơn',
    description: 'So sánh số lớn hơn kỳ vọng',
    category: 'NUMBER',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'GREATER_THAN_OR_EQUALS',
    displayName: 'Lớn hơn hoặc bằng',
    description: 'So sánh số lớn hơn hoặc bằng kỳ vọng',
    category: 'NUMBER',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'LESS_THAN',
    displayName: 'Nhỏ hơn',
    description: 'So sánh số nhỏ hơn kỳ vọng',
    category: 'NUMBER',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'LESS_THAN_OR_EQUALS',
    displayName: 'Nhỏ hơn hoặc bằng',
    description: 'So sánh số nhỏ hơn hoặc bằng kỳ vọng',
    category: 'NUMBER',
    requiresExpected: true,
    supportedExpectedSources: ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE'],
  },
  {
    operator: 'NOT_EMPTY',
    displayName: 'Không rỗng',
    description: 'Trường có dữ liệu',
    category: 'PRESENCE',
    requiresExpected: false,
    supportedExpectedSources: [],
  },
  {
    operator: 'IS_JSON',
    displayName: 'JSON hợp lệ',
    description: 'Giá trị là JSON parse được',
    category: 'STRUCTURE',
    requiresExpected: false,
    supportedExpectedSources: [],
  },
]

interface VisibleItem {
  key: string
  item: VerificationItemRequest
  index: number
}

export function VerificationConfigPage(): ReactElement {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: config, isLoading } = useVerificationConfig(publicId)
  const { data: schemaData } = useProjectSchema(publicId)
  const { data: responseFields } = useResponseFields(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const [values, setValues] = useState<VerificationFormValues>(EMPTY_FORM_VALUES)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const columns = schemaData?.columns ?? []
  const availableResponseFields = responseFields ?? []
  const operators = operatorCatalog ?? FALLBACK_OPERATORS
  const items = values.items ?? []
  const visibleItems = getVisibleItems(items, values.mode)

  useEffect(() => {
    if (!config) {
      return
    }
    setValues({
      mode: config.mode,
      threshold: config.threshold,
      items: config.items.map(normalizeResponseItem),
    })
    setValidationErrors([])
  }, [config])

  function handleModeChange(mode: VerificationMode): void {
    setValues((current) => ({ ...current, mode }))
  }

  function handleThresholdChange(event: ChangeEvent<HTMLInputElement>): void {
    setValues((current) => ({ ...current, threshold: Number(event.target.value) }))
  }

  function addItem(item: VerificationItemRequest): void {
    setValues((current) => ({
      ...current,
      items: [...(current.items ?? []), item],
    }))
  }

  function handleAddField(): void {
    addItem(createFieldItem(items.length))
  }

  function handleAddGroup(): void {
    addItem(createGroupItem(items.length))
  }

  function handleAddLlm(): void {
    addItem(createLlmItem(items.length))
  }

  function handleItemChange(index: number, item: VerificationItemRequest): void {
    setValues((current) => ({
      ...current,
      items: (current.items ?? []).map((currentItem, currentIndex) => (currentIndex === index ? item : currentItem)),
    }))
  }

  function handleItemRemove(index: number): void {
    setValues((current) => ({
      ...current,
      items: (current.items ?? []).filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const submitValues = prepareSubmitValues(values)
    const errors = validateVerificationForm(submitValues, operators)
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error('Cấu hình verification chưa hợp lệ')
      return
    }
    saveMutation.mutate(submitValues)
  }

  if (isLoading) {
    return <VerificationSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <ConfigPageHeader titleKey="config.verification.title" descriptionKey="config.verification.description" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <VerificationModeTabs value={values.mode} onChange={handleModeChange} />
      </motion.div>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle>Điều kiện đạt tổng</CardTitle>
          <CardDescription>QC nhìn được số rule đang bật, rule bắt buộc đúng và ngưỡng pass chung.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <Field>
            <FieldLabel>Ngưỡng đạt tổng</FieldLabel>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={values.threshold}
              onChange={handleThresholdChange}
              className="h-10 rounded-lg"
            />
          </Field>
          <VerificationSummary items={visibleItems.map((entry) => entry.item)} threshold={values.threshold} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Tiêu chí verification</h2>
          <p className="text-sm text-muted-foreground">
            Mỗi item là một rule, một nhóm rule hoặc một AI Judge có điểm riêng.
          </p>
        </div>
        <VerificationItemToolbar
          mode={values.mode}
          onAddField={handleAddField}
          onAddGroup={handleAddGroup}
          onAddLlm={handleAddLlm}
        />
      </div>

      {validationErrors.length > 0 ? <ValidationAlert errors={validationErrors} /> : null}

      {visibleItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {visibleItems.map((entry) => (
            <VerificationItemCard
              key={entry.key}
              item={entry.item}
              responseFields={availableResponseFields}
              columns={columns}
              operators={operators}
              onChange={(item) => handleItemChange(entry.index, item)}
              onRemove={() => handleItemRemove(entry.index)}
            />
          ))}
        </div>
      ) : (
        <EmptyState mode={values.mode} />
      )}

      <div className="sticky bottom-0 z-10 -mx-6 border-t bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl justify-end">
          <Button type="submit" className="h-10 rounded-lg" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
            Lưu verification
          </Button>
        </div>
      </div>
    </form>
  )
}

function getVisibleItems(items: VerificationItemRequest[], mode: VerificationMode): VisibleItem[] {
  return items
    .map((item, index) => ({
      item,
      index,
      key: item.publicId ?? `${item.type}-${item.displayOrder}-${index}`,
    }))
    .filter((entry) => itemCompatibleWithMode(entry.item, mode))
}

function ValidationAlert({ errors }: { errors: string[] }): ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>Cần kiểm tra lại cấu hình</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function EmptyState({ mode }: { mode: VerificationMode }): ReactElement {
  const hiddenHint =
    mode === 'FIELD_CHECKS'
      ? 'Thêm rule hoặc nhóm rule để so khớp response với dataset.'
      : mode === 'LLM_JUDGE'
        ? 'Thêm AI Judge để chấm response bằng rubric và tiêu chí.'
        : 'Thêm rule, nhóm rule hoặc AI Judge để bắt đầu.'

  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <h3 className="text-sm font-semibold">Chưa có tiêu chí trong chế độ này</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{hiddenHint}</p>
    </div>
  )
}
