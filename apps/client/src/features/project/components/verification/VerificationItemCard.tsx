import { BrainCircuitIcon, ListChecksIcon, TrashIcon, Rows3Icon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { OperatorCatalogResponse, SchemaColumnResponse, VerificationItemRequest, VerificationItemType } from '@/types/config'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'

import { FieldAssertionEditor } from './FieldAssertionEditor'
import { FieldAssertionGroupEditor } from './FieldAssertionGroupEditor'
import { LlmJudgeEditor } from './LlmJudgeEditor'
import { ITEM_TYPE_LABELS } from './verification-form'

interface VerificationItemCardProps {
  item: VerificationItemRequest
  responseFields: string[]
  columns: SchemaColumnResponse[]
  operators: OperatorCatalogResponse[]
  onChange: (item: VerificationItemRequest) => void
  onRemove: () => void
}

const TYPE_ICONS: Record<VerificationItemType, typeof ListChecksIcon> = {
  FIELD_ASSERTION: ListChecksIcon,
  FIELD_ASSERTION_GROUP: Rows3Icon,
  LLM_JUDGE: BrainCircuitIcon,
}

export function VerificationItemCard({
  item,
  responseFields,
  columns,
  operators,
  onChange,
  onRemove,
}: VerificationItemCardProps): ReactElement {
  const TypeIcon = TYPE_ICONS[item.type]

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...item, ...patch })
  }

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                <TypeIcon className="size-3.5" />
                {ITEM_TYPE_LABELS[item.type]}
              </Badge>
              {item.critical ? (
                <Badge variant="outline" className="rounded-full border-destructive/40 text-destructive">
                  Critical
                </Badge>
              ) : null}
            </div>
            <Input
              value={item.name}
              onChange={(event) => patchItem({ name: event.target.value })}
              className="h-9 rounded-lg border-transparent bg-muted/40 px-2 text-sm font-semibold shadow-none focus-visible:border-input"
              placeholder="Tên tiêu chí..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[120px_130px_130px_auto]">
            <Field>
              <FieldLabel className="text-xs font-semibold">Mức ảnh hưởng</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={item.weight}
                onChange={(event) => patchItem({ weight: Number(event.target.value) })}
                className="h-9 rounded-lg"
              />
            </Field>

            {item.type === 'LLM_JUDGE' ? (
              <Field>
                <FieldLabel className="text-xs font-semibold">Ngưỡng đạt</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={item.threshold ?? 0.7}
                  onChange={(event) => patchItem({ threshold: Number(event.target.value) })}
                  className="h-9 rounded-lg"
                />
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-end gap-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
                <Switch checked={item.critical} onCheckedChange={(critical) => patchItem({ critical })} />
                <span className="whitespace-nowrap text-xs text-muted-foreground">Bắt buộc đúng</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
                <Switch checked={item.enabled} onCheckedChange={(enabled) => patchItem({ enabled })} />
                <span className="text-xs text-muted-foreground">Bật</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onRemove}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4">
        {item.type === 'FIELD_ASSERTION' && item.fieldAssertion ? (
          <FieldAssertionEditor
            assertion={item.fieldAssertion}
            responseFields={responseFields}
            columns={columns}
            operators={operators}
            onChange={(fieldAssertion) => patchItem({ fieldAssertion })}
          />
        ) : null}

        {item.type === 'FIELD_ASSERTION_GROUP' ? (
          <FieldAssertionGroupEditor
            item={item}
            responseFields={responseFields}
            columns={columns}
            operators={operators}
            onChange={onChange}
          />
        ) : null}

        {item.type === 'LLM_JUDGE' ? (
          <LlmJudgeEditor item={item} responseFields={responseFields} columns={columns} onChange={onChange} />
        ) : null}
      </CardContent>
    </Card>
  )
}
