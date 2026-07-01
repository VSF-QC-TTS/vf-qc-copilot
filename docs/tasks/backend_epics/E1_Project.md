# E1: Project Module

Dependency: E0.

This epic is implemented. New tasks should extend it instead of replacing it.

## E1.1: Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Project` entity with internal `BIGINT id` and public UUID `publicId` | DONE |
| 2 | Add request/response DTOs using current API conventions | DONE |
| 3 | Add `ProjectMapper` | DONE |
| 4 | Add Flyway migration for `projects` | DONE |
| 5 | Link project owner/creator to `User` | DONE |

- Commit: `feat(project): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E1.2: Repository + Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ProjectRepository` | DONE |
| 2 | Add `ProjectService` interface and implementation | DONE |
| 3 | Support create, find by `publicId`, paginated list, update, archive | DONE |
| 4 | Handle missing projects with shared error handling | DONE |
| 5 | Add focused service tests | DONE |

- Commit: `feat(project): add repository, service and unit tests`
- Scope: `M`
- Review: `DONE`

## E1.3: Controller + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ProjectController` at `/api/v1/projects` | DONE |
| 2 | Implement create/get/list/update/archive endpoints | DONE |
| 3 | Add MockMvc tests for create success | DONE |
| 4 | Add MockMvc tests for not found | DONE |
| 5 | Add MockMvc tests for validation errors | DONE |

- Commit: `feat(project): add controller and integration tests`
- Scope: `M`
- Review: `DONE`

## Checkpoint: Project CRUD

| # | Check | Status |
|---|---|---|
| 1 | Project API uses `publicId`, not internal DB `id` | DONE |
| 2 | Project list hides archived records | DONE |
| 3 | Flyway migration creates expected schema | DONE |
