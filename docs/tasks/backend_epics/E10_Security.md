# E10: Security Hardening

Dependency: E0. Some work can run in parallel with domain epics.

Important current-state note: local auth, OAuth2 login, JWT issuing, and JWT validation are already implemented. The app uses Spring Security OAuth2 Resource Server with `JwtDecoder` and `JwtAuthenticationConverter`; do not add a duplicate handwritten JWT request filter.

## E10.1: Auth + JWT Baseline

| # | Checklist | Status |
|---|---|---|
| 1 | Add local register/login/refresh/logout/verify-email/reset-password endpoints under `/api/v1/auth` | DONE |
| 2 | Issue access and refresh JWTs from `JwtTokenService` | DONE |
| 3 | Store refresh JWT in HttpOnly `refresh_token` cookie | DONE |
| 4 | Validate protected API requests through Spring Resource Server `JwtDecoder` | DONE |
| 5 | Add Google/GitHub OAuth2 login and issue the same local JWT pair | DONE |
| 6 | Configure public endpoint allowlist and protect other API routes | DONE |

- Commit: existing auth/security commits
- Review: `DONE`
- Note: Main access decoder accepts `token_type=access`; refresh decoder accepts `token_type=refresh`.

## E10.2: SSRF Protection

| # | Checklist | Status |
|---|---|---|
| 1 | Add `SsrfValidator` for user-supplied target URLs | TODO |
| 2 | Reject localhost, loopback, link-local, private, and metadata-service IP ranges after DNS resolution | TODO |
| 3 | Integrate validation into target create/update and any sample-run behavior | TODO |
| 4 | Unit test `127.0.0.1` rejection | TODO |
| 5 | Unit test `10.0.0.1` rejection | TODO |
| 6 | Unit test allowed public HTTPS URL | TODO |

- Commit: `feat(security): add ssrf protection for target urls`
- Scope: `M`
- Review: `TODO`

## E10.3: Security Integration Tests

| # | Checklist | Status |
|---|---|---|
| 1 | Test protected route without bearer token returns 401 | TODO |
| 2 | Test protected route with valid access token succeeds | TODO |
| 3 | Test refresh token cannot authenticate protected APIs | TODO |
| 4 | Test access token cannot be used for refresh endpoint | TODO |
| 5 | Test cross-user project access rules once authorization rules are implemented | TODO |

- Commit: `test(security): add security integration tests`
- Review: `TODO`

## E10.4: Service-to-Service Auth

| # | Checklist | Status |
|---|---|---|
| 1 | Define runner-to-backend auth mechanism for internal result ingestion | TODO |
| 2 | Keep runner auth separate from user JWTs | TODO |
| 3 | Add tests for missing/invalid service credential | TODO |

- Commit: `feat(security): add internal service authentication`
- Review: `TODO`
