# R7: Test Strategy & Smoke Flows

Dependencies: R0-R6 as applicable.

This epic keeps runner correctness practical and focused on adapter behavior.

## R7.1: Unit Test Coverage

| # | Checklist | Status |
|---|---|---|
| 1 | Test config loading and validation | DONE |
| 2 | Test snapshot/result contract validation | DONE |
| 3 | Test promptfoo config builder mappings | DONE |
| 4 | Test response normalization and result aggregation | DONE |
| 5 | Test security guards and redaction | DONE |

- Commit: `test(runner): add unit coverage for adapter logic`
- Scope: `M`
- Review: `WARNING`

## R7.2: Integration Smoke

| # | Checklist | Status |
|---|---|---|
| 1 | Add Redis-backed smoke test for consuming one run job | TODO |
| 2 | Mock backend internal API and assert result callback body | TODO |
| 3 | Mock target chatbot API and validate request templating | TODO |
| 4 | Mock promptfoo evaluate for deterministic result mapping | DONE |
| 5 | Document local smoke command | DONE |

- Commit: `test(runner): add redis to backend smoke flow`
- Scope: `L`
- Review: `TODO`

Local smoke command: run `rtk npm run smoke:promptfoo` from `apps/runner`. It uses an in-memory provider and validates
the installed promptfoo Node API without calling an external LLM.
