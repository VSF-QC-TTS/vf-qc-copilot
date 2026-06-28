import { useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertCircleIcon,
  BotIcon,
  ListChecksIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  TrashIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  FieldAssertionRequest,
  OperatorCatalogResponse,
  VerificationItemRequest,
  VerificationMode,
} from '@/types/config'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'

import { VerificationSkeleton } from '../../components/VerificationSkeleton'
import {
  useOperatorCatalog,
  useResponseFieldExamples,
  useSaveVerificationConfig,
  useVerificationConfig,
} from '../../hooks/use-verification-config'
import { useProjectSchema } from '../../hooks/use-project-schema'
import { FieldAssertionEditor } from '../../components/verification/FieldAssertionEditor'
import { LlmJudgeEditor } from '../../components/verification/LlmJudgeEditor'
import {
  createFieldItem,
  createLlmItem,
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
  makeOperator('EQUALS', 'Bằng', 'So khớp chính xác', 'TEXT', true),
  makeOperator('NOT_EQUALS', 'Khác', 'Giá trị thực tế khác kỳ vọng', 'TEXT', true),
  makeOperator('CONTAINS', 'Chứa', 'Giá trị thực tế chứa kỳ vọng', 'TEXT', true),
  makeOperator('NOT_CONTAINS', 'Không chứa', 'Giá trị thực tế không chứa kỳ vọng', 'TEXT', true),
  makeOperator('REGEX', 'Regex', 'Giá trị thực tế khớp biểu thức chính quy', 'TEXT', true),
  makeOperator('GREATER_THAN', 'Lớn hơn', 'So sánh số lớn hơn kỳ vọng', 'NUMBER', true),
  makeOperator('GREATER_THAN_OR_EQUALS', 'Lớn hơn hoặc bằng', 'So sánh số lớn hơn hoặc bằng kỳ vọng', 'NUMBER', true),
  makeOperator('LESS_THAN', 'Nhỏ hơn', 'So sánh số nhỏ hơn kỳ vọng', 'NUMBER', true),
  makeOperator('LESS_THAN_OR_EQUALS', 'Nhỏ hơn hoặc bằng', 'So sánh số nhỏ hơn hoặc bằng kỳ vọng', 'NUMBER', true),
]

