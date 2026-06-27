import { TrashIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { CheckOperator, FieldAssertionRequest, OperatorCatalogResponse, SchemaColumnResponse } from '@/types/config'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'

import { ExpectedValueEditor } from './ExpectedValueEditor'
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
  const selectedOperator = operators.find((operator) => operator.operator === assertion.operator)
  const responseOptions = responseFields.map((field) => ({ value: field, label: field }))

  function patchAssertion(patch: Partial<FieldAssertionRequest>): void {
    onChange({ ...assertion, ...patch })
  }

  function handleOperatorChange(operatorValue: string): void {
    const operator = operatorValue as CheckOperator
    const nextOperator = operators.find((item) => item.operator === operator)
    patchAssertion({
      operator,
      expected:
        nextOperator?.requiresExpected === false
          ? null
          : assertion.expected ?? defaultExpectedValue(),
    })
  }

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_180px_120px_auto]">
        <Field>
          <FieldLabel className="text-xs font-semibold">Trường response</FieldLabel>
          <Combobox
            options={responseOptions}
            value={assertion.actualPath || undefined}
            onChange={(actualPath) => patchAssertion({ actualPath })}
            placeholder="Chọn response path..."
            emptyText="Chưa có response path"
          />
        </Field>

        <Field>
          <FieldLabel className="text-xs font-semibold">Toán tử</FieldLabel>
          <Select value={assertion.operator} onValueChange={handleOperatorChange}>
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
          <FieldLabel className="text-xs font-semibold">Mức ảnh hưởng</FieldLabel>
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

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <ExpectedValueEditor
          value={assertion.expected}
          operator={selectedOperator}
          columns={columns}
          onChange={(expected) => patchAssertion({ expected })}
        />
      </div>
    </div>
  )
}
