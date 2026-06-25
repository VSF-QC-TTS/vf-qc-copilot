import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/layouts/AuthLayout'
import { FloatingInput } from '@/features/auth/components/FloatingInput'
import { FloatingPasswordInput } from '@/features/auth/components/FloatingPasswordInput'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormAlert } from '@/components/ui/FormAlert'
import { useAuth } from '@/features/auth/auth-context'
import { useLoginMutation } from '@/features/auth/hooks/useAuthMutations'
import { useAuthError } from '@/features/auth/hooks/useAuthError'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas'

export function LoginPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const { handleError } = useAuthError<LoginFormData>({
    setError,
    setFormError,
    validFields: ['email', 'password'],
  })

  const onSubmit = (data: LoginFormData) => {
    setFormError(null)
    mutation.mutate(data, {
      onSuccess: (response) => {
        login(response)
        navigate('/', { replace: true })
      },
      onError: handleError,
    })
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('login.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('login.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <FormAlert message={formError} className="mb-4" />}

        <FieldGroup>
          <FloatingInput
            id="email"
            type="email"
            autoComplete="email"
            label={t('login.email')}
            error={errors.email?.message ? t(errors.email.message, { ns: 'validation' }) : undefined}
            {...register('email')}
          />

          <FloatingPasswordInput
            id="password"
            autoComplete="current-password"
            label={t('login.password')}
            error={errors.password?.message ? t(errors.password.message, { ns: 'validation' }) : undefined}
            {...register('password')}
          />
        </FieldGroup>

        <div className="my-4 flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">
            {t('login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full h-12 text-base">
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          {mutation.isPending ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:text-primary/80">
          {t('login.register')}
        </Link>
      </p>
    </AuthLayout>
  )
}
