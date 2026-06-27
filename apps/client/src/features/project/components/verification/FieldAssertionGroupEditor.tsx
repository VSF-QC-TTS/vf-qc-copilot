import { PlusIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { FieldAggregation, OperatorCatalogResponse, SchemaColumnResponse, VerificationItemRequest } from '@/types/config'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'

import { FieldAssertionEditor } from './FieldAssertionEditor'
import { AGGREGATION_LABELS, createFieldAssertion } from './verification-form'

interface FieldAssertionGroupEditorProps {
  item: VerificationItemRequest
  responseFields: string[]
  columns: SchemaColumnResponse[]
  operators: OperatorCatalogResponse[]
  onChange: (item: VerificationItemRequest) => void
}

export function FieldAssertionGroupEditor({
  item,
  responseFields,
  columns,
  operators,
  onChange,
}: FieldAssertionGroupEditorProps): ReactElement {
  const assertions = item.fieldAssertions ?? []

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...item, ...patch })
  }

  function updateAssertion(index: number, nextAssertion: typeof assertions[number]): void {
    patchItem({
      fieldAssertions: assertions.map((assertion, currentIndex) =>
        currentIndex === index ? nextAssertion : assertion,
      ),
    })
  }

  function removeAssertion(index: number): void {
    patchItem({
      fieldAssertions: assertions.filter((_, currentIndex) => currentIndex !== index),
    })
  }

  function addAssertion(): void {
    patchItem({
      fieldAssertions: [...assertions, createFieldAssertion(assertions.length)],
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[220px_160px_1fr]">
        <Field>
          <FieldLabel className="text-xs font-semibold">Cách tính nhóm</FieldLabel>
          <Select
            value={item.aggregation ?? 'ALL'}
            onValueChange={(aggregation) => patchItem({ aggregation: aggregation as FieldAggregation })}
          >
            <SelectTrigger className="h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AGGREGATION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {item.aggregation === 'AT_LEAST' ? (
          <Field>
            <FieldLabel className="text-xs font-semibold">Số điều kiện tối thiểu</FieldLabel>
            <Input
              type="number"
              min="1"
              max={Math.max(assertions.length, 1)}
              value={item.minPassCount ?? 1}
              onChange={(event) => patchItem({ minPassCount: Number(event.target.value) })}
              className="h-9 rounded-lg"
            />
          </Field>
        ) : null}
      </div>

      <div className="space-y-3">
        {assertions.map((assertion, index) => (
          <FieldAssertionEditor
            key={assertion.publicId ?? `assertion-${index}`}
            assertion={assertion}
            responseFields={responseFields}
            columns={columns}
            operators={operators}
            compact
            removable={assertions.length > 1}
            onChange={(nextAssertion) => updateAssertion(index, nextAssertion)}
            onRemove={() => removeAssertion(index)}
          />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={addAssertion}>
        <PlusIcon className="size-4" />
        Thêm điều kiện con
      </Button>
    </div>
  )
}
