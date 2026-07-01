# Epic 2: API Client, State, and i18n

Goal: create the infrastructure layer that every feature uses for API calls, server state, environment config, local state, and translation.

## Read First

- `docs/architecture/Component_Contracts.md`
- `apps/api/CONTEXT.md`
- `apps/api/src/main/java/vn/vinfast/aitesthub/exception/`
- `apps/client/package.json`

## Task 2.1: Environment Validation

Dependencies:

- `zod`

Target files:

- `apps/client/src/lib/env.ts`

Steps:

1. Add a Zod schema for frontend env vars.
2. Validate `VITE_API_BASE_URL`.
3. Provide a default of `http://localhost:8080` only for local dev if acceptable.
4. Export a typed `env` object.
5. Fail fast with a readable message if required vars are invalid.

Acceptance:

- No component reads `import.meta.env` directly.
- Env errors are caught at app startup.

## Task 2.2: i18n Setup

Dependencies:

- `i18next`
- `react-i18next`

Target files:

- `apps/client/src/lib/i18n/index.ts`
- `apps/client/src/lib/i18n/resources/en.ts`
- `apps/client/src/lib/i18n/resources/vi.ts`
- `apps/client/src/app/providers/I18nProvider.tsx`

Steps:

1. Configure English and Vietnamese resources.
2. Create namespaces: `common`, `auth`, `projects`, `targets`, `datasets`, `testCases`, `runs`, `reports`, `rubrics`, `errors`, `status`.
3. Add language persistence in local storage.
4. Set document language on language changes.
5. Add a language switcher in the top header.
6. Ensure `Accept-Language` can be read by the API client.

Acceptance:

- No new user-visible string is hardcoded in feature components.
- Backend enum labels are translated at render time.
- Vietnamese text renders without clipping.

## Task 2.3: API Client

Dependencies:

- `axios`

Target files:

- `apps/client/src/lib/api/client.ts`
- `apps/client/src/lib/api/errors.ts`
- `apps/client/src/lib/api/types.ts`

Steps:

1. Create a single Axios instance using `env.VITE_API_BASE_URL`.
2. Attach `Authorization: Bearer <accessToken>` when auth store has a token.
3. Attach `Accept-Language` from i18n.
4. Normalize backend errors into a typed `ApiError`.
5. Handle 401 by clearing auth state and redirecting through a controlled app mechanism.
6. Preserve HttpOnly refresh cookie behavior; do not try to read refresh tokens from JS.

Acceptance:

- Feature code never imports raw Axios.
- Error rendering receives normalized error codes/messages.
- Token is never logged.

## Task 2.4: API Types

Read backend response wrappers before implementing.

Target files:

- `apps/client/src/lib/api/types.ts`

Steps:

1. Define `PageResponse<T>` matching backend pagination response.
2. Define common API response envelopes only if backend actually uses them.
3. Define `UUID = string` alias for public IDs.
4. Define shared `ReviewStatus`, run status, severity, and enum transport types from backend source.

Acceptance:

- Types match backend Java response classes.
- No numeric internal IDs in frontend API types.

## Task 2.5: TanStack Query

Dependencies:

- `@tanstack/react-query`
- optional dev tool: `@tanstack/react-query-devtools`

Target files:

- `apps/client/src/app/providers/QueryProvider.tsx`
- `apps/client/src/lib/query/keys.ts`

Steps:

1. Create a `QueryClient`.
2. Set sensible retry behavior: retry idempotent reads, do not blindly retry mutations.
3. Add query key factories by feature.
4. Wrap app root with provider.
5. Add devtools only in dev mode if installed.

Acceptance:

- Feature server state uses Query hooks, not `useEffect + fetch`.
- Query keys are typed and stable.

## Task 2.6: Zustand Stores

Target files:

- `apps/client/src/features/auth/auth.store.ts`
- `apps/client/src/features/projects/project.store.ts`

Steps:

1. Create auth store for access token and current user summary.
2. Persist only what is safe to persist.
3. Create project store only if active project is not URL-driven.
4. Keep API data out of Zustand.

Acceptance:

- Server data remains in TanStack Query.
- Auth store has explicit `setSession`, `clearSession`, and `isAuthenticated`.

## Task 2.7: Tests

Test files:

- `apps/client/src/lib/api/client.test.ts`
- `apps/client/src/lib/i18n/i18n.test.ts`
- `apps/client/src/features/auth/auth.store.test.ts`

Cases:

1. API client sends `Authorization` when token exists.
2. API client sends `Accept-Language`.
3. 401 clears auth session.
4. Language switch updates i18n language.
5. Auth store mutations work.

## Suggested Commit Slices

1. `feat(frontend): add env and i18n foundation`
2. `feat(frontend): add api client and query provider`
3. `test(frontend): cover api and state infrastructure`
