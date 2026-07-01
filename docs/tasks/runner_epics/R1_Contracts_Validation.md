# R1: Contracts & Validation

Dependencies: Backend E7, Backend E8.

The runner must treat backend DTOs as contracts. Do not invent incompatible payload shapes.

## R1.1: RunSnapshot Types

| # | Checklist | Status |
|---|---|---|
| 1 | Add TypeScript types for backend `RunSnapshotDto` | DONE |
| 2 | Add runtime schema validation for run, target, test cases, assertions, tool expectations, and rubrics | DONE |
| 3 | Preserve public UUIDs for result callback mapping | DONE |
| 4 | Add sample fixture matching current backend snapshot | DONE |
| 5 | Unit test valid and invalid snapshot parsing | DONE |

- Commit: `feat(runner): add run snapshot contracts`
- Scope: `M`
- Review: `DONE`

## R1.2: Result Callback Types

| # | Checklist | Status |
|---|---|---|
| 1 | Add TypeScript types for `ResultIngestionRequest` | DONE |
| 2 | Add schemas for `TestResultIngestionItem`, `AssertionResultIngestionItem`, and `ToolExpectationResultIngestionItem` | DONE |
| 3 | Map runner internal result model to backend callback model | DONE |
| 4 | Validate final callback payload before HTTP submit | DONE |
| 5 | Unit test payload validation for required IDs and statuses | DONE |

- Commit: `feat(runner): add result callback contracts`
- Scope: `M`
- Review: `DONE`
