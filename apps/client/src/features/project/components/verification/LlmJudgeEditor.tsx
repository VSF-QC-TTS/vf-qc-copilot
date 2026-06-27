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

  function appendRubricToken(token: string): void {
    patchItem({ rubric: `${item.rubric ?? ''} ${token}` })
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
      <Field>
        <FieldLabel className="text-xs font-semibold">Trường response cần chấm</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {responseFields.length > 0 ? (
            responseFields.map((path) => {
              const selected = targetPaths.includes(path)
              return (
                <Button
                  key={path}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 rounded-full px-3 font-mono text-[11px]"
                  onClick={() => toggleTargetPath(path)}
                >
                  {path}
                </Button>
              )
            })
          ) : (
            <Badge variant="outline" className="rounded-full">
              Chưa có response fields
            </Badge>
          )}
        </div>
      </Field>

      <Field>
        <FieldLabel className="text-xs font-semibold">Cột dataset tham chiếu</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((column) => {
            const selected = referenceColumnKeys.includes(column.publicId)
            return (
              <Button
                key={column.publicId}
                type="button"
                variant={selected ? 'default' : 'outline'}
                size="sm"
                className="h-8 rounded-full px-3 text-[11px]"
                onClick={() => toggleReferenceColumn(column.publicId)}
              >
                {column.columnName}
              </Button>
            )
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel className="text-xs font-semibold">Rubric chung</FieldLabel>
        <Textarea
          value={item.rubric ?? ''}
          onChange={(event) => patchItem({ rubric: event.target.value })}
          className="min-h-[118px] rounded-lg font-mono text-xs"
          placeholder="Mô tả cách AI Judge nên chấm câu trả lời..."
        />
        <div className="flex flex-wrap gap-1.5">
          {targetPaths.map((path) => (
            <Button
              key={path}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2 font-mono text-[11px]"
              onClick={() => appendRubricToken(`{{response.${path}}}`)}
            >
              {`{{response.${path}}}`}
            </Button>
          ))}
          {columns
            .filter((column) => referenceColumnKeys.includes(column.publicId))
            .map((column) => (
              <Button
                key={column.publicId}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2 font-mono text-[11px]"
                onClick={() => appendRubricToken(`{{${column.columnName}}}`)}
              >
                {`{{${column.columnName}}}`}
              </Button>
            ))}
        </div>
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Tiêu chí chấm độc lập</h4>
            <p className="text-xs text-muted-foreground">
              Mỗi tiêu chí sẽ có kết quả pass hoặc fail riêng.
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
