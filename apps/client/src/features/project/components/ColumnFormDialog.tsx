import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import type { DatasetColumnResponse, CreateColumnRequest, UpdateColumnRequest, ColumnDataType, ColumnRole } from '@/types/config'

interface ColumnFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingColumn: DatasetColumnResponse | null
  onCreateColumn: (data: CreateColumnRequest) => void
  onUpdateColumn: (data: { columnId: string; payload: UpdateColumnRequest }) => void
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
    displayName: z.string().optional(),
    dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
    role: z.enum(['INPUT', 'EXPECTED_OUTPUT', 'CONTEXT', 'METADATA']),
    required: z.boolean().default(false),
    description: z.string().optional(),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: editingColumn
      ? {
          columnName: editingColumn.columnName,
          displayName: editingColumn.displayName || '',
          dataType: editingColumn.dataType,
          role: editingColumn.role,
          required: editingColumn.required,
          description: editingColumn.description || '',
        }
      : {
          columnName: '',
          displayName: '',
          dataType: 'STRING' as const,
          role: 'INPUT' as const,
          required: false,
          description: '',
        },
  })

  const { control, handleSubmit } = form

  const onSubmit = (values: FormData) => {
    if (editingColumn) {
      onUpdateColumn({
        columnId: editingColumn.publicId,
        payload: {
          displayName: values.displayName || null,
          dataType: values.dataType as ColumnDataType,
          role: values.role as ColumnRole,
          required: values.required,
          description: values.description || null,
          displayOrder: editingColumn.displayOrder,
        },
      })
    } else {
      onCreateColumn({
        columnName: values.columnName,
        displayName: values.displayName || null,
        dataType: values.dataType as ColumnDataType,
        role: values.role as ColumnRole,
        required: values.required,
        description: values.description || null,
      })
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
                  <Input {...field} disabled={!!editingColumn} aria-invalid={!!fieldState.error} placeholder="VD: text_input" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="displayName"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>{t('config.schema.displayName', { ns: 'project' })}</FieldLabel>
                  <Input {...field} aria-invalid={!!fieldState.error} placeholder="VD: User Request Text" />
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
                        <SelectGroup>
                          {(['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const).map((dt) => (
                            <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                          ))}
                        </SelectGroup>
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
                        <SelectGroup>
                          <SelectItem value="INPUT">{t('config.schema.roleInput', { ns: 'project' })}</SelectItem>
                          <SelectItem value="EXPECTED_OUTPUT">{t('config.schema.roleExpectedOutput', { ns: 'project' })}</SelectItem>
                          <SelectItem value="CONTEXT">{t('config.schema.roleContext', { ns: 'project' })}</SelectItem>
                          <SelectItem value="METADATA">{t('config.schema.roleMetadata', { ns: 'project' })}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <Field orientation="horizontal" className="items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FieldLabel>{t('config.schema.required', { ns: 'project' })}</FieldLabel>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>{t('config.schema.descriptionLabel', { ns: 'project' })}</FieldLabel>
                  <Textarea {...field} aria-invalid={!!fieldState.error} />
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
