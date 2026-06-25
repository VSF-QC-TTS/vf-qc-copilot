import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/layouts/AuthLayout'
import { AuthResult } from '@/features/auth/components/AuthResult'
import { FloatingInput } from '@/features/auth/components/FloatingInput'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormAlert } from '@/components/ui/FormAlert'
import { useForgotPasswordMutation } from '@/features/auth/hooks/useAuthMutations'
import { ApiError } from '@/lib/api-client'
import { getTraceId } from '@/lib/api-error'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas'

export function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = useForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormData) => {
    setFormError(null)
    mutation.mutate(data, {
      onSuccess: () => setIsSuccess(true),
      onError: (error) => {
        // Privacy: only show error on real server failures
        if (error instanceof ApiError && error.response.code === 'INTERNAL_SERVER_ERROR') {
          const traceId = getTraceId(error.response)
          setFormError(t('error.serverError', { ns: 'common' }))
          if (traceId) console.error(`[Auth Error] traceId=${traceId}`)
          return
        }
        // For all other codes, still show success (never reveal account existence)
        setIsSuccess(true)
      },
    })
  }

  if (isSuccess) {
    return (
      <AuthResult
        icon="email"
        title={t('forgotPassword.success.title')}
        message={t('forgotPassword.success.message')}
        linkTo="/login"
        linkText={t('forgotPassword.backToLogin')}
      />
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('forgotPassword.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <FormAlert message={formError} className="mb-4" />}

        <FieldGroup>
          <FloatingInput
            id="email"
            type="email"
            autoComplete="email"
            label={t('forgotPassword.email')}
            error={errors.email?.message ? t(errors.email.message, { ns: 'validation' }) : undefined}
            {...register('email')}
          />
        </FieldGroup>

        <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full h-12 text-base">
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          {mutation.isPending ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80">
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </AuthLayout>
  )
}
