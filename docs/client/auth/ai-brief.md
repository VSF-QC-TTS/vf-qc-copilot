# Client Auth AI Brief

File này dùng để giao việc cho AI coding agent trong Antigravity/Gemini. Mục tiêu không phải là bắt agent code ngay, mà bắt nó đọc context, ghi lại hiểu biết, lập plan theo phase, rồi mới xin xác nhận trước khi implement.

## Prompt Dùng Cho Agent

Paste prompt này vào agent:

```text
You are planning the client auth implementation for this repository.

Do not write code yet.

First, read these files in order:
1. docs/client/auth/ai-brief.md
2. docs/client/auth/implementation-checklist.md
3. docs/api/auth/context.md
4. docs/api/auth/client-contract.md
5. docs/planning/client-backend-assignment-with-queue.md only for high-level product context. If it conflicts with api/auth context or client-contract, ignore the older assignment doc.

Then inspect the repository and answer:
- Is there an existing client app?
- If yes, what framework, package manager, router, state management, form library, API client, and test setup does it use?
- If no, propose a client scaffold plan and ask for approval before creating files.

Before implementation, create or update a planning/context file at:
docs/client/auth/plan.md

The plan file must include:
- Current repo/client findings
- Backend API facts copied from docs/api/auth/context.md
- Checklist status copied from docs/client/auth/implementation-checklist.md
- Phase-by-phase implementation plan
- Files expected to be created or changed
- Acceptance criteria per phase
- Test/typecheck/lint commands to run
- Open questions or assumptions

Only after the user approves docs/client/auth/plan.md, implement phase 1.
Implement one phase at a time and run verification after each phase.

Rules:
- Do not change backend code unless a proven backend bug blocks the client and you have a failing test.
- Do not invent endpoints, response bodies, roles, statuses, or error shapes.
- Do not implement OAuth, project screens, dataset screens, or test-run screens.
- Use the backend contract from docs/api/auth/client-contract.md as source of truth.
```

## Recommended Phase Plan

The agent should plan work in these phases.

### Phase 0: Repository Discovery

Agent must inspect:

- Existing `apps/` structure
- Root package manager files
- Existing client app, if any
- Existing routing/state/form/API conventions
- Existing styling system
- Existing test commands

Expected output in `docs/client/auth/plan.md`:

- `Client exists: yes/no`
- Framework and package manager
- Current app entry points
- Existing conventions to follow
- Whether scaffolding is needed

### Phase 1: API Contract And Error Context

Agent must read:

- `docs/api/auth/context.md`
- `docs/api/auth/client-contract.md`

Expected plan:

- Define client auth request/response types.
- Define `ApiErrorResponse` and `ApiFieldError`.
- Define helper to detect problem-detail errors.
- Define helper to map `fieldErrors` to form fields.
- Define global auth error map.

Acceptance criteria:

- Types match backend contract exactly.
- Error mapping uses `code` and `messageCode`, not backend English text as primary UI copy.
- `traceId` is preserved for support/debug context.

### Phase 2: HTTP Client And Token Flow

Agent must plan:

- Base API client with `credentials: "include"`.
- Optional `Authorization: Bearer <accessToken>`.
- Problem-detail parsing.
- `ACCESS_TOKEN_EXPIRED` refresh once and retry once.
- Refresh failure clears session.

Acceptance criteria:

- No infinite refresh loop.
- Refresh token is never read or stored by client.
- Endpoint wrappers exist for all auth endpoints.

### Phase 3: Auth State

Agent must plan:

- Auth state shape: `accessToken`, `user`, `status`.
- Actions: login, logout, hydrate current user, set session, clear session.
- Storage decision: memory first; `sessionStorage` only if reload persistence is required.

Acceptance criteria:

- Login stores access token and user.
- Logout calls backend then clears local state even if backend fails.
- `USER_NOT_FOUND` clears session.

### Phase 4: Auth Pages

Agent must plan these pages:

- Login
- Register
- Forgot password
- Reset password
- Verify email

Acceptance criteria:

- Each form has loading and error states.
- Field errors attach to correct fields.
- Success states are explicit.
- Missing token states are handled before API calls.
- Token invalid/used/expired states are distinct for verify/reset pages.

### Phase 5: Routing And Guards

Agent must plan:

- Guest-only auth routes.
- Authenticated route guard.
- Redirect behavior.

Acceptance criteria:

- Anonymous users cannot access protected app routes.
- Authenticated users do not stay on login/register.
- Auth hydration works on reload if persistence is implemented.

### Phase 6: Tests And Verification

Agent must plan tests for:

- API error parsing.
- Field error mapping.
- Auth state login/logout/clear behavior.
- Refresh retry once.
- Page-level success/error states where practical.

Agent must identify actual commands from package scripts instead of inventing them.

## Required Plan File Shape

`docs/client/auth/plan.md` should use this structure:

```md
# Client Auth Plan

## Repo Findings

## API Context Summary

## Assumptions

## Open Questions

## Phase 0: Repository Discovery

## Phase 1: API Contract And Error Context

## Phase 2: HTTP Client And Token Flow

## Phase 3: Auth State

## Phase 4: Auth Pages

## Phase 5: Routing And Guards

## Phase 6: Tests And Verification

## Files To Create Or Change

## Verification Commands
```

## Anti-Hallucination Rules

The agent must not invent:

- `/api/auth/*` paths
- Register response body
- Verify email response body
- Refresh response shape different from `LoginResponse`
- User roles outside `QC_MEMBER`, `QC_LEAD`, `ADMIN`
- User statuses outside `PENDING_EMAIL_VERIFICATION`, `ACTIVE`, `DISABLED`
- Refresh token access from JavaScript
- Resend verification endpoint

If the client app does not exist, the agent must ask before scaffolding.
