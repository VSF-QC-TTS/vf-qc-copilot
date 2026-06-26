import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface OperatorOption {
  value: string
  label: string
}

interface FieldCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  responseFields: string[]
  expectedColumns: { columnName: string; displayName?: string | null }[]
  operatorOptions: OperatorOption[]
  onSubmit: (data: FieldCheckFormData) => void
  /** If provided, dialog is in edit mode */
  editingCheck?: FieldCheckFormData | null
}

export interface FieldCheckFormData {
  responsePath: string
  operator: string
  expectedSource: 'DATASET_COLUMN' | 'STATIC_VALUE'
  expectedColumn: string | null
  expectedValue: string | null
  threshold: number | null
  weight: number
}

const schema = z.object({
  responsePath: z.string().min(1, 'Chọn response field'),
  operator: z.string().min(1, 'Chọn toán tử'),
  expectedSource: z.enum(['DATASET_COLUMN', 'STATIC_VALUE']),
  expectedColumn: z.string().nullable(),
  expectedValue: z.string().nullable(),
  threshold: z.coerce.number().min(0).max(1).nullable(),
  weight: z.coerce.number().min(0),
})

export function FieldCheckDialog({
  open,
  onOpenChange,
  responseFields,
  expectedColumns,
  operatorOptions,
  onSubmit,
  editingCheck,
}: FieldCheckDialogProps) {
  const isEditing = !!editingCheck

  const form = useForm<FieldCheckFormData>({
    resolver: zodResolver(schema) as any,
    values: editingCheck ?? {
      responsePath: '',
      operator: 'EQUALS',
      expectedSource: 'DATASET_COLUMN' as const,
      expectedColumn: null,
      expectedValue: null,
      threshold: 1.0,
      weight: 1.0,
    },
  })

  const { control, handleSubmit, watch } = form
  const expectedSource = watch('expectedSource')

  const handleFormSubmit = (values: FieldCheckFormData) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Sửa quy tắc' : 'Thêm quy tắc kiểm tra'}</DialogTitle>
          <DialogDescription>
            Chọn trường response cần kiểm tra, toán tử so sánh, và giá trị kỳ vọng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <FieldGroup className="mt-4 gap-5">
            {/* Response Field */}
            <Controller control={control} name="responsePath" render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>Response Field</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!fieldState.error}><SelectValue placeholder="Chọn field..." /></SelectTrigger>
                  <SelectContent>
                    {responseFields.map(f => (
                      <SelectItem key={f} value={f}>
                        <span className="font-mono text-xs">{f}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )} />

            {/* Operator */}
            <Controller control={control} name="operator" render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>Toán tử</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!fieldState.error}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map(op => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )} />

            {/* Expected Source */}
            <Controller control={control} name="expectedSource" render={({ field }) => (
              <Field>
                <FieldLabel>Nguồn giá trị kỳ vọng</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATASET_COLUMN">Cột trong Dataset</SelectItem>
                    <SelectItem value="STATIC_VALUE">Giá trị cố định</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )} />

            {/* Expected Column or Value */}
            {expectedSource === 'DATASET_COLUMN' ? (
              <Controller control={control} name="expectedColumn" render={({ field }) => (
                <Field>
                  <FieldLabel>Cột Dataset</FieldLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Chọn cột..." /></SelectTrigger>
                    <SelectContent>
                      {expectedColumns.map(col => (
                        <SelectItem key={col.columnName} value={col.columnName}>
                          {col.displayName || col.columnName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )} />
            ) : (
              <Controller control={control} name="expectedValue" render={({ field }) => (
                <Field>
                  <FieldLabel>Giá trị kỳ vọng</FieldLabel>
                  <Input {...field} value={field.value || ''} placeholder="e.g. success" />
                </Field>
              )} />
            )}

            {/* Threshold + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <Controller control={control} name="threshold" render={({ field }) => (
                <Field>
                  <FieldLabel>Ngưỡng</FieldLabel>
                  <Input type="number" step="0.1" min="0" max="1" {...field} value={field.value ?? ''} />
                </Field>
              )} />
              <Controller control={control} name="weight" render={({ field }) => (
                <Field>
                  <FieldLabel>Trọng số</FieldLabel>
                  <Input type="number" step="0.1" min="0" {...field} />
                </Field>
              )} />
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">
              {isEditing ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
