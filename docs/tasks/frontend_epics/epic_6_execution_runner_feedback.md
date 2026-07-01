# Epic 6: Execution Runner & Feedback

Goal: allow users to trigger dataset runs, observe status, and navigate to reports.

## Read First

Backend:

- `apps/api/src/main/java/vn/vinfast/aitesthub/run/controller/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/run/request/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/run/response/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/run/dto/RunSnapshotDto.java`

Runner context:

- `apps/api/CONTEXT.md` runner integration state
- `docs/tasks/runner_epics/`
- `docs/product/EvalDeskQAPlatform.html` Test Run section as UX benchmark only

## Task 6.1: Run API Layer

Steps:

1. Define run request/response types from backend source.
2. Implement trigger run endpoint under dataset.
3. Implement get run status.
4. Implement dataset run history.
5. Define query keys and mutations.

Acceptance:

- Run mode values match backend enum.
- Selected cases/section fields match backend request DTO exactly.

## Task 6.2: Trigger Run Modal

Steps:

1. Open from dataset detail/testcase table.
2. Let user select target.
3. Let user select run scope: full dataset, selected section, selected cases if backend supports each.
4. Include options: include LLM judge, include tool expectations, max concurrency, timeout, retry count if backend request supports them.
5. Submit and navigate to run detail or show run status drawer.
6. Show estimated call count before trigger when it can be derived from selected dataset/cases and enabled comparison modes.
7. Support A/B target/config selection only if backend request DTO exposes comparison inputs; otherwise keep the prototype A/B concept out of the active form.

Acceptance:

- Cannot trigger without valid target/dataset.
- User sees immediate feedback after trigger.
- Backend validation errors map to form.
- Trigger flow makes cost/risk visible before sending many runner calls.

## Task 6.3: Run Status Polling

Steps:

1. Poll `GET /api/v1/runs/{runId}` while run is non-terminal.
2. Stop polling on terminal statuses.
3. Use backoff or sensible interval.
4. Provide manual refresh.
5. Show last updated time.
6. Render a `RunProgressPanel` with completed/total counts, current phase/status, elapsed time, and terminal report link.
7. Render recent or live per-case rows when the backend snapshot includes them: external ID, input preview, status, latency, and failure reason.
8. Distinguish `FAILED`, `ERROR`, and `UNCERTAIN`; do not collapse them into one red state.

Acceptance:

- Polling stops when component unmounts.
- Polling does not continue forever after completed/failed run.
- User can navigate to report when completed.
- Live run feedback reaches prototype parity without relying on fake progress rows.

## Task 6.4: Run History

Steps:

1. Build dataset run history panel/page.
2. Show status, created time, target, scope, pass/fail counts if backend response includes them.
3. Link to report.
4. Add filters by status/date if backend supports them.

Acceptance:

- Status badges use design system colors.
- Empty state explains no runs yet.

## Task 6.5: Tests

Cases:

1. Trigger modal blocks invalid submission.
2. Successful trigger calls correct endpoint and navigates.
3. Polling transitions from `PENDING` to `COMPLETED`.
4. Polling stops on terminal status.
5. Run history renders statuses.

## Suggested Commit Slices

1. `feat(frontend): add run api layer`
2. `feat(frontend): add trigger run flow`
3. `feat(frontend): add run status polling`
4. `test(frontend): cover run feedback`
