# Auth Client Contract

This document is the client-facing contract for the current Spring Boot auth APIs.
The Java code is the source of truth when this file and implementation drift.

## Transport

- Base path: `/api/v1`
- JSON request content type: `application/json`
- Success JSON response content type: `application/json`
- Error response content type: `application/problem+json`
- Refresh token storage: backend-managed HttpOnly cookie named `refresh_token`
- Trace header: backend returns `X-Trace-Id` on every request handled by `TraceIdFilter`
- Error body also contains `traceId`; client should include it in bug reports/support logs

## Error Shape

All expected API errors use RFC 9457 Problem Details plus VFQC extensions:

```json
{
  "type": "https://vfqc.vinfast.vn/errors/validation-error",
  "title": "Validation error",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "detail": "Request validation failed.",
  "instance": "/api/v1/auth/register",
  "traceId": "7f2a9d8d0c4b4b13",
  "timestamp": "2026-06-25T05:30:00Z",
  "fieldErrors": [
    {
      "field": "email",
      "code": "FIELD_VALIDATION_ERROR",
      "messageCode": "validation.user.email.invalid",
      "message": "validation.user.email.invalid",
      "rejectedValue": "not-an-email",
      "params": {}
    }
  ]
}
```

Client mapping rules:

- Use `code` for page/global error mapping.
- Use `fieldErrors[].field` to attach form errors.
- Use `fieldErrors[].messageCode` for i18n lookup.
- Treat `message` and `detail` as fallback text only.
- Never require `fieldErrors`; it is present only for validation errors.
- Do not display `rejectedValue` for sensitive fields; backend redacts password/token-like fields.

## Endpoints

| Flow | Method | Path | Request | Success |
| --- | --- | --- | --- | --- |
| Register | `POST` | `/api/v1/auth/register` | `RegisterRequest` | `201`, empty body |
| Login | `POST` | `/api/v1/auth/login` | `LoginRequest` | `200 LoginResponse`, `Set-Cookie: refresh_token=...` |
| Refresh token | `POST` | `/api/v1/auth/refresh-token` | none | `200 LoginResponse`, rotated refresh cookie |
| Logout | `POST` | `/api/v1/auth/logout` | none | `204`, cleared refresh cookie |
| Verify email | `POST` | `/api/v1/auth/verify-email` | `VerifyEmailRequest` | `200`, empty body |
| Forgot password | `POST` | `/api/v1/auth/forgot-password` | `ForgotPasswordRequest` | `204`, empty body |
| Reset password | `POST` | `/api/v1/auth/reset-password` | `ResetPasswordRequest` | `204`, empty body |
| Current user | `GET` | `/api/v1/users/me` | bearer access token | `200 UserResponse` |

## Request Types

```ts
type RegisterRequest = {
  email: string;
  password: string;
  displayName?: string | null;
};

type LoginRequest = {
  email: string;
  password: string;
};

type VerifyEmailRequest = {
  token: string;
};

type ForgotPasswordRequest = {
  email: string;
};

type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};
```

## Response Types

```ts
type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: UserResponse;
};

type UserResponse = {
  publicId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "QC_MEMBER" | "QC_LEAD" | "ADMIN";
  status: "PENDING_EMAIL_VERIFICATION" | "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
};
```

## Error Codes

| Code | HTTP | Client handling |
| --- | ---: | --- |
| `VALIDATION_ERROR` | 400 | Apply `fieldErrors` to form controls |
| `BAD_REQUEST` | 400 | Show generic request error |
| `BAD_CREDENTIALS` | 401 | Show invalid email/password on login form |
| `UNAUTHORIZED` | 401 | Ask user to sign in |
| `ACCESS_TOKEN_EXPIRED` | 401 | Try refresh once, then sign in |
| `INVALID_ACCESS_TOKEN` | 401 | Clear auth state and sign in |
| `INVALID_REFRESH_TOKEN` | 401 | Clear auth state and sign in |
| `REFRESH_TOKEN_EXPIRED` | 401 | Clear auth state and sign in |
| `FORBIDDEN` | 403 | Show permission error |
| `EMAIL_NOT_VERIFIED` | 403 | Route to verify-email/resend guidance |
| `ACCOUNT_LOCKED` | 403 | Show account-disabled support guidance |
| `USER_NOT_FOUND` | 404 | Clear auth state and sign in |
| `EMAIL_ALREADY_EXISTS` | 409 | Attach duplicate-email error to register form |
| `INVALID_EMAIL_VERIFICATION_TOKEN` | 400 | Show invalid verification link |
| `EMAIL_VERIFICATION_TOKEN_USED` | 400 | Show already-used verification link |
| `EMAIL_VERIFICATION_TOKEN_EXPIRED` | 400 | Show expired verification link |
| `INVALID_PASSWORD_RESET_TOKEN` | 400 | Show invalid reset link |
| `PASSWORD_RESET_TOKEN_USED` | 400 | Show already-used reset link |
| `PASSWORD_RESET_TOKEN_EXPIRED` | 400 | Show expired reset link |
| `RESOURCE_NOT_FOUND` | 404 | Show not found state |
| `INTERNAL_SERVER_ERROR` | 500 | Show generic server error and log `traceId` |

## Validation Message Codes

| Field | Message code |
| --- | --- |
| `email` | `validation.user.email.required` |
| `email` | `validation.user.email.invalid` |
| `email` | `validation.user.email.max` |
| `password` | `validation.user.password.required` |
| `password` | `validation.user.password.size` |
| `displayName` | `validation.user.display-name.max` |
| `token` for verify email | `validation.auth.email-verification-token.required` |
| `token` for verify email | `validation.auth.email-verification-token.max` |
| `token` for password reset | `validation.auth.password-reset-token.required` |
| `token` for password reset | `validation.auth.password-reset-token.max` |
| `newPassword` | `validation.user.new-password.required` |
| `newPassword` | `validation.user.new-password.size` |
