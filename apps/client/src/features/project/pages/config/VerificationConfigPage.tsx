import { useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams as useReactParams } from 'react-router-dom'
import {
  AlertCircleIcon,
  BotIcon,
  ListChecksIcon,
  PlusIcon,
  SaveIcon,
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
import { Spinner } from '@/components/ui/spinner'

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
  items: [],
}

const FALLBACK_OPERATORS: OperatorCatalogResponse[] = [
  makeOperator('EQUALS', 'Bằng', 'So khớp chính xác', 'TEXT'),
  makeOperator('NOT_EQUALS', 'Khác', 'Giá trị thực tế khác kỳ vọng', 'TEXT'),
  makeOperator('CONTAINS', 'Chứa', 'Giá trị thực tế chứa kỳ vọng', 'TEXT'),
  makeOperator('NOT_CONTAINS', 'Không chứa', 'Giá trị thực tế không chứa kỳ vọng', 'TEXT'),
  makeOperator('REGEX', 'Regex', 'Giá trị thực tế khớp biểu thức chính quy', 'TEXT'),
  makeOperator('GREATER_THAN', 'Lớn hơn', 'So sánh số lớn hơn kỳ vọng', 'NUMBER'),
  makeOperator('GREATER_THAN_OR_EQUALS', 'Lớn hơn hoặc bằng', 'So sánh số lớn hơn hoặc bằng kỳ vọng', 'NUMBER'),
  makeOperator('LESS_THAN', 'Nhỏ hơn', 'So sánh số nhỏ hơn kỳ vọng', 'NUMBER'),
  makeOperator('LESS_THAN_OR_EQUALS', 'Nhỏ hơn hoặc bằng', 'So sánh số nhỏ hơn hoặc bằng kỳ vọng', 'NUMBER'),
]

