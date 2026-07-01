# Epic 3: Authentication & Security

Goal: implement local auth, OAuth entrypoints, session handling, route protection, and account recovery flows against the Spring backend.

## Read First

- `apps/api/CONTEXT.md` auth and OAuth sections
- `apps/api/src/main/java/vn/vinfast/aitesthub/auth/controller/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/auth/request/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/auth/response/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/user/response/`
- Epic 2 API client and auth store docs

## Backend Facts to Preserve

- Local auth endpoints live under `/api/v1/auth`.
- Login returns access token in JSON.
- Refresh token is HttpOnly cookie only.
- Refresh endpoint reads cookie and returns a new access token.
- Logout clears refresh cookie.
- OAuth providers are Google and GitHub.
- `GET /api/v1/users/me` returns current authenticated user.

## Task 3.1: Auth API Layer

Target files:

- `apps/client/src/features/auth/auth.api.ts`
- `apps/client/src/features/auth/auth.types.ts`
- `apps/client/src/features/auth/auth.schemas.ts`
- `apps/client/src/features/auth/auth.queries.ts`

Steps:

1. Read backend request/response DTOs.
2. Define DTO types exactly.
3. Implement `login`, `register`, `refreshToken`, `logout`, `verifyEmail`, `forgotPassword`, `resetPassword`, and `getMe` if backend supports each endpoint.
4. Add Zod schemas for local forms.
5. Keep transport enum/string values in English.

Acceptance:

- API functions match backend paths and methods.
- No refresh token is stored in JS.

## Task 3.2: Auth Pages

Routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Steps:

1. Use auth layout separate from app shell.
2. Build local login form with floating inputs.
3. Build register form.
4. Build forgot/reset password forms.
5. Build verify-email result page reading token from URL.
6. Show localized errors and success states.
7. Provide Google/GitHub buttons that redirect to backend OAuth authorization endpoints.

Acceptance:

- Forms are keyboard usable.
- Loading state does not shift layout.
- Error messages are localized.
- Auth screens use no app sidebar.

## Task 3.3: OAuth Flow

Steps:

1. Confirm exact backend OAuth redirect behavior in success handler.
2. If token is returned in URL, parse it in a callback route and immediately remove it from visible URL.
3. If token is returned by cookie/redirect flow, call `getMe` after redirect.
4. Store access token only in auth store.
5. Navigate to the intended route after login.

Acceptance:

- OAuth callback does not leave tokens visible in browser history if avoidable.
- Failed OAuth shows a localized error state.

## Task 3.4: Session Bootstrapping

Steps:

1. On app startup, attempt session restore only if safe state indicates a prior login.
2. Call refresh endpoint when access token is missing/expired and refresh cookie may exist.
3. Call `getMe` after refresh succeeds.
4. Clear session on refresh failure.
5. Avoid infinite refresh loops.

Acceptance:

- Reloading the app preserves a valid session.
- Expired sessions redirect to login.
- API 401 is handled once, not repeatedly.

## Task 3.5: Protected Routes

Target files:

- `apps/client/src/app/router/ProtectedRoute.tsx`
- `apps/client/src/app/router/routes.tsx`
- `apps/client/src/app/router/FirstRunProjectGate.tsx`

Steps:

1. Guard app routes.
2. Preserve `redirectTo` location.
3. Render skeleton while auth bootstrap is checking.
4. Redirect authenticated users away from login/register.
5. After auth succeeds, load active projects before routing to project-scoped pages.
6. If there are no projects, route to `/projects/new`.
7. If projects exist but no project is selected, route to `/projects`.
8. If the intended route is project-scoped, allow it only when the project exists and is accessible.

Acceptance:

- Unauthenticated app route access redirects to login.
- Authenticated users can access app shell.
- First login with zero projects shows create-project flow, not an empty dashboard.
- Project-scoped navigation is disabled or redirected until a project exists.

## Task 3.6: Security Rules

Rules:

- Never log tokens.
- Never store refresh token in local storage/session storage.
- Do not put access token in query params except when backend OAuth requires it; remove immediately.
- Use `autocomplete` attributes correctly on auth forms.
- Treat backend errors as untrusted display input; map through known translations.

## Task 3.7: Tests

Cases:

1. Login validation blocks invalid email/password.
2. Successful login stores access token and current user.
3. Logout clears session and calls backend.
4. Protected route redirects unauthenticated users.
5. Session bootstrap handles refresh success and failure.
6. Forgot/reset forms call expected API functions with token.

Use React Testing Library and MSW or mocked API module.

## Suggested Commit Slices

1. `feat(frontend): add auth api layer`
2. `feat(frontend): add auth pages`
3. `feat(frontend): add session route guards`
4. `test(frontend): cover auth flows`
