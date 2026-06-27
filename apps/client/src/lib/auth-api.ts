import { apiClient } from '@/lib/api-client'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
  VerifyEmailRequest,
} from '@/types/api'

// ---------------------------------------------------------------------------
// Auth endpoint wrappers — match docs/api/auth/client-contract.md exactly
// ---------------------------------------------------------------------------

export function register(data: RegisterRequest): Promise<void> {
  return apiClient('/auth/register', { method: 'POST', body: data })
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient('/auth/login', { method: 'POST', body: data })
}

export function refreshToken(): Promise<LoginResponse> {
  return apiClient('/auth/refresh-token', {
    method: 'POST',
    skipAuth: true,
  })
}

export function logout(): Promise<void> {
  return apiClient('/auth/logout', { method: 'POST', skipAuth: true })
}

export function verifyEmail(data: VerifyEmailRequest): Promise<void> {
  return apiClient('/auth/verify-email', { method: 'POST', body: data })
}

export function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  return apiClient('/auth/forgot-password', { method: 'POST', body: data })
}

export function resetPassword(data: ResetPasswordRequest): Promise<void> {
  return apiClient('/auth/reset-password', { method: 'POST', body: data })
}

export function getCurrentUser(): Promise<UserResponse> {
  return apiClient('/users/me')
}
