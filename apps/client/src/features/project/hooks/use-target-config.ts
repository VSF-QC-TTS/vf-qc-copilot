import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getTargetConfig, saveTargetConfig, connectTarget, testTargetConfig } from '@/lib/config-api'
import type { SaveTargetConfigRequest, ExecuteCurlRequest, TestTargetConfigRequest } from '@/types/config'

export function useTargetConfig(publicId: string | undefined) {
  return useQuery({
    queryKey: ['targetConfig', publicId],
    queryFn: () => getTargetConfig(publicId!),
    enabled: !!publicId,
    retry: false,
  })
}

export function useSaveTargetConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: SaveTargetConfigRequest) => saveTargetConfig(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.target.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['targetConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useConnectTarget(publicId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExecuteCurlRequest) => connectTarget(publicId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['targetResponseFields', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useTestTargetConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TestTargetConfigRequest) => testTargetConfig(publicId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['targetResponseFields', publicId] })
    },
    onError: () => {
      toast.error('Test connection failed')
    },
  })
}

export function useTargetResponseFields(publicId: string | undefined, hasResponseSnapshot: boolean = false) {
  return useQuery({
    queryKey: ['targetResponseFields', publicId],
    queryFn: () => import('@/lib/config-api').then(m => m.getResponseFields(publicId!)),
    enabled: !!publicId && hasResponseSnapshot,
    retry: false,
  })
}
