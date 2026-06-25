import { useMutation } from '@tanstack/react-query'
import type {
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@/types/api'
import * as authApi from '@/lib/auth-api'
import type { LoginFormData, RegisterFormData } from '@/features/auth/schemas'

// ---------------------------------------------------------------------------
// TanStack Query mutations for all auth actions
// Single Responsibility: each mutation wraps exactly one API call
// ---------------------------------------------------------------------------

export function useLoginMutation() {
  return useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: (data) => authApi.login(data),
  })
}

export function useRegisterMutation() {
  return useMutation<void, Error, RegisterFormData>({
    mutationFn: (data) =>
      authApi.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName || null,
      }),
  })
}

export function useForgotPasswordMutation() {
  return useMutation<void, Error, ForgotPasswordRequest>({
    mutationFn: (data) => authApi.forgotPassword(data),
  })
}

export function useResetPasswordMutation() {
  return useMutation<void, Error, ResetPasswordRequest>({
    mutationFn: (data) => authApi.resetPassword(data),
  })
}

export function useVerifyEmailMutation() {
  return useMutation<void, Error, VerifyEmailRequest>({
    mutationFn: (data) => authApi.verifyEmail(data),
  })
}
