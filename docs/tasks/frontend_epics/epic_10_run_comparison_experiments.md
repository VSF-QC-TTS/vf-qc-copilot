# Epic 10: Run Comparison & A/B Experiments

Status: PENDING for Run Compare UI and basic A/B Experiment UI. Prompt/config version promotion remains BLOCKED until backend versioning contracts exist.

Goal: help QA users compare completed runs and, later, manage planned A/B experiments without pretending independent runs are controlled experiments.

## Definitions

- `Run Compare`: compare two completed runs, usually baseline vs candidate, on the same dataset/scope.
- `A/B Experiment`: one planned evaluation that triggers and tracks two or more variants under one experiment entity.
- `Variant`: target/config/rubric/prompt/model snapshot used for one branch of the comparison.

Do not use "A/B" labels for independent runs unless backend exposes experiment or variant semantics.

## Read First

Backend:

- `docs/tasks/backend_epics/E11_Experiment_Comparison.md`
- `apps/api/src/main/java/vn/vinfast/aitesthub/run/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/result/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/experiment/`
- `GET /api/v1/runs/compare?baseRunId=&candidateRunId=`
- `POST /api/v1/projects/{projectId}/experiments`
- `GET /api/v1/projects/{projectId}/experiments`
- `GET /api/v1/experiments/{experimentId}`
- `POST /api/v1/experiments/{experimentId}/start`
- `GET /api/v1/experiments/{experimentId}/comparison`

Frontend:

- Epic 6 run execution.
- Epic 7 reports/results.
- Epic 9 dashboard.
- `docs/architecture/Component_Contracts.md` `RunComparisonSummary`.
- `docs/architecture/Frontend_Design_System.md` A/B and comparison rules.

## Task 10.1: Capability Detection

Steps:

1. Read backend controllers before exposing any compare/experiment button.
2. Add API types for implemented run comparison response DTOs.
3. Hide or disable promotion/version controls because backend version promotion is still missing.
4. If promotion controls are disabled, show a concise roadmap label in development builds only or in documented product planning surfaces, not as broken user-facing controls.

Acceptance:

- No frontend-only fake comparison payloads.
- No hardcoded demo A/B rows from the mentor prototype.
- Run Compare uses `GET /api/v1/runs/compare`.
- A/B Experiment uses experiment endpoints, not separate manual frontend-triggered runs.

## Task 10.2: Run Compare UI

Route:

- `/runs/compare?baseRunId=...&candidateRunId=...`

Steps:

1. Let users pick two completed runs from the same project.
2. Validate compatibility: same dataset, same selected section/cases when backend exposes scope fields.
3. Fetch backend comparison summary.
4. Render regressions, fixes, unchanged cases, pass-rate delta, latency delta, and cost delta when returned.
5. Render testcase-level diffs with assertion/tool expectation changes.
6. Link each diff to the detailed result drawer/report.

Acceptance:

- Comparison is reproducible through URL params.
- Incompatible runs cannot be compared silently.
- Users see what changed and why, not just a winner.

## Task 10.3: A/B Experiment UI

Routes:

- `/projects/:projectId/experiments`
- `/experiments/:experimentId`

Steps:

1. Use backend experiment create/list/detail/start APIs.
2. Let users define variants from backend-supported snapshots: target, response mapping, rubric, prompt/config, model, and runtime options.
3. Require dataset/scope selection once at experiment level.
4. Show estimated call count and expected cost before start.
5. Trigger experiment through backend, not by manually starting unrelated frontend run calls.
6. Show live progress per variant if backend exposes it.
7. Show winner/recommendation only if backend comparison computes or returns enough evidence.

Acceptance:

- Variants are explicit and auditable.
- Experiment result links back to the runs/results used to compute it.
- Promotion of a winning variant is unavailable unless backend supports promotion state.

## Task 10.4: Dashboard Integration

Steps:

1. Add comparison summary panel only when backend exposes comparison/experiment data.
2. Show recent experiments separately from recent runs.
3. Keep A/B status out of normal dashboard cards if there is no active experiment.
4. Link comparison summaries to full compare/experiment detail pages.

Acceptance:

- Dashboard remains useful without experiments.
- A/B UI does not confuse first-run/no-project users.

## Task 10.5: Tests

Cases:

1. Compare button is hidden/disabled when backend capability is absent.
2. Incompatible runs cannot be compared.
3. Compare route renders regressions/fixes/unchanged summary.
4. A/B experiment creation sends exact backend request payload.
5. Dashboard renders comparison panel only with contract-backed data.

## Suggested Commit Slices

1. `feat(frontend): add run compare api ui`
2. `feat(frontend): add experiment management ui`
3. `feat(frontend): surface comparison summaries`
4. `test(frontend): cover comparison experiments`
