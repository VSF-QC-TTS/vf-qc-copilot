# Epic 7: Results, Reporting, and Manual Review

Goal: build the analysis screens for completed runs, detailed results, raw payload inspection, and manual QC review.

## Read First

Backend:

- `apps/api/src/main/java/vn/vinfast/aitesthub/report/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/result/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/manualreview/`
- `apps/api/src/main/java/vn/vinfast/aitesthub/result/controller/`

Design:

- `Frontend_Design_System.md` table, JSON display, and status rules
- `docs/product/EvalDeskQAPlatform.html` Results section as UX benchmark only

## Task 7.1: Report API Layer

Steps:

1. Implement get run report.
2. Implement get result detail list if separate endpoint exists.
3. Implement manual review submit endpoint.
4. Define DTOs for summary, test result, assertion result, tool expectation result, and review state.

Acceptance:

- Final status and auto status are modeled separately.
- Review status enum matches backend `review_status`.

## Task 7.2: Run Report Dashboard

Route:

- `/runs/:runId/report`

Steps:

1. Render summary counts.
2. Render pass rate.
3. Render status distribution.
4. Render run metadata: target, dataset, run mode, created/completed times.
5. Provide report refresh.
6. Show pass/fail/error/uncertain counts and duration if backend returns them.
7. Include comparison summary only when backend exposes A/B or version comparison result data.

Acceptance:

- Loading skeleton matches dashboard layout.
- Failed/error/uncertain are visually distinct.
- Empty or incomplete report state is handled.
- Summary cards match prototype information density while using real report DTOs.

## Task 7.3: Results Table

Steps:

1. Render testcase result rows.
2. Include final status, auto status, score, latency, section, external ID, review marker.
3. Add filters by final status, section, severity, reviewed/unreviewed.
4. Add row expansion or detail drawer.
5. Keep filters in URL.
6. Include quick filters equivalent to prototype: all, failed, passed, error, and uncertain when available.
7. Expanded row preview should show the most important failed field diffs before opening the full drawer.

Acceptance:

- Large result sets remain usable.
- Long text truncates with accessible detail.
- Row actions work on touch devices.
- Users can triage failures from the table without opening raw JSON first.

## Task 7.4: Result Detail Drawer

Sections:

- Testcase input and expected behavior.
- Actual answer/components.
- Assertion results.
- Tool expectation results.
- Field-level expected-vs-actual diffs.
- Raw request/response JSON.
- Manual review controls.

Steps:

1. Build stable detail layout.
2. Use JSON/code display component for raw payloads.
3. Add copy buttons.
4. Add expand/collapse for large payloads.
5. Add `ResultFieldDiff` rows with field path, expected value, actual value, assertion method, score/threshold, and status when available.
6. Keep normalized answer/components side by side with raw payloads.
7. Prefer redacted payloads from backend for copy; if backend does not redact, mask known secret headers before copying.

Acceptance:

- Raw JSON never overflows page.
- Copy does not include secrets if redacted payload is provided.
- Detail drawer exceeds prototype by separating assertion, tool expectation, raw payload, and manual review context.

## Task 7.5: Manual Review

Steps:

1. Show auto status and final status separately.
2. Let reviewer choose reviewed status.
3. Require or encourage note when overriding failed/error/uncertain statuses.
4. Submit batch review if backend endpoint is batch.
5. Refresh report after save.

Acceptance:

- Review changes update pass rate after refetch.
- Reviewer note is preserved.
- Save state is visible.

## Task 7.6: Tests

Cases:

1. Summary pass rate calculation/display.
2. Results filtering by status.
3. Detail drawer renders assertion/tool rows.
4. JSON viewer copy/expand works.
5. Manual review submit sends correct payload.

## Suggested Commit Slices

1. `feat(frontend): add report api dashboard`
2. `feat(frontend): add result table detail drawer`
3. `feat(frontend): add manual review flow`
4. `test(frontend): cover reporting review`
