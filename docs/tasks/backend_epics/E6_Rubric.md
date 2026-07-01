# E6: Rubric Module

Dependency: E1.

Rubrics provide reusable LLM judge criteria at global, project, dataset, or testcase scope.

## E6.1: Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Rubric` entity linked to `Project` where applicable | DONE |
| 2 | Support rubric name, scope, content, version/status, and metadata | DONE |
| 3 | Add request/response DTOs and mapper | DONE |
| 4 | Add Flyway migration for `rubrics` | DONE |

- Commit: `feat(rubric): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E6.2: Service + Controller

| # | Checklist | Status |
|---|---|---|
| 1 | Add `RubricRepository` | DONE |
| 2 | Add `RubricService` interface and implementation | DONE |
| 3 | Support CRUD plus publish/archive behavior if versioning is implemented | DONE |
| 4 | Add `RubricController` under `/api/v1/projects/{projectId}/rubrics` | DONE |

- Commit: `feat(rubric): add service and controller`
- Scope: `M`
- Review: `DONE`

## E6.3: Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Unit test `RubricServiceImpl` | DONE |
| 2 | MockMvc test rubric CRUD endpoints | DONE |
| 3 | Test invalid publish/archive transitions if supported | DONE |

- Commit: `test(rubric): add unit and integration tests`
- Review: `DONE`
