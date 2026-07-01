# E4: TestCase Module

Dependency: E3.

Test cases are QC-authored inputs and expected behavior. Results produced after execution belong to E8, not this module.

## E4.1: Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TestCase` entity linked to `Dataset` | DONE |
| 2 | Include legacy import fields: `externalId`, `sectionName`, `input`, `expectedBehavior` | DONE |
| 3 | Include roadmap fields: reference answer, variables/context, tags, priority, enabled, source, sort order | DONE |
| 4 | Add request/response DTOs and mapper | DONE |
| 5 | Add Flyway migration for `test_cases` with JSONB where appropriate | DONE |

- Commit: `feat(testcase): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E4.2: CRUD + Filtering Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TestCaseRepository` with filtering support | DONE |
| 2 | Add `TestCaseService` interface and implementation | DONE |
| 3 | Support CRUD scoped by dataset | DONE |
| 4 | Support pagination, keyword search, enabled filter, and tag filter | DONE |
| 5 | Add focused unit tests for CRUD and filtering behavior | DONE |

- Commit: `feat(testcase): add repository, service with filtering and unit tests`
- Scope: `M`
- Review: `DONE`

## E4.3: Import Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ImportStrategy` interface | DONE |
| 2 | Implement CSV import for the legacy four testcase definition columns | DONE |
| 3 | Implement Excel import only if product scope confirms it is still needed | DONE |
| 4 | Process rows in chunks and batch-check duplicates by dataset/external ID | DONE |
| 5 | Return import summary: imported, skipped, failed, and row-level errors | DONE |
| 6 | Unit test valid import, duplicates, empty file, and missing required columns | DONE |

- Commit: `feat(testcase): add import service with batch processing`
- Scope: `L`
- Review: `DONE`

## E4.4: Controller + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TestCaseController` at `/api/v1/datasets/{datasetId}/test-cases` | DONE |
| 2 | Add list endpoint with pagination/filter query params | DONE |
| 3 | Add multipart import endpoint | DONE |
| 4 | MockMvc test list filtering | DONE |
| 5 | MockMvc test CSV import success and validation failure | DONE |

- Commit: `feat(testcase): add controller with filter, import endpoint and tests`
- Scope: `M`
- Review: `DONE`
