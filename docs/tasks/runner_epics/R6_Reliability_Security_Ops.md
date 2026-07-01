# R6: Reliability, Security & Operations

Dependencies: R2, R3, R5.

Make the runner safe to operate beyond the happy path.

## R6.1: Concurrency & Shutdown

| # | Checklist | Status |
|---|---|---|
| 1 | Enforce per-run max concurrency | TODO |
| 2 | Support process-level graceful shutdown | TODO |
| 3 | Stop reading new jobs during shutdown | TODO |
| 4 | Flush pending result buffer before exit | TODO |
| 5 | Unit test shutdown and flush behavior | TODO |

- Commit: `feat(runner): add concurrency and graceful shutdown`
- Scope: `M`
- Review: `TODO`

## R6.2: Security Guardrails

| # | Checklist | Status |
|---|---|---|
| 1 | Add SSRF guard for target URLs before execution | DONE |
| 2 | Add secret resolver for `{{secret.*}}` placeholders | TODO |
| 3 | Redact secrets from logs/artifacts/errors | WARNING |
| 4 | Prevent runner token from being exposed in logs | DONE |
| 5 | Unit test blocked private IPs and redaction rules | TODO |

- Commit: `feat(runner): add ssrf guard and secret redaction`
- Scope: `M`
- Review: `WARNING`

## R6.3: Observability

| # | Checklist | Status |
|---|---|---|
| 1 | Add structured logs with `runId`, `testCaseId`, and Redis message ID | TODO |
| 2 | Add basic metrics counters/timers for jobs, test cases, failures, and callback latency | TODO |
| 3 | Add health endpoint or process health signal for deployment | TODO |
| 4 | Document operational runbook for stuck Redis pending entries | TODO |

- Commit: `feat(runner): add operational telemetry`
- Scope: `M`
- Review: `TODO`
