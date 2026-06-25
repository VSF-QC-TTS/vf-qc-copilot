import type { ApiErrorResponse, ApiFieldError } from '@/types/api'

// ---------------------------------------------------------------------------
// Type guard: detect RFC 9457 Problem Details error
// ---------------------------------------------------------------------------

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'status' in error &&
    'detail' in error &&
    typeof (error as ApiErrorResponse).code === 'string'
  )
}

// ---------------------------------------------------------------------------
// Map fieldErrors[] to Record<fieldName, messageCode>
// Used to attach backend validation errors to react-hook-form fields
// ---------------------------------------------------------------------------

export function getFieldErrors(
  errors: ApiFieldError[] | undefined,
): Record<string, string> {
  if (!errors?.length) return {}

  const result: Record<string, string> = {}
  for (const err of errors) {
    // First error per field wins
    if (!result[err.field]) {
      result[err.field] = err.messageCode
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Map error code to i18n key for page/form-level messages
// ---------------------------------------------------------------------------

const ERROR_CODE_I18N_MAP: Record<string, string> = {
  VALIDATION_ERROR: 'error.validation',
  BAD_REQUEST: 'error.badRequest',
  BAD_CREDENTIALS: 'error.badCredentials',
  UNAUTHORIZED: 'error.unauthorized',
  ACCESS_TOKEN_EXPIRED: 'error.sessionExpired',
  INVALID_ACCESS_TOKEN: 'error.sessionExpired',
  INVALID_REFRESH_TOKEN: 'error.sessionExpired',
  REFRESH_TOKEN_EXPIRED: 'error.sessionExpired',
  FORBIDDEN: 'error.forbidden',
  EMAIL_NOT_VERIFIED: 'error.emailNotVerified',
  ACCOUNT_LOCKED: 'error.accountLocked',
  USER_NOT_FOUND: 'error.userNotFound',
  EMAIL_ALREADY_EXISTS: 'error.emailAlreadyExists',
  INVALID_EMAIL_VERIFICATION_TOKEN: 'error.invalidVerificationToken',
  EMAIL_VERIFICATION_TOKEN_USED: 'error.verificationTokenUsed',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'error.verificationTokenExpired',
  INVALID_PASSWORD_RESET_TOKEN: 'error.invalidResetToken',
  PASSWORD_RESET_TOKEN_USED: 'error.resetTokenUsed',
  PASSWORD_RESET_TOKEN_EXPIRED: 'error.resetTokenExpired',
  RESOURCE_NOT_FOUND: 'error.notFound',
  INTERNAL_SERVER_ERROR: 'error.serverError',
}

export function getErrorI18nKey(code: string): string {
  return ERROR_CODE_I18N_MAP[code] ?? 'error.unknown'
}

// ---------------------------------------------------------------------------
// Extract traceId for debug/support context
// ---------------------------------------------------------------------------

export function getTraceId(error: unknown): string | null {
  if (isApiError(error)) {
    return error.traceId ?? null
  }
  return null
}
