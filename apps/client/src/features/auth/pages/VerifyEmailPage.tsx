import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AuthResult, AuthSkeleton } from '@/features/auth/components/AuthResult'
import { useVerifyEmailMutation } from '@/features/auth/hooks/useAuthMutations'
import { ApiError } from '@/lib/api-client'
import { getTraceId } from '@/lib/api-error'

// Token error code → i18n key mapping
const TOKEN_ERROR_MAP: Record<string, string> = {
  INVALID_EMAIL_VERIFICATION_TOKEN: 'verifyEmail.invalidToken',
  EMAIL_VERIFICATION_TOKEN_USED: 'verifyEmail.tokenUsed',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'verifyEmail.tokenExpired',
}

export function VerifyEmailPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const mutation = useVerifyEmailMutation()
  const { mutate } = mutation
  const hasSubmitted = useRef(false)

  // Auto-submit on mount
  useEffect(() => {
    if (!token || hasSubmitted.current) return
    hasSubmitted.current = true
    mutate({ token })
  }, [token, mutate])

  // Missing token
  if (!token) {
    return (
      <AuthResult
        icon="error"
        title={t('verifyEmail.title')}
        message={t('verifyEmail.missingToken')}
        linkTo="/login"
        linkText={t('verifyEmail.goToLogin')}
      />
    )
  }

  // Loading — skeleton instead of spinner
  if (mutation.isPending || mutation.isIdle) {
    return <AuthSkeleton title={t('verifyEmail.title')} message={t('verifyEmail.verifying')} />
  }

  // Success
  if (mutation.isSuccess) {
    return (
      <AuthResult
        icon="success"
        title={t('verifyEmail.success.title')}
        message={t('verifyEmail.success.message')}
        linkTo="/login"
        linkText={t('verifyEmail.goToLogin')}
        linkVariant="button"
      />
    )
  }

  // Error
  let errorMessage = t('error.unknown', { ns: 'common' })
  if (mutation.error instanceof ApiError) {
    const { code } = mutation.error.response
    const traceId = getTraceId(mutation.error.response)
    errorMessage = t(TOKEN_ERROR_MAP[code] ?? 'error.unknown', { ns: TOKEN_ERROR_MAP[code] ? 'auth' : 'common' })
    if (traceId) console.error(`[Auth Error] code=${code} traceId=${traceId}`)
  }

  return (
    <AuthResult
      icon="error"
      title={t('verifyEmail.title')}
      message={errorMessage}
      linkTo="/login"
      linkText={t('verifyEmail.goToLogin')}
    />
  )
}
