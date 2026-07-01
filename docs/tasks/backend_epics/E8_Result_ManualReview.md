# E8: Result & ManualReview Module

Dependencies: E7, E4.

Results are system-generated after a run. Manual reviews are QC decisions layered on top of automated results.

## E8.1: Result Entities

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TestResult` entity linked to `Run` and `TestCase` | DONE |
| 2 | Add `AssertionResult` entity linked to `TestResult` and `Assertion` | DONE |
| 3 | Add `ToolExpectationResult` linked to `TestResult` and `ToolExpectation` | DONE |
| 4 | Add DTOs and mappers | DONE |
| 5 | Add Flyway migration for result tables | DONE |

- Commit: `feat(result): add result entities, dto, mapper and migrations`
- Scope: `L`
- Review: `DONE`

## E8.2: Result Ingestion API

| # | Checklist | Status |
|---|---|---|
| 1 | Add internal endpoint `POST /internal/runs/{runId}/results` or versioned equivalent | DONE |
| 2 | Authenticate runner-to-backend calls with service credentials, not user JWT | DONE |
| 3 | Accept batched result payloads and persist in chunks | DONE |
| 4 | Mark run `COMPLETED` when final batch is received | DONE |
| 5 | Unit test batch save and completion update behavior | DONE |

- Commit: `feat(result): add result ingestion api for runner callback`
- Scope: `L`
- Review: `DONE`

## E8.3: ManualReview Entity + Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ManualReview` entity linked to `TestResult` | DONE |
| 2 | Support status override, notes, reviewer, and timestamps | DONE |
| 3 | Add `ManualReviewService` | DONE |
| 4 | Add Flyway migration | DONE |
| 5 | Unit test override behavior | DONE |

- Commit: `feat(result): add manual review entity and service`
- Scope: `M`
- Review: `DONE`

## E8.4: Report Aggregation Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ReportService` for totals, passed, failed, uncertain, and pass rate | DONE |
| 2 | Return test results with assertion/tool expectation breakdown | DONE |
| 3 | Include manual review override state when present | DONE |
| 4 | Unit test pass-rate and override calculations | DONE |

- Commit: `feat(result): add report aggregation service`
- Scope: `M`
- Review: `DONE`

## E8.5: Controllers + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ResultController` for run reports and result listing | DONE |
| 2 | Add compare endpoint if product scope still needs it | DONE |
| 3 | Add `ManualReviewController` for result review submission | DONE |
| 4 | MockMvc test report shape and manual review submission | DONE |

- Commit: `feat(result): add controllers and integration tests`
- Review: `DONE`

Checkpoint:

1. `GET /api/v1/runs/{runId}/report` and `GET /api/v1/runs/{runId}/results` cover report and listing scope.
2. Compare endpoint was not added because current product scope does not define a concrete compare contract beyond report/listing.
3. `POST /api/v1/runs/{runId}/review` supports batch manual review submission.
