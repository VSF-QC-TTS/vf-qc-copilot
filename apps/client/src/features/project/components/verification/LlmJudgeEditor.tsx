import { PlusIcon, TrashIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { LlmCriterionRequest, SchemaColumnResponse, VerificationItemRequest } from '@/types/config'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'

import { createCriterion } from './verification-form'

interface LlmJudgeEditorProps {
  item: VerificationItemRequest
  responseFields: string[]
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
  const criteria = item.criteria ?? []

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...item, ...patch })
  }

  function toggleTargetPath(path: string): void {
    patchItem({
      targetPaths: targetPaths.includes(path)
        ? targetPaths.filter((itemPath) => itemPath !== path)
        : [...targetPaths, path],
    })
  }

  function toggleReferenceColumn(columnKey: string): void {
    patchItem({
      referenceColumnKeys: referenceColumnKeys.includes(columnKey)
        ? referenceColumnKeys.filter((key) => key !== columnKey)
        : [...referenceColumnKeys, columnKey],
    })
  }

  function appendTokenToPrompt(token: string): string {
    const currentRubric = item.rubric?.trimEnd() ?? ''
    return currentRubric ? `${currentRubric} ${token}` : token
  }

  function insertResponseToken(path: string): void {
    patchItem({
      targetPaths: targetPaths.includes(path) ? targetPaths : [...targetPaths, path],
      rubric: appendTokenToPrompt(`$response.${path}`),
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

  function updateCriterion(index: number, patch: Partial<LlmCriterionRequest>): void {
    patchItem({
      criteria: criteria.map((criterion, currentIndex) =>
        currentIndex === index ? { ...criterion, ...patch } : criterion,
      ),
    })
  }

  function removeCriterion(index: number): void {
    patchItem({ criteria: criteria.filter((_, currentIndex) => currentIndex !== index) })
  }

  function addCriterion(): void {
    patchItem({ criteria: [...criteria, createCriterion(criteria.length)] })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_220px]">
        <TokenRail
          title="Response fields"
          emptyText="Chưa có response fields"
          items={responseFields.map((path) => ({
            key: path,
            label: path,
            token: `$response.${path}`,
            selected: targetPaths.includes(path),
            onInsert: () => insertResponseToken(path),
            onToggle: () => toggleTargetPath(path),
          }))}
        />

        <Field>
          <FieldLabel className="text-xs font-semibold">Prompt chấm điểm</FieldLabel>
          <Textarea
            value={item.rubric ?? ''}
            onChange={(event) => patchItem({ rubric: event.target.value })}
            className="min-h-[260px] rounded-lg font-mono text-xs leading-relaxed"
            placeholder={
              'Bạn là QC/Tester. Dựa vào câu trả lời của bot $response.answer và dữ liệu kỳ vọng $dataset.ground_truth, hãy chấm câu trả lời theo các tiêu chí bên dưới. Trả về điểm và lý do ngắn gọn.'
            }
          />
          <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Bấm token hai bên để chèn nhanh vào prompt. Token được lưu cùng danh sách field tham chiếu.
          </div>
        </Field>

        <TokenRail
          title="Dataset schema"
          emptyText="Chưa có schema columns"
          items={columns.map((column) => ({
            key: column.publicId,
            label: column.columnName,
            token: `$dataset.${column.columnName}`,
            selected: referenceColumnKeys.includes(column.publicId),
            onInsert: () => insertDatasetToken(column),
            onToggle: () => toggleReferenceColumn(column.publicId),
          }))}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Rubric con</h4>
            <p className="text-xs text-muted-foreground">
              Mỗi dòng là một tiêu chí để judge tham chiếu khi cho điểm.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={addCriterion}>
            <PlusIcon className="size-4" />
            Thêm tiêu chí
          </Button>
        </div>

        {criteria.map((criterion, index) => (
          <div key={criterion.publicId ?? `criterion-${index}`} className="rounded-xl border bg-background p-3">
            <div className="grid gap-3 lg:grid-cols-[180px_1fr_120px_auto]">
              <Field>
                <FieldLabel className="text-xs font-semibold">Tên tiêu chí</FieldLabel>
                <Input
                  value={criterion.name}
                  onChange={(event) => updateCriterion(index, { name: event.target.value })}
                  className="h-9 rounded-lg"
                  placeholder="Correctness"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs font-semibold">Mô tả</FieldLabel>
                <Input
                  value={criterion.description}
                  onChange={(event) => updateCriterion(index, { description: event.target.value })}
                  className="h-9 rounded-lg"
                  placeholder="Câu trả lời đúng ý dữ liệu kỳ vọng"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs font-semibold">Mức ảnh hưởng</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={criterion.weight}
                  onChange={(event) => updateCriterion(index, { weight: Number(event.target.value) })}
                  className="h-9 rounded-lg"
                />
              </Field>
              <div className="flex items-end gap-2">
                <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
                  <Switch
                    checked={criterion.enabled}
                    onCheckedChange={(enabled) => updateCriterion(index, { enabled })}
                  />
                  <span className="text-xs text-muted-foreground">Bật</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeCriterion(index)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TokenRailItem {
  key: string
  label: string
  token: string
  selected: boolean
  onInsert: () => void
  onToggle: () => void
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
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        <Badge variant="outline">{items.filter((item) => item.selected).length}</Badge>
      </div>
      <div className="flex max-h-[260px] flex-col gap-2 overflow-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.key}
              className={[
                'rounded-md border bg-background p-2 transition-colors',
                item.selected ? 'border-primary/40 ring-1 ring-primary/15' : '',
              ].join(' ')}
            >
              <button
                type="button"
                className="block w-full truncate text-left font-mono text-xs font-medium"
                onClick={item.onInsert}
              >
                {item.token}
              </button>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted-foreground">{item.label}</span>
                <Button
                  type="button"
                  variant={item.selected ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 rounded-md px-2 text-[11px]"
                  onClick={item.onToggle}
                >
                  {item.selected ? 'Dùng' : 'Chọn'}
                </Button>
              </div>
            </div>
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
