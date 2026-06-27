import type { ReactElement } from 'react'

import type { ExpectedSource, ExpectedValueRequest, OperatorCatalogResponse, SchemaColumnResponse } from '@/types/config'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'

interface ExpectedValueEditorProps {
  value: ExpectedValueRequest | null | undefined
  operator: OperatorCatalogResponse | undefined
  columns: SchemaColumnResponse[]
  onChange: (value: ExpectedValueRequest | null) => void
}

const SOURCE_LABELS: Record<ExpectedSource, string> = {
  DATASET_COLUMN: 'Dataset',
  STATIC_VALUE: 'Tĩnh',
  TEMPLATE: 'Template',
}

export function ExpectedValueEditor({
  value,
  operator,
  columns,
  onChange,
}: ExpectedValueEditorProps): ReactElement {
  const requiresExpected = operator?.requiresExpected ?? true
  const supportedSources = operator?.supportedExpectedSources ?? ['DATASET_COLUMN', 'STATIC_VALUE', 'TEMPLATE']
  const currentSource = value?.source ?? supportedSources[0] ?? 'DATASET_COLUMN'

  function handleSourceChange(source: string): void {
    onChange({
      source: source as ExpectedSource,
      columnKey: null,
      value: null,
      template: null,
    })
  }

  function patchExpected(patch: Partial<ExpectedValueRequest>): void {
    onChange({
      source: currentSource,
      columnKey: value?.columnKey ?? null,
      value: value?.value ?? null,
      template: value?.template ?? null,
      ...patch,
    })
  }

  function appendTemplateToken(columnName: string): void {
    patchExpected({
      template: `${value?.template ?? ''} {{${columnName}}}`,
    })
  }

  if (!requiresExpected || supportedSources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Toán tử này không cần dữ liệu kỳ vọng.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-[140px_1fr]">
      <Field>
        <FieldLabel className="text-xs font-semibold">Nguồn kỳ vọng</FieldLabel>
        <Select value={currentSource} onValueChange={handleSourceChange}>
          <SelectTrigger className="h-9 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedSources.map((source) => (
              <SelectItem key={source} value={source}>
                {SOURCE_LABELS[source]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {currentSource === 'DATASET_COLUMN' ? (
        <Field>
          <FieldLabel className="text-xs font-semibold">Cột dataset</FieldLabel>
          <Select value={value?.columnKey ?? undefined} onValueChange={(columnKey) => patchExpected({ columnKey })}>
            <SelectTrigger className="h-9 rounded-lg">
              <SelectValue placeholder="Chọn cột dataset..." />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column.publicId} value={column.publicId}>
                  {column.columnName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {currentSource === 'STATIC_VALUE' ? (
        <Field>
          <FieldLabel className="text-xs font-semibold">Giá trị tĩnh</FieldLabel>
          <Input
            value={value?.value ?? ''}
            onChange={(event) => patchExpected({ value: event.target.value })}
            className="h-9 rounded-lg"
            placeholder="Nhập giá trị kỳ vọng..."
          />
        </Field>
      ) : null}

      {currentSource === 'TEMPLATE' ? (
        <Field>
          <FieldLabel className="text-xs font-semibold">Template</FieldLabel>
          <Textarea
            value={value?.template ?? ''}
            onChange={(event) => patchExpected({ template: event.target.value })}
            className="min-h-[82px] rounded-lg font-mono text-xs"
            placeholder="VD: Câu trả lời cần nhắc tới {{expected_answer}}"
          />
          <div className="flex flex-wrap gap-1.5">
            {columns.map((column) => (
              <Button
                key={column.publicId}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2 text-[11px]"
                onClick={() => appendTemplateToken(column.columnName)}
              >
                {`{{${column.columnName}}}`}
              </Button>
            ))}
          </div>
        </Field>
      ) : null}
    </div>
  )
}
