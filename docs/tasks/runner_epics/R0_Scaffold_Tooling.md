# R0: Scaffold & Tooling

Dependencies: none.

Create the standalone Node.js TypeScript runner service.

## R0.1: App Scaffold

| # | Checklist | Status |
|---|---|---|
| 1 | Create `apps/runner` package with TypeScript source under `src/` | DONE |
| 2 | Add package scripts for `dev`, `build`, `typecheck`, and `test`; lint script still pending | WARNING |
| 3 | Configure `tsconfig.json` for strict TypeScript | DONE |
| 4 | Add `.env.example` for Redis, backend URL, runner token, concurrency, and timeout | DONE |
| 5 | Add README with local run instructions | DONE |

- Commit: `chore(runner): scaffold node typescript service`
- Scope: `M`
- Review: `WARNING`

## R0.2: Runtime Config

| # | Checklist | Status |
|---|---|---|
| 1 | Add typed config loader with validation | DONE |
| 2 | Support `REDIS_URL` or host/port/password configuration | DONE |
| 3 | Support `BACKEND_BASE_URL` and `RUNNER_TOKEN` | DONE |
| 4 | Support worker identity: consumer group and consumer name | DONE |
| 5 | Unit test config defaults and required variables | DONE |

- Commit: `feat(runner): add typed runtime config`
- Scope: `S`
- Review: `DONE`