export function VerificationConfigPage(): ReactElement {
  const { t } = useTranslation(['project', 'validation'])
  const { publicId } = useReactParams<{ publicId: string }>()
  const { data: config, isLoading } = useVerificationConfig(publicId)
  const { data: schemaData } = useProjectSchema(publicId)
  const { data: responseFieldData } = useResponseFieldExamples(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const [values, setValues] = useState<VerificationFormValues>(EMPTY_FORM_VALUES)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'field_checks' | 'llm_judge'>('field_checks')

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

  const localizedOperators = operators.map((op) => {
    const key = `config.verification.operators.${op.operator.toLowerCase()}`
    return {
      ...op,
      displayName: t(`${key}.name`, { defaultValue: op.displayName }),
      description: t(`${key}.desc`, { defaultValue: op.description }),
    }
  })

  useEffect(() => {
    if (!config) {
      return
    }
    const nextItems = flattenConfigItems(config.items.map(normalizeResponseItem))
    setValues({
      mode: deriveMode(nextItems, config.mode),
      items: nextItems,
    })
    setValidationErrors([])
    
    // Automatically focus the tab that has content
    const hasField = nextItems.some((item) => item.type === 'FIELD_ASSERTION')
    const hasLlm = nextItems.some((item) => item.type === 'LLM_JUDGE')
    if (hasLlm && !hasField) {
      setActiveTab('llm_judge')
    } else {
      setActiveTab('field_checks')
    }
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
    updateValues({ items: [...items, createFieldItem()] })
  }

  function addLlmJudge(): void {
    updateValues({ items: [...items, createLlmItem()] })
  }

  function removeItem(index: number): void {
    updateValues({ items: items.filter((_, currentIndex) => currentIndex !== index) })
  }

  function handleFieldChange(index: number, assertion: FieldAssertionRequest): void {
    patchItem(index, {
      fieldAssertion: assertion,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const submitValues = prepareSubmitValues({ ...values, mode })
    const errors = validateVerificationForm(submitValues, operators)
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error(t('config.verification.invalidVerification'))
      return
    }
    saveMutation.mutate(submitValues)
  }

  if (isLoading) {
    return <VerificationSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4 border-border/65">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('config.verification.title')}</h1>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal py-0.5 px-2">
              {fieldItems.length} {t('config.verification.fieldMatchTab').toLowerCase()}
            </Badge>
            <Badge variant="secondary" className="font-normal py-0.5 px-2">
              {llmItems.length} {t('config.verification.llmJudgeTab').toLowerCase()}
            </Badge>
            <Badge variant="secondary" className="font-normal py-0.5 px-2">
              {responseFields.length} {t('config.verification.responseFields').toLowerCase()}
            </Badge>
            <Badge variant="secondary" className="font-normal py-0.5 px-2">
              {columns.length} {t('config.verification.datasetColumns').toLowerCase()}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <Button type="submit" className="h-9 px-4 rounded-lg font-medium" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
            {t('config.verification.save')}
          </Button>
        </div>
      </div>

      {validationErrors.length > 0 ? <ValidationAlert errors={validationErrors} t={t} /> : null}

      <div className="flex border-b border-border/80 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('field_checks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'field_checks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ListChecksIcon className="size-4" />
          <span>{t('config.verification.fieldMatchTab')}</span>
          <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px] font-normal">
            {fieldItems.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('llm_judge')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'llm_judge'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BotIcon className="size-4" />
          <span>{t('config.verification.llmJudgeTab')}</span>
          <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px] font-normal">
            {llmItems.length}
          </Badge>
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'field_checks' && (
          <Card className="rounded-lg border shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ListChecksIcon className="size-4 text-muted-foreground" />
                {t('config.verification.fieldMatchTitle')}
              </CardTitle>
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs font-normal" onClick={addFieldRule}>
                <PlusIcon className="size-3.5" />
                {t('config.verification.addRule')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {fieldItems.length > 0 ? (
                fieldItems.map(({ item, index }, displayIndex) =>
                  item.fieldAssertion ? (
                    <div key={item.publicId ?? `field-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="outline" className="font-normal text-[11px] px-2 py-0.5">
                          {t('config.verification.rule')} {displayIndex + 1}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                      <FieldAssertionEditor
                        assertion={item.fieldAssertion}
                        responseFields={responseFields}
                        columns={columns}
                        operators={localizedOperators}
                        compact={false}
                        onChange={(assertion) => handleFieldChange(index, assertion)}
                      />
                    </div>
                  ) : null,
                )
              ) : (
                <Empty className="rounded-lg border border-dashed py-12">
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-medium">{t('config.verification.noFieldMatch')}</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground max-w-xs">{t('config.verification.noFieldMatchHint')}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'llm_judge' && (
          <Card className="rounded-lg border shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BotIcon className="size-4 text-muted-foreground" />
                {t('config.verification.llmJudgeTitle')}
              </CardTitle>
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs font-normal" onClick={addLlmJudge}>
                <PlusIcon className="size-3.5" />
                {t('config.verification.addPrompt')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {llmItems.length > 0 ? (
                llmItems.map(({ item, index }, displayIndex) => (
                  <div key={item.publicId ?? `llm-${index}`} className="rounded-lg border bg-background overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b bg-muted/15 p-2 px-3">
                      <Badge variant="outline" className="font-normal text-[11px] px-2 py-0.5">
                        {t('config.verification.prompt')} {displayIndex + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
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
                <Empty className="rounded-lg border border-dashed py-12">
                  <EmptyHeader>
                    <EmptyTitle className="text-sm font-medium">{t('config.verification.noLlmJudge')}</EmptyTitle>
                    <EmptyDescription className="text-xs text-muted-foreground max-w-xs">{t('config.verification.noLlmJudgeHint')}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </form>
  )
}

function ValidationAlert({ errors, t }: { errors: string[]; t: (key: string) => string }): ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>{t('config.verification.validationErrorTitle')}</AlertTitle>
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
      nextItems.push(item)
    }
    if (item.type === 'LLM_JUDGE') {
      nextItems.push({
        ...item,
        fieldAssertion: null,
      })
    }
  }
  return nextItems
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

function makeOperator(
  operator: OperatorCatalogResponse['operator'],
  displayName: string,
  description: string,
  category: OperatorCatalogResponse['category'],
): OperatorCatalogResponse {
  return { operator, displayName, description, category }
}