export function VerificationConfigPage(): ReactElement {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: config, isLoading } = useVerificationConfig(publicId)
  const { data: schemaData } = useProjectSchema(publicId)
  const { data: responseFieldData } = useResponseFieldExamples(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const [values, setValues] = useState<VerificationFormValues>(EMPTY_FORM_VALUES)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const columns = schemaData?.columns ?? []
  const responseFields = responseFieldData ?? []
  const operators = operatorCatalog ?? FALLBACK_OPERATORS
  const items = values.items ?? []
  const fieldItems = items
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.type === 'FIELD_ASSERTION')
  const llmItems = items
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.type === 'LLM_JUDGE')
  const mode = deriveMode(items, values.mode)

  useEffect(() => {
    if (!config) {
      return
    }
    const nextItems = flattenConfigItems(config.items.map(normalizeResponseItem))
    setValues({
      mode: deriveMode(nextItems, config.mode),
      threshold: config.threshold,
      items: nextItems,
    })
    setValidationErrors([])
  }, [config])

  function updateValues(patch: Partial<VerificationFormValues>): void {
    setValues((current) => {
      const nextItems = patch.items ?? current.items ?? []
      return {
        ...current,
        ...patch,
        mode: deriveMode(nextItems, patch.mode ?? current.mode),
      }
    })
  }

  function patchItem(index: number, patch: Partial<VerificationItemRequest>): void {
    updateValues({
      items: items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)),
    })
  }

  function addFieldRule(): void {
    const nextItem = createFieldItem(items.length)
    updateValues({
      items: [
        ...items,
        {
          ...nextItem,
          name: 'So khớp response với dataset',
        },
      ],
    })
  }

  function addLlmJudge(): void {
    updateValues({ items: [...items, createLlmItem(items.length)] })
  }

  function removeItem(index: number): void {
    updateValues({ items: items.filter((_, currentIndex) => currentIndex !== index) })
  }

  function handleFieldChange(index: number, assertion: FieldAssertionRequest): void {
    patchItem(index, {
      name: assertion.actualPath ? `So khớp ${assertion.actualPath}` : 'So khớp response với dataset',
      enabled: assertion.enabled,
      fieldAssertion: assertion,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const submitValues = prepareSubmitValues({ ...values, mode })
    const errors = validateVerificationForm(submitValues, operators)
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error('Verification chưa hợp lệ')
      return
    }
    saveMutation.mutate(submitValues)
  }

  if (isLoading) {
    return <VerificationSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 p-4 lg:p-6">
      <Card className="rounded-lg shadow-sm">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-foreground text-background">
                <ShieldCheckIcon data-icon="inline-start" />
                Verification
              </Badge>
              <Badge variant="outline">{modeLabel(mode)}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Cấu hình chấm kết quả chatbot</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{fieldItems.length} field match</Badge>
              <Badge variant="secondary">{llmItems.length} LLM judge</Badge>
              <Badge variant="secondary">{responseFields.length} response fields</Badge>
              <Badge variant="secondary">{columns.length} dataset columns</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field>
              <FieldLabel className="text-xs font-semibold">Ngưỡng pass tổng</FieldLabel>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={values.threshold}
                onChange={(event) => updateValues({ threshold: Number(event.target.value) })}
                className="h-10 rounded-lg"
              />
            </Field>
            <Button type="submit" className="h-10 rounded-lg" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
              Lưu
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationErrors.length > 0 ? <ValidationAlert errors={validationErrors} /> : null}

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecksIcon className="size-4" />
            Field match
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={addFieldRule}>
            <PlusIcon className="size-4" />
            Thêm rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {fieldItems.length > 0 ? (
            fieldItems.map(({ item, index }, displayIndex) =>
              item.fieldAssertion ? (
                <div key={item.publicId ?? `field-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">Rule {displayIndex + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                  <FieldAssertionEditor
                    assertion={item.fieldAssertion}
                    responseFields={responseFields}
                    columns={columns}
                    operators={operators}
                    compact={false}
                    onChange={(assertion) => handleFieldChange(index, assertion)}
                  />
                </div>
              ) : null,
            )
          ) : (
            <Empty className="rounded-lg border border-dashed p-8">
              <EmptyHeader>
                <EmptyTitle>Chưa có rule so khớp</EmptyTitle>
                <EmptyDescription>Thêm rule để chọn response field, operator và dataset column.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BotIcon className="size-4" />
            LLM Judge
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={addLlmJudge}>
            <PlusIcon className="size-4" />
            Thêm prompt
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {llmItems.length > 0 ? (
            llmItems.map(({ item, index }, displayIndex) => (
              <div key={item.publicId ?? `llm-${index}`} className="rounded-lg border bg-background">
                <div className="grid gap-3 border-b p-3 lg:grid-cols-[1fr_120px_120px_auto] lg:items-end">
                  <Field>
                    <FieldLabel className="text-xs font-semibold">Prompt name</FieldLabel>
                    <Input
                      value={item.name}
                      onChange={(event) => patchItem(index, { name: event.target.value })}
                      className="h-9 rounded-lg"
                      placeholder={`LLM Judge ${displayIndex + 1}`}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-semibold">Threshold</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={item.threshold ?? 0.7}
                      onChange={(event) => patchItem(index, { threshold: Number(event.target.value) })}
                      className="h-9 rounded-lg"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-semibold">Weight</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.weight}
                      onChange={(event) => patchItem(index, { weight: Number(event.target.value) })}
                      className="h-9 rounded-lg"
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
                      <Switch checked={item.enabled} onCheckedChange={(enabled) => patchItem(index, { enabled })} />
                      <span className="text-xs text-muted-foreground">Bật</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <LlmJudgeEditor
                    item={item}
                    responseFields={responseFields}
                    columns={columns}
                    onChange={(nextItem) => patchItem(index, nextItem)}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty className="rounded-lg border border-dashed p-8">
              <EmptyHeader>
                <EmptyTitle>Chưa có LLM Judge</EmptyTitle>
                <EmptyDescription>Thêm prompt để chấm bằng rubric tự nhiên.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </form>
  )
}

function ValidationAlert({ errors }: { errors: string[] }): ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>Cần sửa trước khi lưu</AlertTitle>
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

function flattenConfigItems(items: VerificationItemRequest[]): VerificationItemRequest[] {
  const nextItems: VerificationItemRequest[] = []
  for (const item of items) {
    if (item.type === 'FIELD_ASSERTION') {
      nextItems.push({ ...item, fieldAssertions: null, criteria: null })
    }
    if (item.type === 'FIELD_ASSERTION_GROUP') {
      for (const assertion of item.fieldAssertions ?? []) {
        const fieldItem = createFieldItem(nextItems.length)
        nextItems.push({
          ...fieldItem,
          name: assertion.actualPath ? `So khớp ${assertion.actualPath}` : 'So khớp response với dataset',
          enabled: assertion.enabled,
          critical: item.critical,
          weight: assertion.weight,
          fieldAssertion: { ...assertion, displayOrder: 0 },
        })
      }
    }
    if (item.type === 'LLM_JUDGE') {
      nextItems.push({
        ...item,
        fieldAssertion: null,
        fieldAssertions: null,
        criteria: [],
      })
    }
  }
  return nextItems.map((item, displayOrder) => ({ ...item, displayOrder }))
}

function deriveMode(items: VerificationItemRequest[], fallback: VerificationMode): VerificationMode {
  const hasField = items.some((item) => item.type === 'FIELD_ASSERTION')
  const hasLlm = items.some((item) => item.type === 'LLM_JUDGE')
  if (hasField && hasLlm) {
    return 'COMBINED'
  }
  if (hasLlm) {
    return 'LLM_JUDGE'
  }
  if (hasField) {
    return 'FIELD_CHECKS'
  }
  return fallback
}

function modeLabel(mode: VerificationMode): string {
  if (mode === 'COMBINED') {
    return 'Kết hợp'
  }
  if (mode === 'LLM_JUDGE') {
    return 'LLM Judge'
  }
  return 'Field match'
}

function makeOperator(
  operator: OperatorCatalogResponse['operator'],
  displayName: string,
  description: string,
  category: OperatorCatalogResponse['category'],
  requiresExpected: boolean,
  supportedExpectedSources: OperatorCatalogResponse['supportedExpectedSources'] = ['DATASET_COLUMN'],
): OperatorCatalogResponse {
  return { operator, displayName, description, category, requiresExpected, supportedExpectedSources }
}
