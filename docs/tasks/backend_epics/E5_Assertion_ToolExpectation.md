# E5: Assertion & ToolExpectation Module

Dependency: E4.

Assertions evaluate chatbot outputs. Tool expectations evaluate tool/agent behavior when the target response exposes that data.

## E5.1: Assertion Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Assertion` entity linked to `TestCase` | DONE |
| 2 | Support scope/type/target component/field path/multi-field configuration | DONE |
| 3 | Support expected value, optional rubric link/override, threshold, weight, severity, enabled, sort order | DONE |
| 4 | Add request/response DTOs and mapper | DONE |
| 5 | Add Flyway migration for `assertions` | DONE |

- Commit: `feat(assertion): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E5.2: ToolExpectation Entity + DTO + Mapper

| # | Checklist | Status |
|---|---|---|
| 1 | Add `ToolExpectation` entity linked to `TestCase` | DONE |
| 2 | Support expected source/tool/agent, argument assertions, sequence, min/max calls | DONE |
| 3 | Support optional rubric link/override, threshold, required flag, severity, enabled | DONE |
| 4 | Add request/response DTOs and mapper | DONE |
| 5 | Add Flyway migration for `tool_expectations` | DONE |

- Commit: `feat(tool-expectation): add entity, dto, mapper and migration`
- Scope: `M`
- Review: `DONE`

## E5.3: Services

| # | Checklist | Status |
|---|---|---|
| 1 | Add `AssertionService` CRUD scoped by test case | DONE |
| 2 | Add `ToolExpectationService` CRUD scoped by test case | DONE |
| 3 | Validate assertion/tool expectation types against supported enum values | DONE |
| 4 | Unit test both services | DONE |

- Commit: `feat(assertion): add assertion and tool expectation services`
- Review: `DONE`

## E5.4: Controllers + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `AssertionController` at `/api/v1/test-cases/{testCaseId}/assertions` | DONE |
| 2 | Add `ToolExpectationController` at `/api/v1/test-cases/{testCaseId}/tool-expectations` | DONE |
| 3 | Add MockMvc CRUD tests for both controllers | DONE |
| 4 | Add validation tests for unsupported assertion/tool expectation types | DONE |

- Commit: `feat(assertion): add controllers and integration tests`
- Review: `DONE`
