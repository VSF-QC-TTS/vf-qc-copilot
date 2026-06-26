import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, TrashIcon, GripVerticalIcon, PencilIcon, TableIcon } from 'lucide-react'

import type { DatasetColumnResponse } from '@/types/config'
import { useDatasetSchema, useCreateColumn, useUpdateColumn, useDeleteColumn } from '../../hooks/use-dataset-schema'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { ColumnFormDialog } from '../../components/ColumnFormDialog'
import { DatasetSchemaSkeleton } from '../../components/DatasetSchemaSkeleton'

// ---------------------------------------------------------------------------
// Role badge color map — semantic, not decorative
// ---------------------------------------------------------------------------
const ROLE_STYLES: Record<string, string> = {
  INPUT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  EXPECTED_OUTPUT: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  CONTEXT: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  METADATA: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700',
}

const ROLE_LABELS: Record<string, string> = {
  INPUT: 'Input',
  EXPECTED_OUTPUT: 'Expected Output',
  CONTEXT: 'Context',
  METADATA: 'Metadata',
}

const DATA_TYPE_LABELS: Record<string, string> = {
  STRING: 'String',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
  JSON: 'JSON',
}

export function DatasetSchemaPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { t } = useTranslation('project')
  const { data: schemaData, isLoading } = useDatasetSchema(publicId)
  const createMutation = useCreateColumn(publicId)
  const updateMutation = useUpdateColumn(publicId)
  const deleteMutation = useDeleteColumn(publicId)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<DatasetColumnResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DatasetColumnResponse | null>(null)

  const handleOpenNew = () => {
    setEditingColumn(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (col: DatasetColumnResponse) => {
    setEditingColumn(col)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setEditingColumn(null)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.publicId, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (isLoading) return <DatasetSchemaSkeleton />

  const columns = schemaData?.columns ?? []
  const hasColumns = columns.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6"
    >
      {/* Header with action */}
      <div className="flex items-start justify-between gap-4">
        <ConfigPageHeader titleKey="config.schema.title" descriptionKey="config.schema.description" />
        {hasColumns && (
          <Button onClick={handleOpenNew} size="sm" className="shrink-0">
            <PlusIcon data-icon="inline-start" />
            {t('config.schema.addColumn')}
          </Button>
        )}
      </div>

      {/* Table or Empty state */}
      {hasColumns ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t('config.schema.columnName')}</TableHead>
                  <TableHead className="w-[100px]">{t('config.schema.dataType')}</TableHead>
                  <TableHead className="w-[140px]">{t('config.schema.role')}</TableHead>
                  <TableHead className="w-[80px] text-center">{t('config.schema.required')}</TableHead>
                  <TableHead className="w-[90px] text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((col) => (
                  <TableRow key={col.publicId} className="group">
                    <TableCell className="px-2">
                      <GripVerticalIcon className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{col.columnName}</span>
                        {col.displayName && (
                          <span className="text-xs text-muted-foreground">{col.displayName}</span>
                        )}
                        {col.description && (
                          <span className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">{col.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {DATA_TYPE_LABELS[col.dataType] ?? col.dataType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${ROLE_STYLES[col.role] ?? ''}`}
                      >
                        {ROLE_LABELS[col.role] ?? col.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {col.required ? (
                        <span className="inline-block size-2 rounded-full bg-emerald-500" title="Required" />
                      ) : (
                        <span className="inline-block size-2 rounded-full bg-zinc-200 dark:bg-zinc-700" title="Optional" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleOpenEdit(col)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(col)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Empty state — clean, not cute */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-muted/60">
              <TableIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t('config.schema.noColumns')}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Định nghĩa cấu trúc dữ liệu test. Mỗi cột đại diện cho một trường dữ liệu trong dataset.
              </p>
            </div>
            <Button onClick={handleOpenNew} size="sm" variant="outline">
              <PlusIcon data-icon="inline-start" />
              {t('config.schema.addColumn')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Column Form Dialog */}
      <ColumnFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingColumn={editingColumn}
        onCreateColumn={(data) => createMutation.mutate(data, { onSuccess: () => setIsDialogOpen(false) })}
        onUpdateColumn={(data) => updateMutation.mutate(data, { onSuccess: () => setIsDialogOpen(false) })}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa cột</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa cột <span className="font-semibold text-foreground">{deleteTarget?.columnName}</span>?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
