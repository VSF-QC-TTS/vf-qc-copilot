import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  PlusIcon,
  TableIcon,
  HelpCircleIcon,
  XIcon
} from 'lucide-react'
import { toast } from 'sonner'

import type { SchemaColumnResponse } from '@/types/config'
import { useProjectSchema, useCreateSchemaColumn, useUpdateSchemaColumn, useDeleteSchemaColumn } from '../../hooks/use-project-schema'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { ProjectSchemaSkeleton } from '../../components/ProjectSchemaSkeleton'

export function ProjectSchemaPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { t } = useTranslation('project')
  const { data: schemaData, isLoading } = useProjectSchema(publicId)
  const createMutation = useCreateSchemaColumn(publicId)
  const updateMutation = useUpdateSchemaColumn(publicId)
  const deleteMutation = useDeleteSchemaColumn(publicId)

  const [deleteTarget, setDeleteTarget] = useState<SchemaColumnResponse | null>(null)

  // Local state for inline quick add row
  const [newName, setNewName] = useState('')
  const [newDataType, setNewDataType] = useState('STRING')
  const [newRole, setNewRole] = useState('EXPECTED')
  const [newSample, setNewSample] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6 max-w-4xl mx-auto w-full p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <ConfigPageHeader titleKey="config.schema.title" descriptionKey="config.schema.description" />
      </div>

      <div className="flex flex-col gap-4 w-full">
        <Card className="rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80">
          <CardHeader className="pb-3 border-b bg-muted/5 dark:bg-muted/10">
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
            <div className="overflow-x-auto w-full">
              <Table className="w-full min-w-[700px] lg:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">{t('config.schema.columnName')}</TableHead>
                    <TableHead className="w-24 text-xs font-semibold uppercase">Kiểu</TableHead>
                    <TableHead className="w-36 text-xs font-semibold uppercase">
                      <div className="flex items-center gap-1">
                        Vai trò
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircleIcon className="size-3.5 text-zinc-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[280px] p-3 flex flex-col items-start gap-2 text-left">
                              <p className="font-semibold">Các vai trò của biến:</p>
                              <ul className="list-disc pl-4 space-y-1 opacity-90 text-[11px] leading-relaxed">
                                <li><strong>Input:</strong> Dữ liệu truyền vào prompt gọi model.</li>
                                <li><strong>expected:</strong> Câu trả lời mẫu chuẩn dùng để đối chiếu.</li>
                                <li><strong>context:</strong> Dữ liệu ngữ cảnh bổ sung cho prompt.</li>
                                <li><strong>evaluation_param:</strong> Tham số phụ hỗ trợ tính toán.</li>
                                <li><strong>metadata:</strong> Dữ liệu meta đi kèm bản ghi.</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Giá trị mẫu</TableHead>
                    <TableHead className="w-10 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((col) => (
                    <TableRow key={col.publicId} className="group hover:bg-muted/30">
                      <TableCell>
                        <Input
                          defaultValue={col.columnName}
                          onBlur={(e) => {
                            const val = e.target.value.trim()
                            if (val && val !== col.columnName) {
                              updateMutation.mutate({
                                columnId: col.publicId,
                                payload: {
                                  columnName: val,
                                  dataType: col.dataType || 'STRING',
                                  role: col.role || 'EXPECTED',
                                  sampleValue: col.sampleValue,
                                },
                              })
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                          }}
                          className="h-7 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-background bg-transparent text-sm px-2 py-1 rounded-lg transition-all focus:ring-1 focus:ring-ring w-full font-mono text-zinc-900 dark:text-zinc-100 font-semibold"
                          placeholder="tên cột..."
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <Select
                          value={col.dataType || 'STRING'}
                          onValueChange={(val) => {
                            updateMutation.mutate({
                              columnId: col.publicId,
                              payload: {
                                  columnName: col.columnName,
                                  dataType: val,
                                  role: col.role || 'EXPECTED',
                                  sampleValue: col.sampleValue,
                                },
                              })
                          }}
                        >
                          <SelectTrigger className="h-7 w-20 px-2 py-0 border-none shadow-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] rounded transition-colors focus:ring-1 focus:ring-ring">
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
                              payload: {
                                columnName: col.columnName,
                                dataType: col.dataType || 'STRING',
                                role: val,
                                sampleValue: col.sampleValue,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className={`h-7 px-2.5 py-0 font-mono font-medium text-[10.5px] rounded-full shadow-none border cursor-pointer w-auto flex items-center justify-between gap-1 transition-all focus:ring-1 focus:ring-ring ${getRoleSelectTriggerClass(col.role)}`}>
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
                                payload: {
                                  columnName: col.columnName,
                                  dataType: col.dataType || 'STRING',
                                  role: col.role || 'EXPECTED',
                                  sampleValue: val || null,
                                },
                              })
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                          }}
                          className="h-7 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-background bg-transparent text-xs px-2 py-1 rounded-lg transition-all focus:ring-1 focus:ring-ring w-full font-mono text-zinc-700 dark:text-zinc-300"
                          placeholder="giá trị mẫu..."
                        />
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all cursor-pointer"
                          onClick={() => setDeleteTarget(col)}
                        >
                          <XIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Inline quick add row */}
                  <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/10">
                    <TableCell>
                      <Input
                        ref={nameInputRef}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs border-dashed focus:border-solid font-mono rounded-lg focus:ring-1 focus:ring-ring bg-background/50 focus:bg-background"
                        placeholder="Tên cột mới..."
                      />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Select value={newDataType} onValueChange={setNewDataType}>
                        <SelectTrigger className="h-8 w-20 text-xs border-dashed focus:border-solid font-mono rounded-lg focus:ring-1 focus:ring-ring bg-background/50 focus:bg-background">
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
                    <TableCell className="py-1.5">
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className={`h-8 px-2.5 py-0 font-mono font-medium text-[11px] rounded-full shadow-none border-dashed focus:border-solid cursor-pointer w-auto flex items-center justify-between gap-1 transition-all focus:ring-1 focus:ring-ring bg-background/50 focus:bg-background ${getRoleSelectTriggerClass(newRole)}`}>
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
                    <TableCell className="py-1.5">
                      <Input
                        value={newSample}
                        onChange={(e) => setNewSample(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs border-dashed focus:border-solid font-mono rounded-lg focus:ring-1 focus:ring-ring bg-background/50 focus:bg-background"
                        placeholder="Giá trị mẫu..."
                      />
                    </TableCell>
                    <TableCell className="text-right py-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 hover:bg-muted text-primary rounded-lg active:scale-95 transition-transform"
                        onClick={handleQuickAdd}
                      >
                        <PlusIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button
            onClick={() => nameInputRef.current?.focus()}
            size="sm"
            variant="outline"
            className="mt-1 active:scale-[0.98] transition-transform rounded-lg border-dashed border-zinc-300 dark:border-zinc-700 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <PlusIcon data-icon="inline-start" />
            {t('config.schema.addColumn')}
          </Button>
        </div>
      </div>

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
