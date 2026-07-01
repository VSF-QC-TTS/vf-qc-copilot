# E0: Foundation & Infrastructure

Dependency: none.

This epic is already implemented. Keep it as baseline context for future backend tasks.

## E0.1: Project Scaffold + Dependencies

| # | Checklist | Status |
|---|---|---|
| 1 | Create Spring Boot API project under `apps/api` | DONE |
| 2 | Add core dependencies: WebMVC, Validation, JPA, Redis, Security, OAuth2, Flyway, Lombok, MapStruct | DONE |
| 3 | Configure app profiles for datasource, Redis, mail, JWT, and client URL | DONE |
| 4 | Configure annotation processing for Lombok and MapStruct | DONE |
| 5 | Verify Maven compile succeeds | DONE |

- Commit: `chore(api): init spring boot project with core dependencies`
- Scope: `S`
- Review: `DONE`

## E0.2: Global Config

| # | Checklist | Status |
|---|---|---|
| 1 | Add global exception handling | DONE |
| 2 | Add domain exception types and error codes | DONE |
| 3 | Configure CORS from `vat.client.base-url` | DONE |
| 4 | Configure validation/i18n message support | DONE |
| 5 | Return Problem Details-compatible error responses | DONE |

- Commit: `feat(api): add global exception handler and CORS config`
- Scope: `S`
- Review: `DONE`

## E0.3: PostgreSQL + Flyway

| # | Checklist | Status |
|---|---|---|
| 1 | Configure PostgreSQL datasource per profile | DONE |
| 2 | Select and install Flyway | DONE |
| 3 | Add auth baseline migration `V1__init_schema.sql` | DONE |
| 4 | Add project migration `V2__project_schema.sql` | DONE |
| 5 | Add target/response mapping migration `V3__target_schema.sql` | DONE |
| 6 | Verify migrations run on app startup/test startup | DONE |

- Commit: `feat(api): configure postgresql and flyway migration`
- Scope: `S`
- Review: `DONE`
- Note: Do not add Liquibase. Continue with versioned Flyway migrations.

## E0.4: Redis Streams

| # | Checklist | Status |
|---|---|---|
| 1 | Configure Spring Data Redis connection | DONE |
| 2 | Add Redis stream beans/templates | DONE |
| 3 | Add stream publish utility using `XADD` | DONE |
| 4 | Verify publish behavior with integration coverage where available | DONE |

- Commit: `feat(api): configure redis streams connection and publisher util`
- Scope: `S`
- Review: `DONE`

## Checkpoint: Foundation

| # | Check | Status |
|---|---|---|
| 1 | API compiles | DONE |
| 2 | Focused tests pass for implemented foundation slices | DONE |
| 3 | PostgreSQL and Redis configuration exists | DONE |
| 4 | Future epics can rely on Flyway, Redis Streams, and shared error handling | DONE |
