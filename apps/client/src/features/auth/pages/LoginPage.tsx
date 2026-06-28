import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FloatingInput } from '@/features/auth/components/FloatingInput'
import { FloatingPasswordInput } from '@/features/auth/components/FloatingPasswordInput'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { FormAlert } from '@/components/ui/FormAlert'
import { useAuth } from '@/features/auth/auth-session'
import { useLoginMutation } from '@/features/auth/hooks/useAuthMutations'
import { useAuthError } from '@/features/auth/hooks/useAuthError'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas'
import { API_BASE_URL } from '@/lib/api-client'

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

export function LoginPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = useLoginMutation()

  const errorQuery = searchParams.get('error')

  useEffect(() => {
    if (errorQuery) {
      if (errorQuery === 'oauth_no_email') {
        setFormError(t('error.oauth_no_email'))
      } else {
        setFormError(t('error.oauth_generic'))
      }
    }
  }, [errorQuery, t])

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

  const handleSocialLogin = (provider: 'google' | 'github') => {
    const redirectTo = '/'
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}?redirectTo=${encodeURIComponent(redirectTo)}`
  }

  return (
    <>
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

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          {t('login.orContinueWith')}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin('google')}
          className="h-10 text-sm"
        >
          <GoogleIcon />
          <span>Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin('github')}
          className="h-10 text-sm"
        >
          <GithubIcon />
          <span>GitHub</span>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:text-primary/80">
          {t('login.register')}
        </Link>
      </p>
    </>
  )
}

