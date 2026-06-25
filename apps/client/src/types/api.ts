// =============================================================================
// Auth API Types — matches docs/api/auth/client-contract.md exactly
// =============================================================================

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export type RegisterRequest = {
  email: string
  password: string
  displayName?: string | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type VerifyEmailRequest = {
  token: string
}

export type ForgotPasswordRequest = {
  email: string
}

export type ResetPasswordRequest = {
  token: string
  newPassword: string
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresInSeconds: number
  user: UserResponse
}

export type UserResponse = {
  publicId: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: 'QC_MEMBER' | 'QC_LEAD' | 'ADMIN'
  status: 'PENDING_EMAIL_VERIFICATION' | 'ACTIVE' | 'DISABLED'
  lastLoginAt: string | null
}

// ---------------------------------------------------------------------------
// Error types — RFC 9457 Problem Details + VFQC extensions
// ---------------------------------------------------------------------------

export type ApiFieldError = {
  field: string
  code: string
  messageCode: string
  message: string
  rejectedValue: unknown
  params: Record<string, unknown>
}

export type ApiErrorResponse = {
  type: string
  title: string
  status: number
  code: string
  detail: string
  instance: string
  traceId: string
  timestamp: string
  fieldErrors?: ApiFieldError[]
}

// ---------------------------------------------------------------------------
// Error codes — from client-contract.md
// ---------------------------------------------------------------------------

export const AUTH_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  BAD_CREDENTIALS: 'BAD_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
  INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_EMAIL_VERIFICATION_TOKEN: 'INVALID_EMAIL_VERIFICATION_TOKEN',
  EMAIL_VERIFICATION_TOKEN_USED: 'EMAIL_VERIFICATION_TOKEN_USED',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
  INVALID_PASSWORD_RESET_TOKEN: 'INVALID_PASSWORD_RESET_TOKEN',
  PASSWORD_RESET_TOKEN_USED: 'PASSWORD_RESET_TOKEN_USED',
  PASSWORD_RESET_TOKEN_EXPIRED: 'PASSWORD_RESET_TOKEN_EXPIRED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]
