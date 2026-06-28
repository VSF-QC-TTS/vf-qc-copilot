import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  CircleIcon,
  GaugeIcon,
  Layers3Icon,
  ListChecksIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  FieldAssertionRequest,
  OperatorCatalogResponse,
  SchemaColumnResponse,
  VerificationItemRequest,
  VerificationItemType,
  VerificationMode,
} from '@/types/config'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'

import { VerificationSkeleton } from '../../components/VerificationSkeleton'
import {
  useOperatorCatalog,
  useResponseFields,
  useSaveVerificationConfig,
  useVerificationConfig,
} from '../../hooks/use-verification-config'
import { useProjectSchema } from '../../hooks/use-project-schema'
import { FieldAssertionEditor } from '../../components/verification/FieldAssertionEditor'
import { FieldAssertionGroupEditor } from '../../components/verification/FieldAssertionGroupEditor'
import { LlmJudgeEditor } from '../../components/verification/LlmJudgeEditor'
import { VerificationSummary } from '../../components/verification/VerificationSummary'
import {
  createFieldItem,
  createGroupItem,
  createLlmItem,
  ITEM_TYPE_LABELS,
  normalizeResponseItem,
  prepareSubmitValues,
  validateVerificationForm,
  type VerificationFormValues,
} from '../../components/verification/verification-form'

const EMPTY_FORM_VALUES: VerificationFormValues = {
  mode: 'FIELD_CHECKS',
  threshold: 0.8,
  items: [],
}

const FALLBACK_OPERATORS: OperatorCatalogResponse[] = [
  makeOperator('EQUALS', 'Bằng', 'So khớp chính xác', 'TEXT', true),
  makeOperator('NOT_EQUALS', 'Khác', 'Giá trị thực tế khác kỳ vọng', 'TEXT', true),
  makeOperator('CONTAINS', 'Chứa', 'Giá trị thực tế chứa kỳ vọng', 'TEXT', true),
  makeOperator('NOT_CONTAINS', 'Không chứa', 'Giá trị thực tế không chứa kỳ vọng', 'TEXT', true),
  makeOperator('REGEX', 'Regex', 'Giá trị thực tế khớp biểu thức chính quy', 'TEXT', true),
  makeOperator('GREATER_THAN', 'Lớn hơn', 'So sánh số lớn hơn kỳ vọng', 'NUMBER', true),
  makeOperator('GREATER_THAN_OR_EQUALS', 'Lớn hơn hoặc bằng', 'So sánh số lớn hơn hoặc bằng kỳ vọng', 'NUMBER', true),
  makeOperator('LESS_THAN', 'Nhỏ hơn', 'So sánh số nhỏ hơn kỳ vọng', 'NUMBER', true),
  makeOperator('LESS_THAN_OR_EQUALS', 'Nhỏ hơn hoặc bằng', 'So sánh số nhỏ hơn hoặc bằng kỳ vọng', 'NUMBER', true),
  makeOperator('NOT_EMPTY', 'Không rỗng', 'Trường có dữ liệu', 'PRESENCE', false, []),
  makeOperator('IS_JSON', 'JSON hợp lệ', 'Giá trị là JSON parse được', 'STRUCTURE', false, []),
]

const TYPE_ICONS: Record<VerificationItemType, typeof ListChecksIcon> = {
  FIELD_ASSERTION: ListChecksIcon,
  FIELD_ASSERTION_GROUP: Layers3Icon,
  LLM_JUDGE: BotIcon,
}

