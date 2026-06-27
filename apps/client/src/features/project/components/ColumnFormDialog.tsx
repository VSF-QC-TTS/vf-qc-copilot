import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { SchemaColumnResponse, CreateSchemaColumnRequest, UpdateSchemaColumnRequest } from '@/types/config'

interface ColumnFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingColumn: SchemaColumnResponse | null
  onCreateColumn: (data: CreateSchemaColumnRequest) => void
  onUpdateColumn: (data: { columnId: string; payload: UpdateSchemaColumnRequest }) => void
  isPending: boolean
}

export function ColumnFormDialog({
  open,
  onOpenChange,
  editingColumn,
  onCreateColumn,
  onUpdateColumn,
  isPending,
}: ColumnFormDialogProps) {
  const { t } = useTranslation(['project', 'validation'])

  const schema = z.object({
    columnName: z.string().min(1, t('validation.not-blank', { ns: 'validation' })),
    dataType: z.string().min(1, t('validation.not-blank', { ns: 'validation' })),
    role: z.string().min(1, t('validation.not-blank', { ns: 'validation' })),
    sampleValue: z.string().optional(),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: editingColumn
      ? {
          columnName: editingColumn.columnName,
          dataType: editingColumn.dataType || 'STRING',
          role: editingColumn.role || 'EXPECTED',
          sampleValue: editingColumn.sampleValue || '',
        }
      : {
          columnName: '',
          dataType: 'STRING',
          role: 'EXPECTED',
          sampleValue: '',
        },
  })

  const { control, handleSubmit } = form

  const onSubmit = (values: FormData) => {
    const payload = {
      columnName: values.columnName,
      dataType: values.dataType,
      role: values.role,
      sampleValue: values.sampleValue || null,
    }

    if (editingColumn) {
      onUpdateColumn({
        columnId: editingColumn.publicId,
        payload,
      })
    } else {
      onCreateColumn(payload)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingColumn ? t('config.schema.editColumn', { ns: 'project' }) : t('config.schema.addColumn', { ns: 'project' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="mt-4 gap-6">
            <Controller
              control={control}
              name="columnName"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>{t('config.schema.columnName', { ns: 'project' })}</FieldLabel>
                  <Input {...field} aria-invalid={!!fieldState.error} placeholder="VD: text_input" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="dataType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>{t('config.schema.dataType', { ns: 'project' })}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!fieldState.error}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STRING">text</SelectItem>
                        <SelectItem value="NUMBER">number</SelectItem>
                        <SelectItem value="BOOLEAN">boolean</SelectItem>
                        <SelectItem value="ENUM">enum</SelectItem>
                        <SelectItem value="JSON">json</SelectItem>
                        <SelectItem value="ARRAY">array</SelectItem>
                        <SelectItem value="OBJECT">object</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="role"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>{t('config.schema.role', { ns: 'project' })}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!fieldState.error}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INPUT">Input</SelectItem>
                        <SelectItem value="EXPECTED">expected</SelectItem>
                        <SelectItem value="CONTEXT">context</SelectItem>
                        <SelectItem value="EVALUATION_PARAM">evaluation_param</SelectItem>
                        <SelectItem value="METADATA">metadata</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="sampleValue"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>Giá trị mẫu</FieldLabel>
                  <Input {...field} aria-invalid={!!fieldState.error} placeholder="VD: Tôi muốn hủy đơn #A1029" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="active:scale-[0.98] transition-transform">
              {t('common.cancel', { ns: 'project' })}
            </Button>
            <Button type="submit" disabled={isPending} className="active:scale-[0.98] transition-transform">
              {isPending && <Spinner data-icon="inline-start" />}
              {t('common.save', { ns: 'project' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
