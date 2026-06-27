import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  PlusIcon,
  TrashIcon,
  GripVerticalIcon,
  PencilIcon,
  TableIcon,
  CopyIcon,
  BookOpenIcon
} from 'lucide-react'
import { toast } from 'sonner'

import type { SchemaColumnResponse } from '@/types/config'
import { useProjectSchema, useCreateSchemaColumn, useUpdateSchemaColumn, useDeleteSchemaColumn } from '../../hooks/use-project-schema'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
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
import { ProjectSchemaSkeleton } from '../../components/ProjectSchemaSkeleton'

export function ProjectSchemaPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { t } = useTranslation('project')
  const { data: schemaData, isLoading } = useProjectSchema(publicId)
  const createMutation = useCreateSchemaColumn(publicId)
  const updateMutation = useUpdateSchemaColumn(publicId)
  const deleteMutation = useDeleteSchemaColumn(publicId)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<SchemaColumnResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SchemaColumnResponse | null>(null)

  // Local state for inline quick add row
  const [newName, setNewName] = useState('')
  const [newDataType, setNewDataType] = useState('STRING')
  const [newRole, setNewRole] = useState('EXPECTED')
  const [newSample, setNewSample] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleOpenEdit = (col: SchemaColumnResponse) => {
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

  const handleQuickAdd = () => {
    if (!newName.trim()) {
      toast.error('Tên cột không được trống')
      return
    }
    createMutation.mutate({
      columnName: newName.trim(),
      dataType: newDataType,
      role: newRole,
      sampleValue: newSample.trim() || null,
    }, {
      onSuccess: () => {
        setNewName('')
        setNewSample('')
        toast.success('Đã thêm cột mới thành công')
        nameInputRef.current?.focus()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép: ${text}`)
  }

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'INPUT':
        return 'Input'
      case 'EXPECTED':
        return 'expected'
      case 'CONTEXT':
        return 'context'
      case 'EVALUATION_PARAM':
        return 'evaluation_param'
      case 'METADATA':
        return 'metadata'
      default:
        return role?.toLowerCase() || 'expected'
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'INPUT':
        return 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
      case 'EXPECTED':
        return 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
      case 'CONTEXT':
        return 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30'
      case 'EVALUATION_PARAM':
        return 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
      case 'METADATA':
        return 'bg-slate-50/80 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-900/30'
      default:
        return 'bg-muted/80 text-muted-foreground border border-border'
    }
  }

  const getRoleSelectTriggerClass = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'INPUT':
        return 'bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/20'
      case 'EXPECTED':
        return 'bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/20'
      case 'CONTEXT':
        return 'bg-purple-50/80 hover:bg-purple-100/80 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/20'
      case 'EVALUATION_PARAM':
        return 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/20'
      case 'METADATA':
        return 'bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-900/20 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-900/20'
      default:
        return 'bg-muted/80 hover:bg-muted dark:bg-zinc-800 dark:hover:bg-zinc-700 text-muted-foreground border border-border'
    }
  }

  if (isLoading) return <ProjectSchemaSkeleton />

  const columns = schemaData?.columns ?? []
  const hasColumns = columns.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <ConfigPageHeader titleKey="config.schema.title" descriptionKey="config.schema.description" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Columns Table (Left Column) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TableIcon className="size-4 text-primary" />
                    Dataset columns (schema)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Định nghĩa cột mẫu — dùng làm biến trong Verification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="text-xs font-semibold uppercase">{t('config.schema.columnName')}</TableHead>
                    <TableHead className="w-24 text-xs font-semibold uppercase">Kiểu</TableHead>
                    <TableHead className="w-36 text-xs font-semibold uppercase">Vai trò</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Giá trị mẫu</TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-semibold uppercase">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((col) => (
                    <TableRow key={col.publicId} className="group">
                      <TableCell className="px-2">
                        <GripVerticalIcon className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <span
                          onClick={() => handleOpenEdit(col)}
                          className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-all"
                        >
                          {col.columnName}
                        </span>
                        {col.description && (
                          <span className="text-[11px] text-muted-foreground block mt-0.5 line-clamp-1">
                            {col.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1">
                        <Select
                          value={col.dataType || 'STRING'}
                          onValueChange={(val) => {
                            updateMutation.mutate({
                              columnId: col.publicId,
                              payload: { dataType: val },
                            })
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 px-2 py-0 border-none shadow-none bg-muted/60 hover:bg-muted font-normal text-xs rounded transition-colors">
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
                      </TableCell>
                      <TableCell className="py-1">
                        <Select
                          value={col.role || 'EXPECTED'}
                          onValueChange={(val) => {
                            updateMutation.mutate({
                              columnId: col.publicId,
                              payload: { role: val },
                            })
                          }}
                        >
                          <SelectTrigger className={`h-7 px-2 py-0 font-medium text-[11px] rounded-full shadow-none border cursor-pointer w-auto flex items-center justify-between gap-1 ${getRoleSelectTriggerClass(col.role)}`}>
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
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          defaultValue={col.sampleValue || ''}
                          onBlur={(e) => {
                            const val = e.target.value
                            if (val !== (col.sampleValue || '')) {
                              updateMutation.mutate({
                                columnId: col.publicId,
                                payload: { sampleValue: val || null },
                              })
                            }
                          }}
                          className="h-7 border-transparent hover:border-border focus:border-input focus:bg-background bg-transparent text-xs px-2 py-1 rounded transition-all"
                          placeholder="giá trị mẫu..."
                        />
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleOpenEdit(col)}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(col)}
                          >
                            <TrashIcon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Inline quick-add row */}
                  <TableRow className="bg-muted/5 border-t border-dashed hover:bg-muted/10">
                    <TableCell className="px-2" />
                    <TableCell className="py-2">
                      <Input
                        ref={nameInputRef}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="column_name"
                        className="h-8 text-xs border-dashed"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Select value={newDataType} onValueChange={setNewDataType}>
                        <SelectTrigger className="h-8 w-20 text-xs border-dashed">
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
                    </TableCell>
                    <TableCell className="py-2">
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className={`h-8 text-xs border-dashed flex items-center justify-between gap-1 ${getRoleSelectTriggerClass(newRole)}`}>
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
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        value={newSample}
                        onChange={(e) => setNewSample(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="giá trị mẫu..."
                        className="h-8 text-xs border-dashed"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button
                        type="button"
                        onClick={handleQuickAdd}
                        size="icon"
                        className="size-8 active:scale-[0.95] transition-transform"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? <Spinner data-icon="inline-start" /> : <PlusIcon />}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-start">
            <Button
              onClick={() => nameInputRef.current?.focus()}
              size="sm"
              variant="outline"
              className="mt-1 active:scale-[0.98] transition-transform"
            >
              <PlusIcon data-icon="inline-start" />
              {t('config.schema.addColumn')}
            </Button>
          </div>
        </div>

        {/* Variables List (Right Column) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpenIcon className="size-4 text-emerald-500" />
                Biến dùng trong Verify
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Mỗi cột thành biến <code className="text-emerald-600 dark:text-emerald-400 font-mono">dataset.*</code> trong prompt chấm điểm.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {hasColumns ? (
                <div className="flex flex-col gap-2.5 max-h-[400px] overflow-auto pr-1">
                  {columns.map((col) => (
                    <div
                      key={col.publicId}
                      onClick={() => copyToClipboard(`dataset.${col.columnName}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-accent/40 cursor-pointer group transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground group-hover:text-primary transition-colors">
                          dataset.{col.columnName}
                        </span>
                        <CopyIcon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Badge className={`text-[10px] font-normal px-2 py-0.5 rounded-full shadow-none border ${getRoleBadgeClass(col.role)}`}>
                        {getRoleLabel(col.role)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed rounded-xl flex flex-col items-center justify-center gap-2">
                  <TableIcon className="size-8 text-muted-foreground/35 animate-pulse" />
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Thêm các cột ở bảng bên trái để tạo các biến verify.
                  </p>
                </div>
              )}

              <Separator className="my-1" />

              <div className="rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 p-3.5 text-xs leading-relaxed text-muted-foreground">
                Mở <strong className="text-foreground">Verification</strong> &rarr; chèn biến từ menu + <code className="text-emerald-600 dark:text-emerald-400 font-mono">dataset.*</code> để chấm điểm.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              className="active:scale-[0.98] transition-transform"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

