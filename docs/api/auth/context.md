# API Auth Context

File này là context ngắn cho client/AI coding agent. Code backend vẫn là source of truth; nếu cần contract chi tiết hơn, đọc `docs/api/auth/client-contract.md`.

## Backend Status

Auth backend đã có các flow:

- Register
- Login
- Refresh token
- Logout
- Get current user
- Verify email
- Forgot password
- Reset password

Backend dùng Spring Boot API tại base path `/api/v1`.

## Auth Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Register | `POST` | `/api/v1/auth/register` | `201`, empty body |
| Login | `POST` | `/api/v1/auth/login` | `200 LoginResponse` |
| Refresh token | `POST` | `/api/v1/auth/refresh-token` | `200 LoginResponse` |
| Logout | `POST` | `/api/v1/auth/logout` | `204`, empty body |
| Verify email | `POST` | `/api/v1/auth/verify-email` | `200`, empty body |
| Forgot password | `POST` | `/api/v1/auth/forgot-password` | `204`, empty body |
| Reset password | `POST` | `/api/v1/auth/reset-password` | `204`, empty body |
| Current user | `GET` | `/api/v1/users/me` | `200 UserResponse` |

## Token Model

- Access token is returned in `LoginResponse.accessToken`.
- Refresh token is stored by backend as HttpOnly cookie named `refresh_token`.
- Client must use `credentials: "include"` for auth requests.
- Client must not try to read refresh token from JavaScript.
- Client may keep access token in memory; if reload persistence is required, prefer `sessionStorage`.

## Error Model

Backend errors use RFC 9457 Problem Details with extra fields.

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

Client rules:

- Use top-level `code` for global/page state.
- Use `fieldErrors[].field` for form field mapping.
- Use `fieldErrors[].messageCode` for i18n key.
- Use `detail` and `message` only as fallback text.
- Include `traceId` in debug/support context.

## Important Error Codes

| Code | Client behavior |
| --- | --- |
| `VALIDATION_ERROR` | Apply `fieldErrors` to form |
| `BAD_CREDENTIALS` | Login form-level invalid credentials |
| `EMAIL_NOT_VERIFIED` | Show verify-email guidance |
| `ACCOUNT_LOCKED` | Show account disabled/support message |
| `EMAIL_ALREADY_EXISTS` | Attach duplicate-email error to register email field |
| `ACCESS_TOKEN_EXPIRED` | Refresh once, then retry original request |
| `INVALID_ACCESS_TOKEN` | Clear session and route to login |
| `INVALID_REFRESH_TOKEN` | Clear session and route to login |
| `REFRESH_TOKEN_EXPIRED` | Clear session and route to login |
| `USER_NOT_FOUND` | Clear session and route to login |
| `INVALID_EMAIL_VERIFICATION_TOKEN` | Invalid verify-email link state |
| `EMAIL_VERIFICATION_TOKEN_USED` | Already-used verify-email link state |
| `EMAIL_VERIFICATION_TOKEN_EXPIRED` | Expired verify-email link state |
| `INVALID_PASSWORD_RESET_TOKEN` | Invalid reset-password link state |
| `PASSWORD_RESET_TOKEN_USED` | Already-used reset-password link state |
| `PASSWORD_RESET_TOKEN_EXPIRED` | Expired reset-password link state |

## Data Types

```ts
type UserResponse = {
  publicId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "QC_MEMBER" | "QC_LEAD" | "ADMIN";
  status: "PENDING_EMAIL_VERIFICATION" | "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
};

type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: UserResponse;
};
```

## Backend Files Worth Reading

Read these only if implementation behavior is unclear:

- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/AuthController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/UserController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/shared/error/ErrorResponse.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/shared/error/ErrorCode.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/shared/web/TraceIdFilter.java`
