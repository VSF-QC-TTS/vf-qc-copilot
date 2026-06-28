import { ArrowRightIcon } from 'lucide-react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  CheckOperator,
  FieldAssertionRequest,
  OperatorCatalogResponse,
  ResponseFieldExampleResponse,
  SchemaColumnResponse,
} from '@/types/config'

import { Combobox } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'

interface FieldAssertionEditorProps {
  assertion: FieldAssertionRequest
  responseFields: Array<string | ResponseFieldExampleResponse>
  columns: SchemaColumnResponse[]
  operators: OperatorCatalogResponse[]
  compact?: boolean
  onChange: (assertion: FieldAssertionRequest) => void
}

export function FieldAssertionEditor({
  assertion,
  responseFields,
  columns,
  operators,
  compact = false,
  onChange,
}: FieldAssertionEditorProps): ReactElement {
  const { t } = useTranslation('project')
  const currentOperator = operators.some((operator) => operator.operator === assertion.operator)
    ? assertion.operator
    : operators[0]?.operator ?? assertion.operator
  const normalizedResponseFields = responseFields.map(normalizeResponseField)
  const selectedResponseField = normalizedResponseFields.find((field) => field.path === assertion.actualPath)
  
  const responseOptions = normalizedResponseFields.map((field) => {
    const isAnswer = field.path.toLowerCase().includes('answer')
    const displayLabel = isAnswer
      ? t('verification.aliasResponseField', { path: field.path })
      : t('verification.aliasResponseFieldDefault', { path: field.path })
    return { value: field.path, label: displayLabel }
  })
  
  const datasetColumnId = assertion.expectedColumnKey ?? undefined
  const selectedOperator = operators.find((op) => op.operator === currentOperator)

  function patchAssertion(patch: Partial<FieldAssertionRequest>): void {
    onChange({ ...assertion, ...patch })
  }

  function handleOperatorChange(operatorValue: string): void {
    patchAssertion({ operator: operatorValue as CheckOperator })
  }

  function handleDatasetColumnChange(expectedColumnKey: string): void {
    patchAssertion({
      operator: currentOperator,
      expectedColumnKey,
    })
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_160px_minmax(220px,1fr)] xl:items-end">
        <Field>
          <FieldLabel className="text-xs font-semibold">{t('verification.fieldLabelResponse')}</FieldLabel>
          <Combobox
            options={responseOptions}
            value={assertion.actualPath || undefined}
            onChange={(actualPath) => patchAssertion({ actualPath })}
            placeholder={t('verification.chooseResponseField')}
            emptyText={t('verification.noResponsePath')}
          />
        </Field>

        <Field>
          <FieldLabel className="text-xs font-semibold">{t('verification.fieldLabelOperator')}</FieldLabel>
          <Select value={currentOperator} onValueChange={handleOperatorChange}>
            <SelectTrigger className="h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((operator) => (
                <SelectItem key={operator.operator} value={operator.operator}>
                  {operator.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="text-xs font-semibold">{t('verification.fieldLabelDataset')}</FieldLabel>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <ArrowRightIcon className="size-4 text-muted-foreground" />
            <Select value={datasetColumnId} onValueChange={handleDatasetColumnChange}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder={t('verification.chooseDatasetColumn')} />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => {
                  const isGroundTruth = column.columnName.toLowerCase().includes('ground_truth')
                  const displayLabel = isGroundTruth
                    ? t('verification.aliasDatasetColumn', { column: column.columnName })
                    : t('verification.aliasDatasetColumnDefault', { column: column.columnName })
                  return (
                    <SelectItem key={column.publicId} value={column.publicId}>
                      {displayLabel}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </Field>
      </div>
      {compact ? null : (
        <div className="mt-2 flex flex-col gap-1 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {selectedResponseField?.example ? (
            <div className="break-all">
              <span className="font-semibold text-foreground">{t('verification.actualSampleData')}</span> {selectedResponseField.example}
            </div>
          ) : null}
          {selectedOperator ? (
            <div>
              <span className="font-semibold text-foreground">{t('verification.matchingRule', { operator: selectedOperator.displayName })}</span> {selectedOperator.description}
            </div>
          ) : (
            <div>{t('verification.description')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function normalizeResponseField(field: string | ResponseFieldExampleResponse): ResponseFieldExampleResponse {
  return typeof field === 'string' ? { path: field, example: null } : field
}
