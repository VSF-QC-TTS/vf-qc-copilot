# R2: Queue Consumer & Backend Client

Dependencies: R0, R1, Backend E8.

Consume run jobs from Redis Streams and communicate with backend internal APIs.

## R2.1: Redis Stream Consumer

| # | Checklist | Status |
|---|---|---|
| 1 | Add Redis client using consumer groups and `XREADGROUP` | DONE |
| 2 | Create stream/group on startup when missing | DONE |
| 3 | Deserialize job payload and validate snapshot | DONE |
| 4 | `XACK` only after successful result submission or terminal failure handling | DONE |
| 5 | Unit test job parsing and ack behavior with mocked Redis client | WARNING |

- Commit: `feat(runner): consume run jobs from redis streams`
- Scope: `L`
- Review: `WARNING`

## R2.2: Backend Internal API Client

| # | Checklist | Status |
|---|---|---|
| 1 | Add HTTP client with `X-Runner-Token` header | DONE |
| 2 | Implement `submitRunResults(runId, payload)` against `/api/v1/internal/runs/{runId}/results` | DONE |
| 3 | Add optional progress client for future `/progress` endpoint | TODO |
| 4 | Add optional fatal error client for future `/error` endpoint | TODO |
| 5 | Unit test auth header, retryable failures, and non-retryable validation errors | WARNING |

- Commit: `feat(runner): add backend internal api client`
- Scope: `M`
- Review: `WARNING`
