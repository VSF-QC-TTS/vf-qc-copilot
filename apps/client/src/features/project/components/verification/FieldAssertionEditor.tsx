import { ArrowRightIcon } from 'lucide-react'
import type { ReactElement } from 'react'

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
  const currentOperator = operators.some((operator) => operator.operator === assertion.operator)
    ? assertion.operator
    : operators[0]?.operator ?? assertion.operator
  const normalizedResponseFields = responseFields.map(normalizeResponseField)
  const selectedResponseField = normalizedResponseFields.find((field) => field.path === assertion.actualPath)
  const responseOptions = normalizedResponseFields.map((field) => ({ value: field.path, label: field.path }))
  const datasetColumnId = assertion.expectedColumnKey ?? undefined

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
          <FieldLabel className="text-xs font-semibold">Response field</FieldLabel>
          <Combobox
            options={responseOptions}
            value={assertion.actualPath || undefined}
            onChange={(actualPath) => patchAssertion({ actualPath })}
            placeholder="response.answer..."
            emptyText="Chưa có response path"
          />
        </Field>

        <Field>
          <FieldLabel className="text-xs font-semibold">Toán tử</FieldLabel>
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
          <FieldLabel className="text-xs font-semibold">Dataset schema column</FieldLabel>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <ArrowRightIcon className="size-4 text-muted-foreground" />
            <Select value={datasetColumnId} onValueChange={handleDatasetColumnChange}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="dataset.ground_truth..." />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column.publicId} value={column.publicId}>
                    {column.columnName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>
      </div>
      {compact ? null : (
        <div className="mt-2 break-words rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {selectedResponseField?.example
            ? `Example: ${selectedResponseField.example}`
            : 'So sánh giá trị từ response với dữ liệu kỳ vọng trong từng row dataset.'}
        </div>
      )}
    </div>
  )
}

function normalizeResponseField(field: string | ResponseFieldExampleResponse): ResponseFieldExampleResponse {
  return typeof field === 'string' ? { path: field, example: null } : field
}
