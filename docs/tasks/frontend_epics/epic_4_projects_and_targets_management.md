# Epic 4: Projects & Targets Management

Goal: build project and target management screens using the real backend contracts.

## Read First

Backend:

- `apps/api/src/main/java/vn/vinfast/aitesthub/project/controller/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/project/request/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/project/response/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/target/controller/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/target/request/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/target/response/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/target/entity/ResponseMapping.java`

Frontend:

- Epic 1 AppShell
- Epic 2 API client/query/i18n
- `docs/architecture/Frontend_Design_System.md` table/form rules
- `docs/product/EvalDeskQAPlatform.html` API Config tab as UX benchmark only

## Task 4.1: Project API Layer

Target files:

- `apps/client/src/features/projects/projects.api.ts`
- `apps/client/src/features/projects/projects.types.ts`
- `apps/client/src/features/projects/projects.schemas.ts`
- `apps/client/src/features/projects/projects.queries.ts`

Steps:

1. Read backend project DTOs.
2. Define request and response types.
3. Implement create, list, get, update, and archive API functions.
4. Add query keys.
5. Add mutations with query invalidation.

Acceptance:

- Project public UUID is used for all routes and mutations.
- Internal numeric IDs are never represented in UI routes.

## Task 4.2: Project List Page

Route:

- `/projects`

Steps:

1. Fetch paginated active projects.
2. Render compact table on desktop.
3. Render responsive cards or scrollable table on mobile.
4. Add search/filter if backend supports it.
5. Add empty state with create CTA.
6. Add archive action with confirmation.
7. Store pagination/search in URL params.

Acceptance:

- Loading, empty, error, and success states exist.
- Row actions are keyboard accessible.
- Pagination survives reload through URL state.
- Selecting a project navigates to `/projects/:projectId/targets` and records `lastProjectId`.

## Task 4.3: Project Form Dialog

Steps:

1. Build create/edit dialog.
2. Use React Hook Form + Zod for dashboard form.
3. Use static labels, not floating labels.
4. Submit through TanStack mutation.
5. Show backend validation errors near fields when possible.
6. Close dialog only after successful mutation.

Acceptance:

- Create and edit share schema where possible.
- Save button has stable loading state.
- Vietnamese labels do not overflow.

## Task 4.3a: First-Run Project Creation

Routes:

- `/projects/new`

Steps:

1. Build a focused create-project screen for users with zero projects.
2. Reuse the same schema and mutation as the create/edit dialog.
3. Explain the setup sequence compactly: create project, configure target, import dataset, run evaluation.
4. After successful create, navigate to `/projects/:projectId/targets` or the configuration workbench.
5. Keep the app shell in no-project mode: sidebar visible, project-scoped nav disabled, create-project action prominent.
6. If project list fetch fails, show retry and keep logout/user menu reachable.

Acceptance:

- First login with no projects has an obvious next action.
- No fake project, dashboard metrics, target, dataset, or sample run data is shown.
- The same validation and backend error mapping as normal project creation are used.
- The project switcher shows create action instead of an empty dropdown.

## Task 4.4: Target API Layer

Target files:

- `apps/client/src/features/targets/targets.api.ts`
- `apps/client/src/features/targets/targets.types.ts`
- `apps/client/src/features/targets/targets.schemas.ts`
- `apps/client/src/features/targets/targets.queries.ts`

Steps:

1. Read backend target DTOs.
2. Implement parse cURL preview endpoint.
3. Implement create, list by project, get, update, delete.
4. Implement get/save response mapping.
5. Define types for `TargetType`, HTTP method, `authConfig`, `headersTemplate`, `queryParamsTemplate`, `bodyTemplate`, and `responseMapping`.

Acceptance:

- JSON-ish fields are typed as `Record<string, unknown>` at transport boundary.
- UI validates JSON before submit.

## Task 4.5: Target List and Detail

Routes:

