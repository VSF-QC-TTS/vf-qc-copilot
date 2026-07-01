# R5: Result Reporting & Artifacts

Dependencies: R2, R4.

Turn execution output into backend result callback payloads and artifacts.

## R5.1: Result Normalizer

| # | Checklist | Status |
|---|---|---|
| 1 | Convert promptfoo/domain results into `TestResultIngestionItem` | DONE |
| 2 | Convert assertion checks into `AssertionResultIngestionItem` | DONE |
| 3 | Convert tool checks into `ToolExpectationResultIngestionItem` | DONE |
| 4 | Compute `PASSED`, `FAILED`, `ERROR`, `SKIPPED`, and `UNCERTAIN` consistently | DONE |
| 5 | Unit test status aggregation and nested result mapping | DONE |

- Commit: `feat(runner): normalize evaluation results`
- Scope: `L`
- Review: `DONE`

## R5.2: Batched Result Reporter

| # | Checklist | Status |
|---|---|---|
| 1 | Buffer results and flush by size or interval | DONE |
| 2 | Send final batch with `finalBatch=true` | DONE |
| 3 | Retry transient backend failures with bounded backoff | TODO |
| 4 | Avoid duplicate submission where possible after worker restart | TODO |
| 5 | Unit test flush size, interval, final batch, and retry behavior | WARNING |

- Commit: `feat(runner): report results in batches`
- Scope: `M`
- Review: `WARNING`

## R5.3: Artifact Writer

| # | Checklist | Status |
|---|---|---|
| 1 | Write sanitized promptfoo config/summary artifacts locally for MVP | TODO |
| 2 | Redact secrets, auth headers, and sensitive response fields | TODO |
| 3 | Return artifact path/reference in runner logs and future backend payload support | TODO |
| 4 | Unit test redaction rules | TODO |

- Commit: `feat(runner): write sanitized run artifacts`
- Scope: `M`
- Review: `TODO`
