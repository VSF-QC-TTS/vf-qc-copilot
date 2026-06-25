import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AuthResult } from '@/features/auth/components/AuthResult'
import { FloatingPasswordInput } from '@/features/auth/components/FloatingPasswordInput'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormAlert } from '@/components/ui/FormAlert'
import { useResetPasswordMutation } from '@/features/auth/hooks/useAuthMutations'
import { ApiError } from '@/lib/api-client'
import { getErrorI18nKey, getTraceId } from '@/lib/api-error'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas'

// Token error code → i18n key mapping
const TOKEN_ERROR_MAP: Record<string, string> = {
  INVALID_PASSWORD_RESET_TOKEN: 'resetPassword.invalidToken',
  PASSWORD_RESET_TOKEN_USED: 'resetPassword.tokenUsed',
  PASSWORD_RESET_TOKEN_EXPIRED: 'resetPassword.tokenExpired',
}

export function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = useResetPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Missing token — no API call
  if (!token) {
    return (
      <AuthResult
        icon="error"
        title={t('resetPassword.title')}
        message={t('resetPassword.missingToken')}
        linkTo="/login"
        linkText={t('resetPassword.goToLogin')}
      />
    )
  }

  // Token error state
  if (tokenError) {
    return (
      <AuthResult
        icon="error"
        title={t('resetPassword.title')}
        message={tokenError}
        linkTo="/login"
        linkText={t('resetPassword.goToLogin')}
      />
    )
  }

  // Success state
  if (mutation.isSuccess) {
    return (
      <AuthResult
        icon="success"
        title={t('resetPassword.success.title')}
        message={t('resetPassword.success.message')}
        linkTo="/login"
        linkText={t('resetPassword.goToLogin')}
        linkVariant="button"
      />
    )
  }

  const onSubmit = (data: ResetPasswordFormData) => {
    setFormError(null)
    mutation.mutate(
      { token, newPassword: data.newPassword },
      {
        onError: (error) => {
          if (error instanceof ApiError) {
            const { code } = error.response
            const traceId = getTraceId(error.response)

            // Token-specific errors → dedicated state
            if (code in TOKEN_ERROR_MAP) {
              setTokenError(t(TOKEN_ERROR_MAP[code]))
              return
            }

            const i18nKey = getErrorI18nKey(code)
            setFormError(t(i18nKey))
            if (traceId) console.error(`[Auth Error] code=${code} traceId=${traceId}`)
          } else {
            setFormError(t('error.unknown', { ns: 'common' }))
          }
        },
      },
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('resetPassword.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('resetPassword.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <FormAlert message={formError} className="mb-4" />}

        <FieldGroup>
          <FloatingPasswordInput
            id="newPassword"
            autoComplete="new-password"
            label={t('resetPassword.newPassword')}
            error={errors.newPassword?.message ? t(errors.newPassword.message, { ns: 'validation' }) : undefined}
            {...register('newPassword')}
          />

          <FloatingPasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            label={t('resetPassword.confirmPassword')}
            error={errors.confirmPassword?.message ? t(errors.confirmPassword.message, { ns: 'validation' }) : undefined}
            {...register('confirmPassword')}
          />
        </FieldGroup>

        <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full h-12 text-base">
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          {mutation.isPending ? t('resetPassword.submitting') : t('resetPassword.submit')}
        </Button>
      </form>
    </>
  )
}
