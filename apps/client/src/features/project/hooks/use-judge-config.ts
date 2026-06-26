import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getJudgeConfig, saveJudgeConfig, testJudgeConfig } from '@/lib/config-api'
import type { SaveJudgeConfigRequest, TestJudgeConfigRequest } from '@/types/config'

export function useJudgeConfig(publicId: string | undefined) {
  return useQuery({
    queryKey: ['judgeConfig', publicId],
    queryFn: () => getJudgeConfig(publicId!),
    enabled: !!publicId,
    retry: false,
  })
}

export function useSaveJudgeConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: SaveJudgeConfigRequest) => saveJudgeConfig(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.judge.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['judgeConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useTestJudgeConfig(publicId: string | undefined) {
  return useMutation({
    mutationFn: (data: TestJudgeConfigRequest) => testJudgeConfig(publicId!, data),
    onError: () => {
      toast.error('Test connection failed')
    },
  })
}
