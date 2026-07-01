# E3: Dataset Module

Dependency: E1.

Datasets group test cases inside a project. This slice is implemented and verified in the current backend.

## E3.1: Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Dataset` entity linked to `Project` and creator `User` | DONE |
| 2 | Include name, description, category/tags/metadata fields needed by the roadmap | DONE |
| 3 | Add request/response DTOs using records and OpenAPI schema annotations | DONE |
| 4 | Add `DatasetMapper` | DONE |
| 5 | Add Flyway migration for `datasets` after `V3` | DONE |

- Commit: `feat(dataset): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E3.2: Service + Controller

| # | Checklist | Status |
|---|---|---|
| 1 | Add `DatasetRepository` | DONE |
| 2 | Add `DatasetService` interface and implementation | DONE |
| 3 | Support create, find by `publicId`, paginated list by project, update, archive/disable | DONE |
| 4 | Add `DatasetController` at `/api/v1/projects/{projectId}/datasets` plus direct dataset endpoints where needed | DONE |
| 5 | Keep AI generation as a later E9 integration, not hardwired service logic | DONE |

- Commit: `feat(dataset): add service and controller`
- Scope: `M`
- Review: `DONE`

## E3.3: Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Unit test `DatasetServiceImpl` | DONE |
| 2 | MockMvc test dataset CRUD endpoints | DONE |
| 3 | MockMvc test creating a dataset for a missing project returns 404 | DONE |
| 4 | Verify APIs expose `publicId`, never internal DB `id` | DONE |

- Commit: `test(dataset): add unit and integration tests`
- Review: `DONE`
