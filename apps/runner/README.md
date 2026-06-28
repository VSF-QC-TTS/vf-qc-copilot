# VFQC Runner

Redis Stream worker for test runs.

## Local run

```bash
npm install --ignore-scripts
RUNNER_INTERNAL_TOKEN=dev-internal-token \
BACKEND_BASE_URL=http://localhost:8080/api/v1 \
REDIS_HOST=localhost \
npm run dev
```

## Mapping smoke test

1. Start infra: `docker compose up -d db redis`.
2. Start API from `apps/api`: `RUNNER_INTERNAL_TOKEN=dev-internal-token rtk bash mvnw spring-boot:run`.
3. Start runner from `apps/runner` with the local run command above.
4. Create a runnable project: target config, schema, active dataset, verification.
5. Trigger `POST /api/v1/projects/{projectPublicId}/runs`.
6. Check Redis: `redis-cli XRANGE eval.run.requested - +`.
7. Check backend:
   - `GET /api/v1/runs/{runPublicId}`
   - `GET /api/v1/runs/{runPublicId}/events`
   - `GET /api/v1/runs/{runPublicId}/results`

The run should move from `QUEUED` to `RUNNING` to `COMPLETED`, with one result per dataset row.
