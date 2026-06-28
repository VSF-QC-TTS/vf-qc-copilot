import { ArrowRightIcon, TrashIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { CheckOperator, FieldAssertionRequest, OperatorCatalogResponse, SchemaColumnResponse } from '@/types/config'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'

import { defaultExpectedValue } from './verification-form'

interface FieldAssertionEditorProps {
  assertion: FieldAssertionRequest
  responseFields: string[]
  columns: SchemaColumnResponse[]
  operators: OperatorCatalogResponse[]
  compact?: boolean
  removable?: boolean
  onChange: (assertion: FieldAssertionRequest) => void
  onRemove?: () => void
}

export function FieldAssertionEditor({
  assertion,
  responseFields,
  columns,
  operators,
  compact = false,
  removable = false,
  onChange,
  onRemove,
}: FieldAssertionEditorProps): ReactElement {
  const comparableOperators = operators.filter((operator) => operator.requiresExpected)
  const currentOperator = comparableOperators.some((operator) => operator.operator === assertion.operator)
    ? assertion.operator
    : comparableOperators[0]?.operator ?? assertion.operator
  const responseOptions = responseFields.map((field) => ({ value: field, label: field }))
  const datasetColumnId = assertion.expected?.source === 'DATASET_COLUMN' ? assertion.expected.columnKey ?? undefined : undefined

  function patchAssertion(patch: Partial<FieldAssertionRequest>): void {
    onChange({ ...assertion, ...patch })
  }

  function handleOperatorChange(operatorValue: string): void {
    const operator = operatorValue as CheckOperator
    patchAssertion({
      operator,
      expected: assertion.expected?.source === 'DATASET_COLUMN' ? assertion.expected : defaultExpectedValue(),
    })
  }

  function handleDatasetColumnChange(columnKey: string): void {
    patchAssertion({
      operator: currentOperator,
      expected: {
        source: 'DATASET_COLUMN',
        columnKey,
        value: null,
        template: null,
      },
    })
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_160px_minmax(220px,1fr)_100px_auto] xl:items-end">
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
              {comparableOperators.map((operator) => (
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

        <Field>
          <FieldLabel className="text-xs font-semibold">Weight</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={assertion.weight}
            onChange={(event) => patchAssertion({ weight: Number(event.target.value) })}
            className="h-9 rounded-lg"
          />
        </Field>

        <div className="flex items-end gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
            <Switch checked={assertion.enabled} onCheckedChange={(enabled) => patchAssertion({ enabled })} />
            <span className="text-xs text-muted-foreground">Bật</span>
          </div>
          {removable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <TrashIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      {compact ? null : (
        <div className="mt-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          So sánh giá trị từ response với dữ liệu kỳ vọng trong từng row dataset.
        </div>
      )}
    </div>
  )
}