- `/projects/:projectId/targets`
- `/projects/:projectId/targets/new`
- `/projects/:projectId/targets/:targetId`

Steps:

1. Show targets for the route project id.
2. Include target type, method, URL, environment, timeout, default status.
3. Add create/edit/delete actions.
4. Add "Test target configuration" placeholder only if backend supports it; otherwise do not invent an endpoint.
5. Link to response mapping tab.

Acceptance:

- Long URLs truncate with tooltip and copy.
- Delete requires confirmation.
- Target create/edit never reads selected project from a global store; save payloads use the route `projectId`.

## Task 4.6: Target Form

Sections:

- Basic: name, environment, target type.
- HTTP: method, URL, timeout.
- Templates: query params, headers, body.
- Auth: auth config JSON or guided fields.
- Bindings: input binding and variable bindings.
- Connection preview: parsed cURL values and masked secrets.

Steps:

1. Use tabs or accordion for advanced sections.
2. Add JSON editor component for template objects.
3. Provide format/validate button for JSON fields.
4. Support cURL parse preview and allow user to apply parsed values.
5. Validate URL and timeout before submit.
6. Show variables supported by backend/runner, such as testcase input, context, external ID, and dataset variables only after confirming exact backend names.
7. Mask authorization headers and auth config secrets in previews.

Acceptance:

- Invalid JSON blocks submit and points to the field.
- cURL parser result is previewed before persisting.
- Secrets are visually masked if entered.
- Target form meets prototype parity for API setup while keeping backend DTOs authoritative.

## Task 4.6a: Configuration Workbench Composition

Goal: create the production equivalent of the prototype's Config area without mixing unrelated persistence concerns.

Steps:

1. Build a workbench route or tab group under the selected project/target if the information architecture supports it.
2. Include API target setup from Task 4.6.
3. Link response mapping from Task 4.7.
4. Link verification/rubric configuration to Epic 5/Epic 8 screens instead of duplicating forms.
5. Keep active tab in URL search params.
6. Show disabled roadmap items only for prototype concepts not backed by backend contracts, such as prompt version comparison if no version entity exists.

Acceptance:

- Workbench has clear tabs/sections for API config, response mapping, verification, and rubric/LLM judge references.
- Each tab owns its own form state and save action.
- No fake backend fields are added to make the prototype UI look complete.

## Task 4.7: Response Mapping UI

Fields from backend mapping:

- `answerPath`
- `suggestionsPath`
- `intentPath`
- `confidencePath`
- `sourcesPath`
- `retrievalPath`
- `memoryPath`
- `rewritePath`
- `agentPath`
- `toolPath`
- `toolCallsPath`
- `traceIdPath`
- `latencyPath`
- `customComponents`
- `missingFieldBehavior`

Steps:

1. Build mapping form grouped by answer, RAG, tool/agent, trace, custom.
2. Provide examples such as `$.data.answer` and `$.data.tool_calls`.
3. Add `missingFieldBehavior` select with translated labels but raw values `FAIL`, `SKIP`, `WARNING`.
4. Add local validation that paths start with `$` or a supported path format if that is the runner standard.
5. Save through PUT endpoint.

Acceptance:

- Mapping UI explains operational impact through concise labels/help text.
- Saved mapping refetches and shows persisted values.

## Task 4.8: Tests

Cases:

1. Project list renders loading, empty, and populated states.
2. Project form validates required fields.
3. First-run no-project route creates a project and navigates to setup.
4. Target JSON template field rejects invalid JSON.
5. cURL preview can apply parsed values.
6. Response mapping saves `missingFieldBehavior`.
7. Archive/delete confirmations protect destructive actions.

## Suggested Commit Slices

1. `feat(frontend): add project api and list`
2. `feat(frontend): add project form flows`
3. `feat(frontend): add target api and list`
4. `feat(frontend): add target configuration form`
5. `feat(frontend): add response mapping editor`
6. `test(frontend): cover project target management`
