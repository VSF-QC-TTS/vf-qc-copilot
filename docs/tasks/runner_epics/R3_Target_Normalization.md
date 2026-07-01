# R3: Target Execution & Normalization

Dependencies: R1.

Execute target requests safely and normalize raw target responses into components used by assertions and result payloads.

## R3.1: Request Template Execution

| # | Checklist | Status |
|---|---|---|
| 1 | Interpolate testcase `input` and `variables` into target body/query/header templates | DONE |
| 2 | Support current HTTP target method/url/header/body shape | DONE |
| 3 | Apply timeout and retry count from run options | DONE |
| 4 | Capture latency and raw response/error details | DONE |
| 5 | Unit test template interpolation, query params, auth redaction, and response parsing | DONE |

- Commit: `feat(runner): execute target request templates`
- Scope: `L`
- Review: `DONE`

## R3.2: Response Normalizer

| # | Checklist | Status |
|---|---|---|
| 1 | Resolve response mapping paths for answer, suggestions, intent, sources, tool calls, agent, and trace | DONE |
| 2 | Preserve normalized components and raw response separately | DONE |
| 3 | Support missing-field behavior from backend mapping | DONE |
| 4 | Extract tool calls into a stable array shape | DONE |
| 5 | Unit test JSONPath mapping and missing-field behavior | DONE |

- Commit: `feat(runner): normalize target responses`
- Scope: `M`
- Review: `DONE`
