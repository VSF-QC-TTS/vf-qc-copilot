import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getProjectSchema, createSchemaColumn, updateSchemaColumn, deleteSchemaColumn } from '@/lib/config-api'
import type { CreateSchemaColumnRequest, UpdateSchemaColumnRequest } from '@/types/config'

export function useProjectSchema(publicId: string | undefined) {
  return useQuery({
    queryKey: ['projectSchema', publicId],
    queryFn: () => getProjectSchema(publicId!),
    enabled: !!publicId,
  })
}

export function useCreateSchemaColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: CreateSchemaColumnRequest) => createSchemaColumn(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.schema.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['projectSchema', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useUpdateSchemaColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: { columnId: string; payload: UpdateSchemaColumnRequest }) =>
      updateSchemaColumn(publicId!, data.columnId, data.payload),
    onSuccess: () => {
      toast.success(t('config.schema.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['projectSchema', publicId] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useDeleteSchemaColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteSchemaColumn(publicId!, columnId),
    onSuccess: () => {
      toast.success('Column deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['projectSchema', publicId] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}
