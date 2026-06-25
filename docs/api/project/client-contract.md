# Project Client Contract

This document is the client-facing contract for the current Spring Boot Project APIs.
The Java code is the source of truth when this file and implementation drift.

## Transport

- Base path: `/api/v1/projects`
- Auth: Requires valid JWT or session cookie (all endpoints are authenticated)
- JSON request content type: `application/json`
- Success JSON response content type: `application/json`
- Error response content type: `application/problem+json`
- Trace header: backend returns `X-Trace-Id` on every request handled by `TraceIdFilter`

## Error Shape

All expected API errors use RFC 9457 Problem Details plus VFQC extensions (same as Auth module).

Client mapping rules:

- Use `code` for page/global error mapping.
- Use `fieldErrors[].field` to attach form errors.
- Use `fieldErrors[].messageCode` for i18n lookup.
- Treat `message` and `detail` as fallback text only.

## Endpoints

| Flow | Method | Path | Request | Success |
| --- | --- | --- | --- | --- |
| Create project | `POST` | `/api/v1/projects` | `CreateProjectRequest` | `201 ProjectResponse` |
| List projects | `GET` | `/api/v1/projects?page=0&size=20` | none | `200 PageResponse<ProjectResponse>` |
| Get project | `GET` | `/api/v1/projects/{publicId}` | none | `200 ProjectResponse` |
| Update project | `PATCH` | `/api/v1/projects/{publicId}` | `UpdateProjectRequest` | `200 ProjectResponse` |
| Delete project | `DELETE` | `/api/v1/projects/{publicId}` | none | `204`, empty body |
| Get setup status | `GET` | `/api/v1/projects/{publicId}/setup-status` | none | `200 ProjectSetupStatus` |

## Request Types

```ts
type CreateProjectRequest = {
  name: string;
  description?: string | null;
};

type UpdateProjectRequest = {
  name?: string | null;
  description?: string | null;
};
```

## Response Types

```ts
type ProjectResponse = {
  publicId: string;
  name: string;
  description: string | null;
  createdAt: string; // ISO-8601 offset date-time
  updatedAt: string; // ISO-8601 offset date-time
};

type ProjectSetupStatus = {
  hasTargetConfig: boolean;
  hasJudgeConfig: boolean;
  hasDatasetSchema: boolean;
  hasVerification: boolean;
  hasDatasets: boolean;
  totalTestRuns: number;
};

type PageResponse<T> = {
  content: T[];
  page: number; // 0-indexed
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
```

## Error Codes

| Code | HTTP | Client handling |
| --- | ---: | --- |
| `VALIDATION_ERROR` | 400 | Apply `fieldErrors` to form controls |
| `BAD_REQUEST` | 400 | Show generic request error |
| `PROJECT_NOT_FOUND` | 404 | Show 404 page or toast |
| `PROJECT_NAME_REQUIRED` | 400 | Show validation error on form |
| `PROJECT_ALREADY_DELETED` | 410 | Prevent access, redirect to project list |

## Validation Message Codes

| Field | Message code |
| --- | --- |
| `name` | `validation.project.name.required` |
| `name` | `validation.project.name.max` |
| `description` | `validation.project.description.max` |
