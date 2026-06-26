import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getDatasetSchema, createColumn, updateColumn, deleteColumn } from '@/lib/config-api'
import type { CreateColumnRequest, UpdateColumnRequest } from '@/types/config'

export function useDatasetSchema(publicId: string | undefined) {
  return useQuery({
    queryKey: ['datasetSchema', publicId],
    queryFn: () => getDatasetSchema(publicId!),
    enabled: !!publicId,
  })
}

export function useCreateColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: CreateColumnRequest) => createColumn(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.schema.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['datasetSchema', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useUpdateColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: { columnId: string; payload: UpdateColumnRequest }) =>
      updateColumn(publicId!, data.columnId, data.payload),
    onSuccess: () => {
      toast.success(t('config.schema.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['datasetSchema', publicId] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useDeleteColumn(publicId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(publicId!, columnId),
    onSuccess: () => {
      toast.success('Column deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['datasetSchema', publicId] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}
