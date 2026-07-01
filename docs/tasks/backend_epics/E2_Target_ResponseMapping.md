# E2: Target & ResponseMapping Module

Dependency: E1.

This epic is implemented. Future work should add security hardening and sampling behavior without redesigning the slice.

## E2.1: Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Target` entity linked to `Project` | DONE |
| 2 | Support HTTP and LLM target configuration fields | DONE |
| 3 | Add `ResponseMapping` entity linked one-to-one with `Target` | DONE |
| 4 | Add request/response DTOs and MapStruct mappers | DONE |
| 5 | Add Flyway migration for `targets` and `response_mappings` | DONE |

- Commit: `feat(target): add target and response mapping entities, dto, mapper`
- Review: `DONE`

## E2.2: cURL Parser Service

| # | Checklist | Status |
|---|---|---|
| 1 | Add `CurlParserService` for raw cURL input | DONE |
| 2 | Parse method, URL, headers, and body | DONE |
| 3 | Generate a target preview with `{{input}}` binding support | DONE |
| 4 | Test JSON POST parsing | DONE |
| 5 | Test GET/query parsing | DONE |
| 6 | Reject invalid cURL with `BusinessException` | DONE |

- Commit: `feat(target): add curl parser service with unit tests`
- Review: `DONE`

## E2.3: Services

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TargetService` CRUD scoped by project | DONE |
| 2 | Add `ResponseMappingService` get/save behavior scoped by target | DONE |
| 3 | Use cURL parser for parse-preview endpoint | DONE |
| 4 | Add focused service tests | DONE |

- Commit: `feat(target): add target and response mapping services`
- Review: `DONE`

## E2.4: Controllers + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `TargetController` at `/api/v1/projects/{projectId}/targets` | DONE |
| 2 | Add `POST /parse-curl` preview endpoint | DONE |
| 3 | Add global target endpoints under `/api/v1/targets/{targetId}` | DONE |
| 4 | Add `ResponseMappingController` at `/api/v1/targets/{targetId}/response-mapping` | DONE |
| 5 | Add MockMvc coverage for create and mapping save | DONE |

- Commit: `feat(target): add controllers and integration tests`
- Review: `DONE`