const TYPE_TONE: Record<VerificationItemType, string> = {
  FIELD_ASSERTION: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  FIELD_ASSERTION_GROUP: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  LLM_JUDGE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export function VerificationConfigPage(): ReactElement {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: config, isLoading } = useVerificationConfig(publicId)
  const { data: schemaData } = useProjectSchema(publicId)
  const { data: responseFields } = useResponseFields(publicId)
  const { data: operatorCatalog } = useOperatorCatalog()
  const saveMutation = useSaveVerificationConfig(publicId)

  const [values, setValues] = useState<VerificationFormValues>(EMPTY_FORM_VALUES)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const columns = schemaData?.columns ?? []
  const availableResponseFields = responseFields ?? []
  const operators = operatorCatalog ?? FALLBACK_OPERATORS
  const items = values.items ?? []
  const mode = deriveMode(items, values.mode)
  const selectedItem = items[selectedIndex] ?? null
  const selectedProblems = useMemo(
    () => (selectedItem ? getItemProblems(selectedItem, operators) : []),
    [operators, selectedItem],
  )

  useEffect(() => {
    if (!config) {
      return
    }
    const nextItems = config.items.map(normalizeResponseItem)
    setValues({
      mode: deriveMode(nextItems, config.mode),
      threshold: config.threshold,
      items: nextItems,
    })
    setSelectedIndex(0)
    setValidationErrors([])
  }, [config])

  function updateValues(patch: Partial<VerificationFormValues>): void {
    setValues((current) => {
      const nextItems = patch.items ?? current.items ?? []
      return {
        ...current,
        ...patch,
        mode: deriveMode(nextItems, patch.mode ?? current.mode),
      }
    })
  }

  function addItem(item: VerificationItemRequest): void {
    setValues((current) => {
      const nextItems = [...(current.items ?? []), item]
      setSelectedIndex(nextItems.length - 1)
      return { ...current, mode: deriveMode(nextItems, current.mode), items: nextItems }
    })
  }

  function updateItem(index: number, item: VerificationItemRequest): void {
    updateValues({
      items: items.map((currentItem, currentIndex) => (currentIndex === index ? item : currentItem)),
    })
  }

  function removeItem(index: number): void {
    const nextItems = items.filter((_, currentIndex) => currentIndex !== index)
    updateValues({ items: nextItems })
    setSelectedIndex(Math.max(0, Math.min(index, nextItems.length - 1)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const submitValues = prepareSubmitValues({ ...values, mode })
    const errors = validateVerificationForm(submitValues, operators)
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error('Checklist verification chưa hợp lệ')
      return
    }
    saveMutation.mutate(submitValues)
  }

  if (isLoading) {
    return <VerificationSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 lg:p-6">
      <VerificationCommandBar
        mode={mode}
        threshold={values.threshold}
        itemCount={items.length}
        enabledCount={items.filter((item) => item.enabled).length}
        criticalCount={items.filter((item) => item.critical).length}
        isSaving={saveMutation.isPending}
        onThresholdChange={(threshold) => updateValues({ threshold })}
        onAddField={() => addItem(createFieldItem(items.length))}
        onAddGroup={() => addItem(createGroupItem(items.length))}
        onAddLlm={() => addItem(createLlmItem(items.length))}
      />

      {validationErrors.length > 0 ? <ValidationAlert errors={validationErrors} /> : null}

      <div className="grid min-h-[calc(100dvh-180px)] gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        <ChecklistPanel
          items={items}
          selectedIndex={selectedIndex}
          operators={operators}
          onSelect={setSelectedIndex}
          onAddField={() => addItem(createFieldItem(items.length))}
          onAddGroup={() => addItem(createGroupItem(items.length))}
          onAddLlm={() => addItem(createLlmItem(items.length))}
        />

        <RuleEditorPanel
          item={selectedItem}
          itemIndex={selectedIndex}
          responseFields={availableResponseFields}
          columns={columns}
          operators={operators}
          problems={selectedProblems}
          onChange={(item) => updateItem(selectedIndex, item)}
          onRemove={() => removeItem(selectedIndex)}
        />

        <PreviewPanel
          mode={mode}
          values={{ ...values, mode }}
          columns={columns}
          responseFields={availableResponseFields}
          selectedItem={selectedItem}
          selectedProblems={selectedProblems}
        />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Mode tự động: <span className="font-semibold text-foreground">{modeLabel(mode)}</span>
          </div>
          <Button type="submit" className="h-10 rounded-lg" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
            Lưu checklist verification
          </Button>
        </div>
      </div>
    </form>
  )
}

interface VerificationCommandBarProps {
  mode: VerificationMode
  threshold: number
  itemCount: number
  enabledCount: number
  criticalCount: number
  isSaving: boolean
  onThresholdChange: (threshold: number) => void
  onAddField: () => void
  onAddGroup: () => void
  onAddLlm: () => void
}

function VerificationCommandBar({
  mode,
  threshold,
  itemCount,
  enabledCount,
  criticalCount,
  isSaving,
  onThresholdChange,
  onAddField,
  onAddGroup,
  onAddLlm,
}: VerificationCommandBarProps): ReactElement {
  return (
    <Card className="overflow-hidden rounded-lg border shadow-sm">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-foreground text-background">
              <ShieldCheckIcon data-icon="inline-start" />
              Verification checklist
            </Badge>
            <Badge variant="outline">{modeLabel(mode)}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Bộ tiêu chí chấm chatbot</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            QC thêm các tiêu chí như checklist nghiệp vụ; hệ thống tự đổi sang field checks, AI judge hoặc combined.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Signal label="Rules" value={itemCount} />
            <Signal label="Đang bật" value={enabledCount} />
            <Signal label="Bắt buộc" value={criticalCount} />
          </div>
        </div>

        <div className="grid gap-3 lg:min-w-[420px]">
          <Field>
            <FieldLabel className="text-xs font-semibold">Ngưỡng pass tổng</FieldLabel>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(event) => onThresholdChange(Number(event.target.value))}
              className="h-10 rounded-lg"
              disabled={isSaving}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onAddField}>
              <ListChecksIcon className="size-4" />
              So khớp
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onAddGroup}>
              <Layers3Icon className="size-4" />
              Nhóm
            </Button>
            <Button type="button" className="h-10 rounded-lg" onClick={onAddLlm}>
              <BotIcon className="size-4" />
              AI Judge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ChecklistPanelProps {
  items: VerificationItemRequest[]
  selectedIndex: number
  operators: OperatorCatalogResponse[]
  onSelect: (index: number) => void
  onAddField: () => void
  onAddGroup: () => void
  onAddLlm: () => void
}

