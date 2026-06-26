import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getVerificationConfig, saveVerificationConfig, getResponseFields, getOperators } from '@/lib/config-api'
import type { SaveVerificationRequest } from '@/types/config'

export function useVerificationConfig(publicId: string | undefined) {
  return useQuery({
    queryKey: ['verificationConfig', publicId],
    queryFn: () => getVerificationConfig(publicId!),
    enabled: !!publicId,
    retry: false,
  })
}

export function useSaveVerificationConfig(publicId: string | undefined) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('project')

  return useMutation({
    mutationFn: (data: SaveVerificationRequest) => saveVerificationConfig(publicId!, data),
    onSuccess: () => {
      toast.success(t('config.verification.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['verificationConfig', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', publicId, 'setupStatus'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })
}

export function useResponseFields(publicId: string | undefined) {
  return useQuery({
    queryKey: ['responseFields', publicId],
    queryFn: () => getResponseFields(publicId!),
    enabled: !!publicId,
  })
}

export function useOperatorCatalog() {
  return useQuery({
    queryKey: ['operatorCatalog'],
    queryFn: () => getOperators(),
  })
}
