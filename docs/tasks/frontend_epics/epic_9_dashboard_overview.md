# Epic 9: Dashboard Overview

Goal: build the project dashboard that helps QA users see current quality, recent activity, trend movement, and areas needing review.

## Read First

Backend:

- `apps/api/src/main/java/vn/vinfast/aitesthub/project/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/run/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/report/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/result/`

Frontend:

- Epic 1 AppShell
- Epic 2 API client/query/i18n
- Epic 6 run status models
- Epic 7 report/result models
- `docs/architecture/Frontend_Design_System.md`
- `docs/architecture/Component_Contracts.md`
- `docs/product/EvalDeskQAPlatform.html` Dashboard section as UX benchmark only

## Task 9.1: Dashboard Data Contract

Steps:

1. Search backend for dashboard/overview endpoints first.
2. If a dashboard endpoint exists, define types from its response DTO.
3. If no dashboard endpoint exists, identify the smallest existing endpoints needed for recent runs and report summaries.
4. Document which metrics are backend-provided and which are derived client-side.
5. Do not derive business metrics that require hidden data, such as exact pass-rate trend, unless all required fields are available.

Acceptance:

- Dashboard API layer uses real backend response classes.
- Missing metrics are omitted or shown as unavailable, not faked.
- Query keys are scoped by project public UUID.

## Task 9.2: Project Overview Route

Route:

- `/projects/:projectId/dashboard`

Steps:

1. Add dashboard route under the authenticated app shell.
2. Load selected project context.
3. Render loading skeletons matching the final layout.
4. Render empty state when no runs or datasets exist.
5. Render API error state with retry.
6. Keep dashboard date range/filter state in URL search params if filters are added.
7. If no projects exist, never render this route as the first-login surface; rely on Epic 3/4 first-run routing.
8. If the current project exists but setup is incomplete, render the correct setup CTA instead of empty metrics.

Acceptance:

- Dashboard is the first useful project screen, not a marketing page.
- Project switcher and breadcrumbs stay coherent.
- Mobile layout stacks panels without overlap.
- Dashboard is project-scoped and never fabricates data for onboarding.

## Task 9.3: Metric Cards

Metrics to include when data exists:

- Total test cases.
- Latest pass rate.
- Passed, failed, error, and uncertain counts.
- Active target or active configuration summary.
- Last run timestamp/status.

Steps:

1. Use `DashboardMetricCard` from component contracts.
2. Show clear labels, values, delta/context, and loading state.
3. Use semantic status colors from the design system.
4. Avoid decorative cards; cards here are repeated metric items, which are allowed.

Acceptance:

- Values are readable at desktop and mobile widths.
- Missing values show `N/A` or an empty-state phrase through i18n.
- `UNCERTAIN` is distinct from failed/error.

## Task 9.4: Trend and Comparison Panels

Steps:

1. Build pass-rate trend only if backend provides historical report/run summary data.
2. Render recent N runs as the fallback when trend points are unavailable.
3. Add A/B prompt/config comparison only if backend exposes version/comparison data.
4. Show comparison winner/lead only when statistically meaningful data is returned or the backend already computes it.
5. Make chart/table alternatives accessible: data table or textual summaries must be available.

Acceptance:

- Trend panel reaches prototype intent without inventing historical numbers.
- A/B UI is disabled/roadmap or omitted when backend lacks comparison contracts.
- Charts do not rely on color alone.

## Task 9.5: Recent Runs and Failure Hotspots

Steps:

1. Render recent runs with run ID/public ID, target, dataset, status, pass rate, case count, duration, and created time when available.
2. Link each row to run report.
3. Add quick filters by status if backend supports them.
4. Show failure hotspots by section/assertion/tool only if report/result data exposes enough grouping fields.
5. Provide clear call to action: run dataset, review failed results, or configure target depending on current project state.
6. Show "Compare runs" only when two compatible completed runs exist and a real compare endpoint/backend contract is available.
7. Do not show A/B experiment controls from the dashboard until Epic 10/backend experiment support exists.

Acceptance:

- Recent runs table is keyboard accessible.
- Long target/dataset names truncate with full value available.
- Failure hotspots help triage; they do not replace the detailed report.
- A/B language is not used for plain independent runs.

## Task 9.6: Tests

Cases:

1. Dashboard renders loading, empty, error, and populated states.
2. Metric cards show `UNCERTAIN` separately from failed/error.
3. Recent run row navigates to report.
4. Trend panel falls back when historical data is unavailable.
5. A/B comparison is hidden or disabled when backend lacks comparison fields.

## Suggested Commit Slices

1. `feat(frontend): add dashboard data layer`
2. `feat(frontend): add project dashboard overview`
3. `test(frontend): cover dashboard overview`