function ChecklistPanel({
  items,
  selectedIndex,
  operators,
  onSelect,
  onAddField,
  onAddGroup,
  onAddLlm,
}: ChecklistPanelProps): ReactElement {
  return (
    <Card className="rounded-lg shadow-sm xl:sticky xl:top-16 xl:h-[calc(100dvh-190px)]">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-base">Checklist</CardTitle>
        <CardDescription>{items.length} tiêu chí đang cấu hình</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full min-h-0 flex-col gap-3 p-3">
        {items.length === 0 ? (
          <Empty className="rounded-lg border border-dashed p-6">
            <EmptyHeader>
              <EmptyTitle>Chưa có tiêu chí</EmptyTitle>
              <EmptyDescription>Thêm rule so khớp hoặc AI Judge để bắt đầu.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
            {items.map((item, index) => (
              <ChecklistItem
                key={item.publicId ?? `${item.type}-${index}`}
                item={item}
                index={index}
                active={index === selectedIndex}
                problemCount={getItemProblems(item, operators).length}
                onClick={() => onSelect(index)}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={onAddField}>
            <PlusIcon className="size-3.5" />
            Rule
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={onAddGroup}>
            <PlusIcon className="size-3.5" />
            Group
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg" onClick={onAddLlm}>
            <PlusIcon className="size-3.5" />
            AI
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ChecklistItemProps {
  item: VerificationItemRequest
  index: number
  active: boolean
  problemCount: number
  onClick: () => void
}

function ChecklistItem({ item, index, active, problemCount, onClick }: ChecklistItemProps): ReactElement {
  const TypeIcon = TYPE_ICONS[item.type]
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-lg border p-3 text-left transition-colors',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-background hover:bg-muted/40',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${TYPE_TONE[item.type]}`}>
          <TypeIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
            {item.enabled ? (
              <CheckCircle2Icon className="size-3.5 text-emerald-600" />
            ) : (
              <CircleIcon className="size-3.5 text-muted-foreground" />
            )}
            {problemCount > 0 ? <Badge variant="destructive">{problemCount}</Badge> : null}
          </div>
          <div className="mt-1 truncate text-sm font-semibold">{item.name || 'Chưa đặt tên'}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline">{ITEM_TYPE_LABELS[item.type]}</Badge>
            {item.critical ? <Badge variant="destructive">Required</Badge> : null}
            <Badge variant="secondary">w {item.weight}</Badge>
          </div>
        </div>
      </div>
    </button>
  )
}

interface RuleEditorPanelProps {
  item: VerificationItemRequest | null
  itemIndex: number
  responseFields: string[]
  columns: SchemaColumnResponse[]
  operators: OperatorCatalogResponse[]
  problems: string[]
  onChange: (item: VerificationItemRequest) => void
  onRemove: () => void
}

function RuleEditorPanel({
  item,
  itemIndex,
  responseFields,
  columns,
  operators,
  problems,
  onChange,
  onRemove,
}: RuleEditorPanelProps): ReactElement {
  if (!item) {
    return (
      <Card className="rounded-lg shadow-sm">
        <CardContent className="grid min-h-[420px] place-items-center p-8">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chọn hoặc thêm tiêu chí</EmptyTitle>
              <EmptyDescription>Panel này dùng để chỉnh chi tiết rule đang chọn.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  const currentItem = item

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...currentItem, ...patch })
  }

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={TYPE_TONE[currentItem.type]}>
                {ITEM_TYPE_LABELS[currentItem.type]}
              </Badge>
              <Badge variant="outline">Rule #{itemIndex + 1}</Badge>
              {problems.length === 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Ready</Badge>
              ) : (
                <Badge variant="destructive">{problems.length} cần sửa</Badge>
              )}
            </div>
            <Input
              value={currentItem.name}
              onChange={(event) => patchItem({ name: event.target.value })}
              className="mt-3 h-11 rounded-lg border-transparent bg-muted/40 px-3 text-lg font-semibold shadow-none focus-visible:border-input"
              placeholder="Tên tiêu chí..."
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[120px_140px_120px_auto]">
            <Field>
              <FieldLabel className="text-xs font-semibold">Weight</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={currentItem.weight}
                onChange={(event) => patchItem({ weight: Number(event.target.value) })}
                className="h-9 rounded-lg"
              />
            </Field>
            {currentItem.type === 'LLM_JUDGE' ? (
              <Field>
                <FieldLabel className="text-xs font-semibold">Threshold</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentItem.threshold ?? 0.7}
                  onChange={(event) => patchItem({ threshold: Number(event.target.value) })}
                  className="h-9 rounded-lg"
                />
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
            <ToggleBox label="Required" checked={currentItem.critical} onChange={(critical) => patchItem({ critical })} />
            <div className="flex items-end gap-2">
              <ToggleBox label="Bật" checked={currentItem.enabled} onChange={(enabled) => patchItem({ enabled })} />
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

      <CardContent className="space-y-5 p-5">
        {problems.length > 0 ? <InlineProblems problems={problems} /> : null}
        {currentItem.type === 'FIELD_ASSERTION' && currentItem.fieldAssertion ? (
          <FieldAssertionEditor
            assertion={currentItem.fieldAssertion}
            responseFields={responseFields}
            columns={columns}
            operators={operators}
            onChange={(fieldAssertion) => patchItem({ fieldAssertion })}
          />
        ) : null}
        {currentItem.type === 'FIELD_ASSERTION_GROUP' ? (
          <FieldAssertionGroupEditor
            item={currentItem}
            responseFields={responseFields}
            columns={columns}
            operators={operators}
            onChange={onChange}
          />
        ) : null}
        {currentItem.type === 'LLM_JUDGE' ? (
          <LlmJudgeEditor item={currentItem} responseFields={responseFields} columns={columns} onChange={onChange} />
        ) : null}
      </CardContent>
    </Card>
  )
}

function ToggleBox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}): ReactElement {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border px-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="whitespace-nowrap text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

interface PreviewPanelProps {
  mode: VerificationMode
  values: VerificationFormValues
  columns: SchemaColumnResponse[]
  responseFields: string[]
  selectedItem: VerificationItemRequest | null
  selectedProblems: string[]
}

function PreviewPanel({
  mode,
  values,
  columns,
  responseFields,
  selectedItem,
  selectedProblems,
}: PreviewPanelProps): ReactElement {
  const items = values.items ?? []
  const enabledItems = items.filter((item) => item.enabled)
  const responseCoverage = new Set<string>()
  const datasetCoverage = new Set<string>()
  for (const item of enabledItems) {
    collectCoverage(item, responseCoverage, datasetCoverage)
  }

  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-16 xl:h-[calc(100dvh-190px)] xl:overflow-auto">
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GaugeIcon className="size-4" />
            Run preview
          </CardTitle>
          <CardDescription>Góc nhìn khi QC đọc kết quả test.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Overall</span>
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Sample</Badge>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div>
                <div className="text-3xl font-semibold">{Math.round(values.threshold * 100)}%</div>
                <div className="text-xs text-muted-foreground">ngưỡng pass tổng</div>
              </div>
              <ArrowRightIcon className="mb-2 size-5 text-muted-foreground" />
            </div>
          </div>
          <VerificationSummary items={enabledItems} threshold={values.threshold} />
          <div className="grid grid-cols-2 gap-2">
            <CoverageBox label="Response fields" value={responseCoverage.size} total={responseFields.length} />
            <CoverageBox label="Dataset refs" value={datasetCoverage.size} total={columns.length} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SparklesIcon className="size-4" />
            Rule đang chọn
          </CardTitle>
          <CardDescription>{modeLabel(mode)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {selectedItem ? (
            <SelectedRulePreview item={selectedItem} columns={columns} problems={selectedProblems} />
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Chưa chọn rule.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SelectedRulePreview({
  item,
  columns,
  problems,
}: {
  item: VerificationItemRequest
  columns: SchemaColumnResponse[]
  problems: string[]
}): ReactElement {
  if (problems.length > 0) {
    return <InlineProblems problems={problems} />
  }
  if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion) {
    return <AssertionSentence assertion={item.fieldAssertion} columns={columns} />
  }
  if (item.type === 'FIELD_ASSERTION_GROUP') {
    return (
      <div className="space-y-2">
        {(item.fieldAssertions ?? []).map((assertion, index) => (
          <AssertionSentence key={assertion.publicId ?? `preview-${index}`} assertion={assertion} columns={columns} />
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="text-sm font-semibold">{item.name}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{item.rubric}</div>
      <div className="space-y-1">
        {(item.criteria ?? []).map((criterion) => (
          <div key={criterion.publicId ?? criterion.name} className="flex items-center gap-2 text-xs">
            <CheckCircle2Icon className="size-3.5 text-emerald-600" />
            <span>{criterion.name || 'Unnamed criterion'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssertionSentence({
  assertion,
  columns,
}: {
  assertion: FieldAssertionRequest
  columns: SchemaColumnResponse[]
}): ReactElement {
  const expected = assertion.expected
  const columnName =
    expected?.source === 'DATASET_COLUMN'
      ? columns.find((column) => column.publicId === expected.columnKey)?.columnName ?? 'dataset column'
      : 'dataset column'

  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
      <div className="font-mono text-xs text-muted-foreground">response.{assertion.actualPath || '?'}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{assertion.operator}</Badge>
        <ArrowRightIcon className="size-4 text-muted-foreground" />
        <span className="font-medium">{columnName}</span>
      </div>
    </div>
  )
}

function InlineProblems({ problems }: { problems: string[] }): ReactElement {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="size-4" />
      <AlertTitle>Cần sửa trước khi lưu</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function ValidationAlert({ errors }: { errors: string[] }): ReactElement {
  return <InlineProblems problems={errors} />
}

function Signal({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

function CoverageBox({ label, value, total }: { label: string; value: number; total: number }): ReactElement {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">
        {value}<span className="text-xs font-normal text-muted-foreground">/{total}</span>
      </div>
    </div>
  )
}

function deriveMode(items: VerificationItemRequest[], fallback: VerificationMode): VerificationMode {
  const hasField = items.some((item) => item.type === 'FIELD_ASSERTION' || item.type === 'FIELD_ASSERTION_GROUP')
  const hasLlm = items.some((item) => item.type === 'LLM_JUDGE')
  if (hasField && hasLlm) {
    return 'COMBINED'
  }
  if (hasLlm) {
    return 'LLM_JUDGE'
  }
  if (hasField) {
    return 'FIELD_CHECKS'
  }
  return fallback
}

function modeLabel(mode: VerificationMode): string {
  if (mode === 'COMBINED') {
    return 'Kết hợp'
  }
  if (mode === 'LLM_JUDGE') {
    return 'AI Judge'
  }
  return 'So khớp dữ liệu'
}

function getItemProblems(item: VerificationItemRequest, operators: OperatorCatalogResponse[]): string[] {
  const errors: string[] = []
  if (!item.name.trim()) {
    errors.push('Thiếu tên tiêu chí.')
  }
  if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion) {
    validateAssertionPreview(item.fieldAssertion, operators, errors)
  }
  if (item.type === 'FIELD_ASSERTION_GROUP') {
    const assertions = item.fieldAssertions ?? []
    if (assertions.filter((assertion) => assertion.enabled).length === 0) {
      errors.push('Nhóm cần ít nhất một điều kiện đang bật.')
    }
    for (const assertion of assertions) {
      validateAssertionPreview(assertion, operators, errors)
    }
  }
  if (item.type === 'LLM_JUDGE') {
    if ((item.targetPaths ?? []).length === 0) {
      errors.push('AI Judge cần chọn ít nhất một trường response.')
    }
    if (!item.rubric?.trim()) {
      errors.push('AI Judge cần rubric.')
    }
    if ((item.criteria ?? []).filter((criterion) => criterion.enabled).length === 0) {
      errors.push('AI Judge cần ít nhất một tiêu chí đang bật.')
    }
  }
  return [...new Set(errors)]
}

function validateAssertionPreview(
  assertion: FieldAssertionRequest,
  operators: OperatorCatalogResponse[],
  errors: string[],
): void {
  if (!assertion.enabled) {
    return
  }
  if (!assertion.actualPath.trim()) {
    errors.push('Rule cần chọn trường response.')
  }
  const operator = operators.find((item) => item.operator === assertion.operator)
  const requiresExpected = operator?.requiresExpected ?? !['NOT_EMPTY', 'IS_JSON'].includes(assertion.operator)
  if (!requiresExpected) {
    errors.push('Rule phải so sánh với một cột dataset.')
    return
  }
  if (!assertion.expected) {
    errors.push('Rule cần dữ liệu kỳ vọng.')
    return
  }
  if (assertion.expected.source !== 'DATASET_COLUMN') {
    errors.push('Rule chỉ được so với cột dataset.')
    return
  }
  if (assertion.expected.source === 'DATASET_COLUMN' && !assertion.expected.columnKey) {
    errors.push('Rule cần chọn cột dataset.')
  }
}

function collectCoverage(
  item: VerificationItemRequest,
  responseCoverage: Set<string>,
  datasetCoverage: Set<string>,
): void {
  if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion) {
    collectAssertionCoverage(item.fieldAssertion, responseCoverage, datasetCoverage)
  }
  if (item.type === 'FIELD_ASSERTION_GROUP') {
    for (const assertion of item.fieldAssertions ?? []) {
      collectAssertionCoverage(assertion, responseCoverage, datasetCoverage)
    }
  }
  if (item.type === 'LLM_JUDGE') {
    for (const path of item.targetPaths ?? []) {
      responseCoverage.add(path)
    }
    for (const key of item.referenceColumnKeys ?? []) {
      datasetCoverage.add(key)
    }
  }
}

function collectAssertionCoverage(
  assertion: FieldAssertionRequest,
  responseCoverage: Set<string>,
  datasetCoverage: Set<string>,
): void {
  if (assertion.actualPath) {
    responseCoverage.add(assertion.actualPath)
  }
  if (assertion.expected?.source === 'DATASET_COLUMN' && assertion.expected.columnKey) {
    datasetCoverage.add(assertion.expected.columnKey)
  }
}

function makeOperator(
  operator: OperatorCatalogResponse['operator'],
  displayName: string,
  description: string,
  category: OperatorCatalogResponse['category'],
  requiresExpected: boolean,
  supportedExpectedSources: OperatorCatalogResponse['supportedExpectedSources'] = ['DATASET_COLUMN'],
): OperatorCatalogResponse {
  return { operator, displayName, description, category, requiresExpected, supportedExpectedSources }
}
