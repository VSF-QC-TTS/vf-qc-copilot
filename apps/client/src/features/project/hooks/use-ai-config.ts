import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getAiConfig, saveAiConfig, testAiConfig, listCompareConfigs, deleteCompareConfig } from '@/lib/config-api'
import type { SaveAiConfigRequest, TestAiConfigRequest } from '@/types/config'

export function useAiConfig(publicId: string | undefined) {
  return useQuery({
    queryKey: ['aiConfig', publicId],
    queryFn: () => getAiConfig(publicId!),
    enabled: !!publicId,
    retry: false,
  })
}

export function useSaveAiConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: SaveAiConfigRequest) => saveAiConfig(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.judge.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['aiConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useTestAiConfig(publicId: string | undefined) {
  return useMutation({
    mutationFn: (data: TestAiConfigRequest) => testAiConfig(publicId!, data),
    onError: () => {
      toast.error('Test connection failed')
    },
  })
}

export function useCompareConfigs(publicId: string | undefined) {
  return useQuery({
    queryKey: ['compareConfigs', publicId],
    queryFn: () => listCompareConfigs(publicId!),
    enabled: !!publicId,
    retry: false,
  })
}

export function useDeleteCompareConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (configId: string) => deleteCompareConfig(publicId!, configId),
    onSuccess: () => {
      toast.success('Xóa cấu hình so sánh thành công')
      queryClient.invalidateQueries({ queryKey: ['compareConfigs', publicId] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}
