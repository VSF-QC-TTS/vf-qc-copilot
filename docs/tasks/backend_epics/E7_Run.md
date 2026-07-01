# E7: Run Module

Dependencies: E2, E4, E5, E6, E0.4.

This is the highest-risk backend epic. Keep it small and preserve async execution through Redis Streams.

## E7.1: Run Entity + DTO

| # | Checklist | Status |
|---|---|---|
| 1 | Add `Run` entity linked to project, dataset, target, trigger user, and optional previous run | DONE |
| 2 | Add status, timestamps, counters, and failure reason fields | DONE |
| 3 | Add `RunRequest`, `RunResponse`, and `RunSnapshotDto` | DONE |
| 4 | Add Flyway migration for `runs` | DONE |

- Commit: `feat(run): add run entity, dto and migration`
- Scope: `M`
- Review: `DONE`

## E7.2: RunSnapshot Assembly

| # | Checklist | Status |
|---|---|---|
| 1 | Fetch target, test cases, assertions, tool expectations, and rubrics with bounded query count | DONE |
| 2 | Group assertions and tool expectations by test case in memory | DONE |
| 3 | Serialize an immutable `RunSnapshotDto` for the runner | DONE |
| 4 | Unit test snapshot shape and grouping behavior by state/output | DONE |
| 5 | Unit test empty dataset behavior | DONE |

- Commit: `feat(run): implement run snapshot assembly with batch fetching`
- Scope: `L`
- Review: `DONE`

## E7.3: Redis Streams Publisher

| # | Checklist | Status |
|---|---|---|
| 1 | Add `RunStreamPublisher` over the existing Redis stream infrastructure | DONE |
| 2 | Publish serialized snapshot/reference to stream key `run:jobs` | DONE |
| 3 | Include run ID and correlation metadata for observability | DONE |
| 4 | Add integration or focused component test for stream publish | DONE |

- Commit: `feat(run): add redis streams publisher`
- Scope: `M`
- Review: `DONE`

## E7.4: RunService Facade

| # | Checklist | Status |
|---|---|---|
| 1 | Add `RunService.triggerRun(datasetId, targetId)` | DONE |
| 2 | Create run with `PENDING`, assemble snapshot, publish job, then mark `RUNNING` | DONE |
| 3 | Reject missing target/dataset and invalid empty-dataset runs with business errors | DONE |
| 4 | Unit test status changes and publish outcome by state/output | DONE |

- Commit: `feat(run): add run service facade`
- Scope: `L`
- Review: `DONE`

## E7.5: Controller + Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Add `RunController` at `/api/v1/datasets/{datasetId}/runs` | DONE |
| 2 | Add trigger endpoint returning `202 Accepted` | DONE |
| 3 | Add get status endpoint by run `publicId` | DONE |
| 4 | Add paginated run history endpoint | DONE |
| 5 | MockMvc test trigger and status retrieval | DONE |

- Commit: `feat(run): add controller and integration tests`
- Scope: `M`
- Review: `DONE`

## Checkpoint: Core Evaluation Flow

| # | Check | Status |
|---|---|---|
| 1 | Project -> Target -> Dataset -> TestCase -> Assertion -> Trigger Run flow works | DONE |
| 2 | Redis Stream receives a job with the expected run reference or snapshot | DONE |
| 3 | Large snapshot payload risk is explicitly handled before production use | WARNING |
