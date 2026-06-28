import type { ReactElement } from 'react'

import type { ResponseFieldExampleResponse, SchemaColumnResponse, VerificationItemRequest } from '@/types/config'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'

interface LlmJudgeEditorProps {
  item: VerificationItemRequest
  responseFields: Array<string | ResponseFieldExampleResponse>
  columns: SchemaColumnResponse[]
  onChange: (item: VerificationItemRequest) => void
}

export function LlmJudgeEditor({
  item,
  responseFields,
  columns,
  onChange,
}: LlmJudgeEditorProps): ReactElement {
  const targetPaths = item.targetPaths ?? []
  const referenceColumnKeys = item.referenceColumnKeys ?? []
  const normalizedResponseFields = responseFields.map(normalizeResponseField)

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...item, ...patch })
  }

  function appendTokenToPrompt(token: string): string {
    const currentRubric = item.rubric?.trimEnd() ?? ''
    return currentRubric ? `${currentRubric} ${token}` : token
  }

  function insertResponseToken(field: ResponseFieldExampleResponse): void {
    patchItem({
      targetPaths: targetPaths.includes(field.path) ? targetPaths : [...targetPaths, field.path],
      rubric: appendTokenToPrompt(toResponseToken(field.path)),
    })
  }

  function insertDatasetToken(column: SchemaColumnResponse): void {
    patchItem({
      referenceColumnKeys: referenceColumnKeys.includes(column.publicId)
        ? referenceColumnKeys
        : [...referenceColumnKeys, column.publicId],
      rubric: appendTokenToPrompt(`$dataset.${column.columnName}`),
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
      <TokenRail
        title="Response field"
        emptyText="Chạy test target để lấy response field."
        items={normalizedResponseFields.map((field) => ({
          key: field.path,
          token: toResponseToken(field.path),
          example: field.example,
          selected: targetPaths.includes(field.path),
          onInsert: () => insertResponseToken(field),
        }))}
      />

      <Field>
        <FieldLabel className="text-xs font-semibold">Prompt LLM Judge</FieldLabel>
        <Textarea
          value={item.rubric ?? ''}
          onChange={(event) => patchItem({ rubric: event.target.value })}
          className="min-h-[360px] rounded-lg font-mono text-xs leading-relaxed"
          placeholder={
            'Bạn là QC/Tester. Dựa vào câu trả lời của bot $response.answer và dữ liệu kỳ vọng $dataset.ground_truth, hãy chấm mức độ đúng nghiệp vụ, đầy đủ ý, đúng tone. Trả về điểm 0-1 và lý do ngắn gọn.'
          }
        />
        <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Bấm token hai bên để chèn vào prompt. Backend lưu prompt này để runner đưa vào LLM Judge.
        </div>
      </Field>

      <TokenRail
        title="Dataset schema"
        emptyText="Chưa có dataset schema."
        items={columns.map((column) => ({
          key: column.publicId,
          token: `$dataset.${column.columnName}`,
          example: column.sampleValue,
          selected: referenceColumnKeys.includes(column.publicId),
          onInsert: () => insertDatasetToken(column),
        }))}
      />
    </div>
  )
}

interface TokenRailItem {
  key: string
  token: string
  example?: string | null
  selected: boolean
  onInsert: () => void
}

function TokenRail({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: TokenRailItem[]
}): ReactElement {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h4>
        <Badge variant="outline">{items.filter((item) => item.selected).length}</Badge>
      </div>
      <div className="flex max-h-[430px] flex-col gap-2 overflow-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={item.selected ? 'default' : 'outline'}
              className="h-auto justify-start rounded-lg px-3 py-2 text-left"
              onClick={item.onInsert}
            >
              <span className="min-w-0">
                <span className="block truncate font-mono text-xs">{item.token}</span>
                {item.example ? (
                  <span className="mt-1 block truncate text-[11px] opacity-70">{item.example}</span>
                ) : null}
              </span>
            </Button>
          ))
        ) : (
          <div className="rounded-md border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

function normalizeResponseField(field: string | ResponseFieldExampleResponse): ResponseFieldExampleResponse {
  return typeof field === 'string' ? { path: field, example: null } : field
}

function toResponseToken(path: string): string {
  if (path.startsWith('$.')) {
    return `$response.${path.slice(2)}`
  }
  if (path.startsWith('$')) {
    return `$response.${path.slice(1)}`
  }
  return `$response.${path}`
}
