# R4: Promptfoo Adapter

Dependencies: R1, R3.

Use promptfoo as the evaluation engine without making promptfoo YAML the source of truth.

## R4.1: Config Builder

| # | Checklist | Status |
|---|---|---|
| 1 | Convert `RunSnapshot` to in-memory promptfoo test suite object | DONE |
| 2 | Create custom provider function that uses runner target executor | TODO |
| 3 | Map test cases to promptfoo tests/vars | DONE |
| 4 | Map assertion and tool expectation definitions to promptfoo-compatible assertions where possible | WARNING |
| 5 | Unit test generated config object from snapshot fixture | DONE |

- Commit: `feat(runner): build promptfoo config from snapshot`
- Scope: `L`
- Review: `WARNING`

## R4.2: Promptfoo Runner Wrapper

| # | Checklist | Status |
|---|---|---|
| 1 | Call promptfoo Node API with max concurrency from run options | DONE |
| 2 | Provide CLI fallback only if Node API blocks MVP | TODO |
| 3 | Convert promptfoo execution errors into runner domain errors | TODO |
| 4 | Preserve promptfoo summary for artifact writing | DONE |
| 5 | Unit test wrapper with mocked promptfoo evaluate function | DONE |

- Commit: `feat(runner): run evaluations through promptfoo`
- Scope: `M`
- Review: `WARNING`

Verified against installed `promptfoo@0.121.17` with `rtk npm run smoke:promptfoo` on 2026-06-22. Production worker
does not enable promptfoo execution until the custom provider function is wired to `TargetExecutor`; this avoids failing
real jobs through the placeholder provider.

## R4.3: Domain Evaluator Gaps

| # | Checklist | Status |
|---|---|---|
| 1 | Identify assertion/tool expectation types not directly supported by promptfoo | DONE |
| 2 | Add custom evaluator adapters only for unsupported domain behavior | DONE |
| 3 | Keep mapping deterministic and covered by tests | DONE |
| 4 | Document known unsupported types, if any | DONE |

- Commit: `feat(runner): add domain evaluator adapters`
- Scope: `M`
- Review: `WARNING`

Unsupported semantic checks currently return `UNCERTAIN`, not `PASSED`: `llm_rubric`, deep `TOOL_ARGS_MATCH`,
`TOOL_OUTPUT_USED_IN_ANSWER`, and agent trace expectations.
