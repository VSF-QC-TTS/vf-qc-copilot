import { useCallback } from 'react'
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/lib/api-client'
import { getFieldErrors, getErrorI18nKey, getTraceId } from '@/lib/api-error'

// ---------------------------------------------------------------------------
// Shared hook: handle API errors in auth forms
// Extracts the repeated try/catch pattern from every auth page
// ---------------------------------------------------------------------------

type UseAuthErrorOptions<T extends FieldValues> = {
  setError: UseFormSetError<T>
  setFormError: (msg: string | null) => void
  /** Fields that can receive backend validation errors */
  validFields: Path<T>[]
}

export function useAuthError<T extends FieldValues>({
  setError,
  setFormError,
  validFields,
}: UseAuthErrorOptions<T>) {
  const { t } = useTranslation('auth')
  const { t: tv } = useTranslation('validation')

  const handleError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) {
        setFormError(t('error.unknown', { ns: 'common' }))
        return
      }

      const { code } = error.response
      const traceId = getTraceId(error.response)

      // Field-level validation errors
      if (code === 'VALIDATION_ERROR') {
        const fieldErrors = getFieldErrors(error.response.fieldErrors)
        for (const [field, messageCode] of Object.entries(fieldErrors)) {
          if (validFields.includes(field as Path<T>)) {
            setError(field as Path<T>, { message: tv(messageCode) })
          }
        }
        return
      }

      // EMAIL_ALREADY_EXISTS → attach to email field
      if (code === 'EMAIL_ALREADY_EXISTS' && validFields.includes('email' as Path<T>)) {
        setError('email' as Path<T>, { message: t('error.emailAlreadyExists') })
        return
      }

      // Form-level error
      const i18nKey = getErrorI18nKey(code)
      setFormError(t(i18nKey))

      if (traceId) {
        console.error(`[Auth Error] code=${code} traceId=${traceId}`)
      }
    },
    [setError, setFormError, validFields, t, tv],
  )

  return { handleError }
}
