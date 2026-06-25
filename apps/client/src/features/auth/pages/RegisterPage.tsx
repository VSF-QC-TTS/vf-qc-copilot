import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AuthResult } from '@/features/auth/components/AuthResult'
import { FloatingInput } from '@/features/auth/components/FloatingInput'
import { FloatingPasswordInput } from '@/features/auth/components/FloatingPasswordInput'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormAlert } from '@/components/ui/FormAlert'
import { useRegisterMutation } from '@/features/auth/hooks/useAuthMutations'
import { useAuthError } from '@/features/auth/hooks/useAuthError'
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas'

export function RegisterPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const [formError, setFormError] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const mutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const { handleError } = useAuthError<RegisterFormData>({
    setError,
    setFormError,
    validFields: ['email', 'password', 'displayName'],
  })

  const onSubmit = (data: RegisterFormData) => {
    setFormError(null)
    mutation.mutate(data, {
      onSuccess: () => setSuccessEmail(data.email),
      onError: handleError,
    })
  }

  if (successEmail) {
    const isGmail = successEmail.toLowerCase().endsWith('@gmail.com')

    return (
      <AuthResult
        icon="email"
        title={t('register.success.title')}
        message={t('register.success.message', { email: successEmail })}
        linkTo="/login"
        linkText={t('register.login')}
        actionButton={isGmail ? { href: 'https://mail.google.com/', label: t('register.openGmail', { defaultValue: 'Mở Gmail' }) } : undefined}
      />
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('register.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('register.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <FormAlert message={formError} className="mb-4" />}

        <FieldGroup>
          <FloatingInput
            id="email"
            type="email"
            autoComplete="email"
            label={t('register.email')}
            error={errors.email?.message ? t(errors.email.message, { ns: 'validation' }) : undefined}
            {...register('email')}
          />

          <FloatingInput
            id="displayName"
            type="text"
            autoComplete="name"
            label={t('register.displayName')}
            error={errors.displayName?.message ? t(errors.displayName.message, { ns: 'validation' }) : undefined}
            {...register('displayName')}
          />

          <FloatingPasswordInput
            id="password"
            autoComplete="new-password"
            label={t('register.password')}
            error={errors.password?.message ? t(errors.password.message, { ns: 'validation' }) : undefined}
            {...register('password')}
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
          {mutation.isPending ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('register.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:text-primary/80">
          {t('register.login')}
        </Link>
      </p>
    </>
  )
}
