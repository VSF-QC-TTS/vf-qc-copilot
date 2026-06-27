import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

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
    description: z.string().optional(),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: editingColumn
      ? {
          columnName: editingColumn.columnName,
          description: editingColumn.description || '',
        }
      : {
          columnName: '',
          description: '',
        },
  })

  const { control, handleSubmit } = form

  const onSubmit = (values: FormData) => {
    if (editingColumn) {
      onUpdateColumn({
        columnId: editingColumn.publicId,
        payload: {
          columnName: values.columnName,
          description: values.description || null,
        },
      })
    } else {
      onCreateColumn({
        columnName: values.columnName,
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
                  <Input {...field} aria-invalid={!!fieldState.error} placeholder="VD: text_input" />
                  <FieldError errors={[fieldState.error]} />
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
