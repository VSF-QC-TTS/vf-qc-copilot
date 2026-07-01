# E9: AI Integration Module

Dependencies: E4, E5.

This module calls external LLM APIs. Tests must mock external calls.

## E9.1: AI TestCase Generation

| # | Checklist | Status |
|---|---|---|
| 1 | Add `AIGeneratorService` interface | DONE |
| 2 | Accept requirement text and optional project/dataset context | DONE |
| 3 | Generate `TestCaseDraft` objects, not persisted entities | DONE |
| 4 | Add prompt template builder with explicit output schema | DONE |
| 5 | Retry malformed model responses with a small bounded retry count | DONE |

- Commit: `feat(ai): add ai testcase generator service`
- Scope: `M`
- Review: `DONE`

## E9.2: AI Assertion Suggestions

| # | Checklist | Status |
|---|---|---|
| 1 | Add method for suggesting assertions from testcase and response mapping context | DONE |
| 2 | Return `AssertionDraft` objects for QC review before persistence | DONE |
| 3 | Include tool expectation suggestions only when trace/tool fields are available | DONE |
| 4 | Validate model output before returning it to controllers | DONE |

- Commit: `feat(ai): add ai assertion suggestion`
- Scope: `M`
- Review: `DONE`

## E9.3: Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Mock LLM provider with WireMock or an equivalent Spring test double | DONE |
| 2 | Test valid JSON response parsing | DONE |
| 3 | Test malformed response retry and final failure | DONE |
| 4 | Test timeout/error mapping | DONE |

- Commit: `test(ai): add wiremock tests for ai services`
- Review: `DONE`

Checkpoint:

1. Tests use an `AiChatClient` test double instead of WireMock because production provider calls are isolated behind that interface.
