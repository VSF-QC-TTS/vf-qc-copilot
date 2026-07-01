# API Design — Chatbot QA Automation Platform

> **Phiên bản:** 1.0.0  
> **Cập nhật:** 2026-06-18  
> **Base URL:** `https://{host}/api/v1`  
> **Content-Type:** `application/json`

> **Guideline fit:** This project uses Microsoft/Azure-inspired REST conventions for resource naming, HTTP semantics, JSON shape, and errors. It is not strict Azure public-service compliance: the current backend intentionally uses path versioning (`/api/v1`), `items/page/size/totalItems` pagination, and action sub-paths where they already exist in code.

---

## Mục lục

1. [Quy ước chung](#1-quy-ước-chung)
2. [Authentication](#2-authentication)
3. [Project APIs](#3-project-apis)
4. [Target APIs](#4-target-apis)
5. [Dataset APIs](#5-dataset-apis)
6. [TestCase APIs](#6-testcase-apis)
7. [Assertion APIs](#7-assertion-apis)
8. [Tool Expectation APIs](#8-tool-expectation-apis)
9. [Rubric APIs](#9-rubric-apis)
10. [AI Generator APIs](#10-ai-generator-apis)
11. [Run APIs](#11-run-apis)
12. [Phụ lục — Enum Values & Domain Types](#12-phụ-lục--enum-values--domain-types)

---

## 1. Quy ước chung

### 1.1 URL Convention

| Quy tắc | Mô tả | Ví dụ |
|---------|--------|-------|
| Plural nouns | Resource luôn dùng danh từ số nhiều | `/api/v1/projects`, `/api/v1/datasets` |
| No verbs in URL | Không dùng động từ trong path (trừ action endpoint) | `POST /api/v1/projects` thay vì `/api/v1/createProject` |
| Nested resources | Sub-resource thuộc parent | `GET /api/v1/projects/{projectId}/datasets` |
| Flat access | Resource có thể truy cập trực tiếp khi đã biết ID | `GET /api/v1/datasets/{datasetId}` |
| Action endpoints | Hành động đặc biệt dùng suffix | `POST /api/v1/projects/{projectId}/targets/parse-curl` |

### 1.2 Naming Convention

| Ngữ cảnh | Convention | Ví dụ |
|----------|-----------|-------|
| JSON fields (request/response) | camelCase | `projectId`, `createdAt`, `expectedBehavior` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| Enum values | UPPER_SNAKE_CASE | `PENDING`, `FULL_DATASET`, `FIELD` |
| Path params | camelCase | `{projectId}`, `{testCaseId}` |
| Boolean fields | `is`/`has`/`can` prefix | `isArchived`, `hasAssertions`, `enabled` |

### 1.3 HTTP Methods

| Method | Mục đích | Idempotent |
|--------|---------|------------|
| `GET` | Đọc resource / danh sách | ✅ |
| `POST` | Tạo resource mới hoặc trigger action | ❌ |
| `PUT` | Cập nhật resource | ✅ |
| `DELETE` | Xóa resource | ✅ |

### 1.4 Status Codes

| Code | Ý nghĩa | Sử dụng khi |
|------|---------|-------------|
| `200 OK` | Thành công | GET, PUT trả về resource |
| `201 Created` | Tạo thành công | POST tạo resource mới |
| `204 No Content` | Thành công, không body | DELETE thành công |
| `400 Bad Request` | Request sai cú pháp | JSON parse error, missing required field |
| `401 Unauthorized` | Chưa xác thực | Thiếu hoặc sai JWT token |
| `403 Forbidden` | Không có quyền | Token hợp lệ nhưng không đủ quyền |
| `404 Not Found` | Không tìm thấy resource | ID không tồn tại |
| `409 Conflict` | Xung đột dữ liệu | Duplicate name, version mismatch |
| `422 Unprocessable Entity` | Lỗi validation logic | Field hợp lệ về cú pháp nhưng sai về nghĩa |
| `500 Internal Server Error` | Lỗi server | Lỗi nội bộ không mong đợi |

### 1.5 Error Response Format

Current backend errors use an RFC 9457 / Problem Details-compatible shape:

```json
{
  "type": "https://vat.nghlong3004.me/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/v1/projects",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "name", "message": "Name is required." }
  ]
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `type` | `string` | Stable error documentation URI |
| `title` | `string` | Short human-readable error title |
| `status` | `integer` | HTTP status code |
| `detail` | `string` | Human-readable error detail |
| `instance` | `string` | Request path |
| `code` | `string` | Machine-readable app error code |
| `errors` | `array \| null` | Optional field-level validation errors |

**Danh sách error codes phổ biến:**

| Error Code | HTTP Status | Mô tả |
|-----------|------------|--------|
| `INVALID_REQUEST` | 400 | Request body sai format |
| `AUTHENTICATION_REQUIRED` | 401 | Thiếu hoặc sai token |
| `TOKEN_EXPIRED` | 401 | Token đã hết hạn |
| `FORBIDDEN` | 403 | Không có quyền truy cập |
| `RESOURCE_NOT_FOUND` | 404 | Resource không tồn tại |
| `DUPLICATE_RESOURCE` | 409 | Resource đã tồn tại (ví dụ: trùng tên) |
| `VALIDATION_ERROR` | 422 | Dữ liệu không hợp lệ |
| `INTERNAL_ERROR` | 500 | Lỗi server nội bộ |

### 1.6 Pagination

Tất cả list endpoint đều hỗ trợ pagination:

**Request query params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang hiện tại (1-indexed) |
| `pageSize` | `integer` | `20` | Số items mỗi trang (max: 100) |
| `sortBy` | `string` | `createdAt` | Field để sort |
| `sortOrder` | `string` | `desc` | `asc` hoặc `desc` |

**Response format used by current implemented list endpoints:**

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalItems": 142,
  "totalPages": 8
}
```

### 1.7 Authentication Header

Trừ auth endpoints, tất cả API đều yêu cầu header:

```
Authorization: Bearer <jwt_token>
```

### 1.8 Datetime Format

Tất cả datetime fields dùng **ISO 8601** format:

```
2026-06-18T10:30:00Z
```

---

## 2. Authentication

### Current Implementation Summary

The current backend uses local email/password auth plus Google/GitHub OAuth2 login. Both flows issue the same local JWT pair:

- Access JWT is returned in the JSON body and sent on protected requests as `Authorization: Bearer <accessToken>`.
- Refresh JWT is stored only in the HttpOnly `refresh_token` cookie.
- Refresh rotates the cookie through `POST /api/v1/auth/refresh-token`.
- Spring Security validates protected requests through OAuth2 Resource Server `JwtDecoder`; there is no separate handwritten JWT request filter.

### 2.1 Register - `POST /api/v1/auth/register`

Creates a pending local account and sends an email verification link.

**Auth required:** No

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User email. Stored internally as `users.username`. |
| `password` | `string` | Yes | 8-72 characters. Hashed before persistence. |
| `displayName` | `string` | No | Defaults to email local-part when omitted. |

**Response `201 Created`:** `UserResponse`

```json
{
  "publicId": "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d",
  "email": "qc.demo@example.com",
  "displayName": "QC Demo",
  "avatarUrl": null,
  "role": "QC_MEMBER",
  "status": "PENDING_EMAIL_VERIFICATION",
  "lastLoginAt": null
}
```

### 2.2 Login - `POST /api/v1/auth/login`

Authenticates a local account, returns an access token, and sets a refresh cookie.

**Auth required:** No

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User email address. |
| `password` | `string` | Yes | Plain-text password. |

**Response `200 OK`:** `LoginResponse`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "user": {
    "publicId": "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d",
    "email": "qc.demo@example.com",
    "displayName": "QC Demo",
    "avatarUrl": null,
    "role": "QC_MEMBER",
    "status": "ACTIVE",
    "lastLoginAt": "2026-06-09T10:00:00Z"
  }
}
```

The refresh token is returned only as a `Set-Cookie: refresh_token=...; HttpOnly` header.

### 2.3 Refresh Token - `POST /api/v1/auth/refresh-token`

Reads the HttpOnly `refresh_token` cookie, validates it as a refresh JWT, returns a new access token, and rotates the refresh cookie.

**Auth required:** No bearer token. Requires refresh cookie.

**Response `200 OK`:** `LoginResponse`

**Error responses:** `401` for missing, invalid, expired, or wrong-token-type refresh token.

### 2.4 Logout - `POST /api/v1/auth/logout`

Clears the browser refresh cookie. The current implementation does not persist refresh tokens and does not provide server-side revocation yet.

**Auth required:** No bearer token required by current allowlist.

**Response `204 No Content`:** no response body.

### 2.5 Verify Email - `POST /api/v1/auth/verify-email`

Activates a pending local account using an email verification token.

**Request Body:**

```json
{ "token": "raw-email-verification-token" }
```

### 2.6 Forgot/Reset Password

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/auth/forgot-password` | Sends a reset link without revealing whether the account exists. |
| `POST /api/v1/auth/reset-password` | Resets the password using the raw reset token. |

### 2.7 OAuth2 Login

Google and GitHub OAuth2 login are implemented through Spring Security. Successful OAuth2 login finds or creates a local `User`, issues the same access/refresh JWT pair, stores refresh in the HttpOnly cookie, and redirects to the client app.

---

## 3. Project APIs

### Tổng quan

**Project** đại diện cho một chatbot cần test. Mỗi project chứa targets (API endpoints), datasets (bộ testcase), rubrics (tiêu chí đánh giá), và run history. Project là root entity của toàn bộ hệ thống.

---

### 3.1 Tạo Project — `POST /api/v1/projects`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ✅ | Tên project (1-200 ký tự, unique per owner) |
| `description` | `string` | ❌ | Mô tả project |

**Response `201 Created`:**

```json
{
  "publicId": "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d",
  "name": "VinFast Chatbot",
  "description": "Kiểm thử chatbot hỗ trợ khách hàng VinFast",
  "owner": "usr_abc123",
  "createdBy": "usr_abc123",
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z",
  "archived": false
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `publicId` | `string` | Public UUID. Internal numeric IDs are never exposed. |
| `name` | `string` | Tên project |
| `description` | `string \| null` | Mô tả |
| `owner` | `string` | User ID của chủ sở hữu |
| `createdBy` | `string` | User ID người tạo |
| `createdAt` | `string` | Thời gian tạo (ISO 8601) |
| `updatedAt` | `string` | Thời gian cập nhật gần nhất |
| `archived` | `boolean` | Đã archive hay chưa |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu field `name` |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `409` | `DUPLICATE_RESOURCE` | Trùng tên project cho cùng owner |
| `422` | `VALIDATION_ERROR` | Tên quá dài |

**Example Request:**

```bash
curl -X POST https://host/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "name": "VinFast Chatbot",
    "description": "Kiểm thử chatbot hỗ trợ khách hàng VinFast"
  }'
```

---

### 3.2 Danh sách Project — `GET /api/v1/projects`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang hiện tại |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `sortBy` | `string` | `updatedAt` | Sort theo field: `name`, `createdAt`, `updatedAt` |
| `sortOrder` | `string` | `desc` | `asc` hoặc `desc` |
| `search` | `string` | — | Tìm kiếm theo tên project |
| `archived` | `boolean` | `false` | Lọc project đã archive |

**Response `200 OK`:**

```json
{
  "items": [
    {
      "publicId": "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d",
      "name": "VinFast Chatbot",
      "description": "Kiểm thử chatbot hỗ trợ khách hàng VinFast",
      "owner": {
        "publicId": "11111111-1111-1111-1111-111111111111",
        "email": "qc.demo@example.com",
        "displayName": "QC Demo"
      },
      "createdBy": {
        "publicId": "11111111-1111-1111-1111-111111111111",
        "email": "qc.demo@example.com",
        "displayName": "QC Demo"
      },
      "createdAt": "2026-06-18T10:00:00Z",
      "updatedAt": "2026-06-18T12:00:00Z",
      "archived": false
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 5,
  "totalPages": 1
}
```

> Roadmap note: dashboard fields such as dataset count, last run status, and pass rate need report aggregation work before they are available on this endpoint.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |

**Example Request:**

```bash
curl -X GET "https://host/api/v1/projects?page=1&pageSize=10&search=VinFast" \
  -H "Authorization: Bearer eyJhbG..."
```

---

### 3.3 Chi tiết Project — `GET /api/v1/projects/{projectId}`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | Public UUID of the project |

**Response `200 OK`:**

```json
{
  "publicId": "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d",
  "name": "VinFast Chatbot",
  "description": "Kiểm thử chatbot hỗ trợ khách hàng VinFast",
  "owner": {
    "publicId": "11111111-1111-1111-1111-111111111111",
    "email": "qc.demo@example.com",
    "displayName": "QC Demo"
  },
  "createdBy": {
    "publicId": "11111111-1111-1111-1111-111111111111",
    "email": "qc.demo@example.com",
    "displayName": "QC Demo"
  },
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T12:00:00Z",
  "archived": false
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền truy cập project |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |

**Example Request:**

```bash
curl -X GET https://host/api/v1/projects/prj_abc123 \
  -H "Authorization: Bearer eyJhbG..."
```

---

### 3.4 Cập nhật Project — `PUT /api/v1/projects/{projectId}`

Cập nhật thông tin project.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Request Body (partial):**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ❌ | Tên mới (1-200 ký tự) |
| `description` | `string` | ❌ | Mô tả mới |
| `archived` | `boolean` | ❌ | Archive/unarchive project |

**Response `200 OK`:**

Trả về project object đầy đủ sau khi cập nhật (cùng schema với GET response).

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền chỉnh sửa |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |
| `409` | `DUPLICATE_RESOURCE` | Trùng tên project |
| `422` | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |

**Example Request:**

```bash
curl -X PUT https://host/api/v1/projects/prj_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "name": "VinFast Chatbot v2",
    "description": "Phiên bản cải tiến"
  }'
```

---

### 3.5 Xóa Project — `DELETE /api/v1/projects/{projectId}`

Xóa project và toàn bộ dữ liệu liên quan (targets, datasets, testcases, runs, ...). Hành động không thể hoàn tác.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Response `204 No Content`:**

Không có response body.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền xóa |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |

**Example Request:**

```bash
curl -X DELETE https://host/api/v1/projects/prj_abc123 \
  -H "Authorization: Bearer eyJhbG..."
```

---

## 4. Target APIs

### Tổng quan

**Target** đại diện cho một API endpoint/environment của chatbot (dev, staging, production...). Mỗi project có thể có nhiều target. Target chứa request template (parse từ cURL), input binding, variable bindings, và response mapping.

---

### 4.1 Parse cURL — `POST /api/v1/projects/{projectId}/targets/parse-curl`

Parse cURL command thành target configuration. Backend sẽ tự động extract method, URL, headers, query params, body template từ cURL string.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ✅ | Tên target (ví dụ: "Dev API", "Staging") |
| `environment` | `string` | ❌ | Môi trường: `dev`, `staging`, `production`, `local`, `experiment` |
| `curlCommand` | `string` | ✅ | cURL command đầy đủ |

**Response `201 Created`:**

```json
{
  "id": "tgt_def456",
  "projectId": "prj_abc123",
  "name": "Dev API",
  "environment": "dev",
  "method": "POST",
  "url": "https://chatbot.internal/api/v1/chat",
  "queryParamsTemplate": null,
  "headersTemplate": {
    "Content-Type": "application/json",
    "Authorization": "***REDACTED***",
    "X-API-Key": "***REDACTED***"
  },
  "bodyTemplate": {
    "message": "",
    "user_id": "test_user",
    "session_id": "sess_001"
  },
  "authConfig": {
    "type": "BEARER",
    "secretRef": "secret_ref_001"
  },
  "inputBinding": null,
  "variableBindings": [],
  "responseMappingId": null,
  "detectedSecrets": [
    {
      "location": "header",
      "key": "Authorization",
      "masked": "Bearer ***REDACTED***"
    },
    {
      "location": "header",
      "key": "X-API-Key",
      "masked": "***REDACTED***"
    }
  ],
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z"
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | Target ID |
| `projectId` | `string` | Project ID sở hữu |
| `name` | `string` | Tên target |
| `environment` | `string \| null` | Môi trường |
| `method` | `string` | HTTP method (GET, POST, PUT) |
| `url` | `string` | URL endpoint |
| `queryParamsTemplate` | `object \| null` | Query parameters template |
| `headersTemplate` | `object` | Headers template (secrets đã redact) |
| `bodyTemplate` | `object \| null` | Body template |
| `authConfig` | `object \| null` | Cấu hình auth đã detect |
| `inputBinding` | `object \| null` | Cấu hình inject testcase input |
| `variableBindings` | `array` | Danh sách variable bindings |
| `responseMappingId` | `string \| null` | ID của response mapping |
| `timeoutMs` | `integer` | Timeout mỗi request (ms) |
| `isDefault` | `boolean` | Có phải target mặc định không |
| `detectedSecrets` | `array` | Danh sách secrets đã phát hiện và mask |
| `createdAt` | `string` | Thời gian tạo |
| `updatedAt` | `string` | Thời gian cập nhật |

> **Lưu ý:** `responseMappingId` là field computed từ bảng `response_mappings` thông qua JOIN, không phải FK trực tiếp trên bảng `targets`.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_CURL` | cURL command không parse được |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |
| `422` | `VALIDATION_ERROR` | URL không hợp lệ, protocol không được hỗ trợ |

**Example Request:**

```bash
curl -X POST https://host/api/v1/projects/prj_abc123/targets/parse-curl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "name": "Dev API",
    "environment": "dev",
    "curlCommand": "curl -X POST https://chatbot.internal/api/v1/chat -H \"Content-Type: application/json\" -H \"Authorization: Bearer sk-xxx\" -d \"{\\\"message\\\": \\\"hello\\\", \\\"user_id\\\": \\\"u1\\\"}\""
  }'
```

---

### 4.2 Danh sách Target — `GET /api/v1/projects/{projectId}/targets`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `environment` | `string` | — | Lọc theo environment |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "tgt_def456",
      "projectId": "prj_abc123",
      "name": "Dev API",
      "environment": "dev",
      "method": "POST",
      "url": "https://chatbot.internal/api/v1/chat",
      "hasInputBinding": true,
      "hasResponseMapping": true,
      "createdAt": "2026-06-18T10:00:00Z",
      "updatedAt": "2026-06-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |

---

### 4.3 Chi tiết Target — `GET /api/v1/targets/{targetId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Response `200 OK`:**

Trả về full target object (schema giống 4.1 response, không bao gồm `detectedSecrets`).

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |

---

### 4.4 Cập nhật Target — `PUT /api/v1/targets/{targetId}`

Cập nhật thông tin cơ bản của target.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Request Body (partial):**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ❌ | Tên target |
| `environment` | `string` | ❌ | Môi trường |
| `method` | `string` | ❌ | HTTP method |
| `url` | `string` | ❌ | URL endpoint |
| `queryParamsTemplate` | `object` | ❌ | Query params template |
| `headersTemplate` | `object` | ❌ | Headers template |
| `bodyTemplate` | `object` | ❌ | Body template |
| `authConfig` | `object` | ❌ | Auth configuration |
| `timeoutMs` | `integer` | ❌ | Timeout mỗi request (ms). Default: `30000` |
| `isDefault` | `boolean` | ❌ | Target mặc định. Default: `false` |

**Response `200 OK`:**

Trả về full target object sau khi cập nhật.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |
| `422` | `VALIDATION_ERROR` | URL hoặc method không hợp lệ |

---

### 4.5 Xóa Target — `DELETE /api/v1/targets/{targetId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Response `204 No Content`**

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |
| `409` | `CONFLICT` | Target đang được sử dụng bởi run đang chạy |

---

### 4.6 Sample Run — `POST /api/v1/targets/{targetId}/sample-run`

> Roadmap note: sample-run is not part of the current implemented target slice.

Gửi một request thử tới chatbot API sử dụng target configuration. Dùng để test connection và xem response structure trước khi cấu hình response mapping.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `input` | `string` | ✅ | Câu hỏi test gửi đến chatbot |
| `variables` | `object` | ❌ | Biến bổ sung (key-value pairs) |

**Response `200 OK`:**

```json
{
  "success": true,
  "requestSnapshot": {
    "method": "POST",
    "url": "https://chatbot.internal/api/v1/chat",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "***REDACTED***"
    },
    "body": {
      "message": "VinFast VF 8 có mấy phiên bản?",
      "user_id": "test_user"
    }
  },
  "rawResponse": {
    "statusCode": 200,
    "headers": {
      "content-type": "application/json"
    },
    "body": {
      "answer": "VinFast VF 8 có 2 phiên bản: Eco và Plus.",
      "intent": "product_info",
      "confidence": 0.95,
      "suggestions": [
        {
          "title": "Xem giá VF 8",
          "action": "view_price"
        }
      ],
      "tool_calls": [
        {
          "name": "search_product",
          "arguments": {"query": "VF 8 phiên bản"},
          "output": {"count": 2}
        }
      ]
    }
  },
  "responseTree": [
    {
      "path": "answer",
      "type": "string",
      "value": "VinFast VF 8 có 2 phiên bản: Eco và Plus.",
      "suggestedComponent": "answer"
    },
    {
      "path": "intent",
      "type": "string",
      "value": "product_info",
      "suggestedComponent": "intent"
    },
    {
      "path": "confidence",
      "type": "number",
      "value": 0.95,
      "suggestedComponent": "confidence"
    },
    {
      "path": "suggestions",
      "type": "array",
      "value": "Array(1)",
      "suggestedComponent": "suggestions"
    },
    {
      "path": "tool_calls",
      "type": "array",
      "value": "Array(1)",
      "suggestedComponent": "toolCalls"
    }
  ],
  "latencyMs": 1250
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `success` | `boolean` | Kết quả gọi API chatbot |
| `requestSnapshot` | `object` | Snapshot request đã gửi (secrets redacted) |
| `rawResponse` | `object` | Response gốc từ chatbot |
| `responseTree` | `array` | Cây response đã phân tích, dùng cho UI mapping |
| `latencyMs` | `integer` | Thời gian phản hồi (ms) |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |
| `422` | `VALIDATION_ERROR` | Input binding chưa cấu hình |
| `502` | `UPSTREAM_ERROR` | Chatbot API trả lỗi hoặc timeout |

**Example Request:**

```bash
curl -X POST https://host/api/v1/targets/tgt_def456/sample-run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "input": "VinFast VF 8 có mấy phiên bản?",
    "variables": {
      "user_id": "test_user_01",
      "session_id": "sess_test"
    }
  }'
```

---

### 4.7 Cập nhật Input Binding — `PUT /api/v1/targets/{targetId}/bindings`

> Roadmap note: a dedicated bindings endpoint is not part of the current implemented target slice.

Cấu hình cách inject `testcase.input` và `testcase.variables` vào request template.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `inputBinding` | `object` | ✅ | Cấu hình input binding |
| `inputBinding.source` | `string` | ✅ | Luôn là `"testcase.input"` |
| `inputBinding.targetPath` | `string` | ✅ | JSON path trong request template (ví dụ: `"body.message"`) |
| `variableBindings` | `array` | ❌ | Danh sách variable bindings |
| `variableBindings[].variableName` | `string` | ✅ | Tên biến từ testcase.variables |
| `variableBindings[].targetPath` | `string` | ✅ | JSON path đích trong request |

**Response `200 OK`:**

```json
{
  "id": "tgt_def456",
  "inputBinding": {
    "source": "testcase.input",
    "targetPath": "body.message"
  },
  "variableBindings": [
    {
      "variableName": "user_id",
      "targetPath": "body.user_id"
    },
    {
      "variableName": "session_id",
      "targetPath": "body.session_id"
    }
  ],
  "updatedAt": "2026-06-18T11:00:00Z"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |
| `422` | `VALIDATION_ERROR` | targetPath không tồn tại trong template |

**Example Request:**

```bash
curl -X PUT https://host/api/v1/targets/tgt_def456/bindings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "inputBinding": {
      "source": "testcase.input",
      "targetPath": "body.message"
    },
    "variableBindings": [
      {
        "variableName": "user_id",
        "targetPath": "body.user_id"
      }
    ]
  }'
```

---

### 4.8 Cập nhật Response Mapping — `PUT /api/v1/targets/{targetId}/response-mapping`

Cấu hình cách platform hiểu response từ chatbot. Map các field trong response sang standard components (answer, intent, suggestions, toolCalls, ...).

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `targetId` | `string` | ID của target |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `answerPath` | `string` | ❌ | JSON path tới answer (ví dụ: `"answer"`, `"data.response.text"`) |
| `suggestionsPath` | `string` | ❌ | JSON path tới suggestions |
| `intentPath` | `string` | ❌ | JSON path tới intent |
| `confidencePath` | `string` | ❌ | JSON path tới confidence score |
| `sourcesPath` | `string` | ❌ | JSON path tới sources/references |
| `retrievalPath` | `string` | ❌ | JSON path tới retrieval context |
| `memoryPath` | `string` | ❌ | JSON path tới memory |
| `rewritePath` | `string` | ❌ | JSON path tới rewritten query |
| `agentPath` | `string` | ❌ | JSON path tới agent name |
| `toolPath` | `string` | ❌ | JSON path tới tool name (inferred) |
| `toolCallsPath` | `string` | ❌ | JSON path tới structured tool calls array |
| `traceIdPath` | `string` | ❌ | JSON path tới trace ID |
| `latencyPath` | `string` | ❌ | JSON path tới latency data |
| `customComponents` | `array` | ❌ | Custom component mappings |
| `customComponents[].componentName` | `string` | ✅ | Tên component tùy chỉnh |
| `customComponents[].path` | `string` | ✅ | JSON path |
| `customComponents[].type` | `string` | ✅ | Kiểu dữ liệu: `string`, `number`, `boolean`, `object`, `array` |
| `missingFieldBehavior` | `string` | ❌ | Hành vi khi field không tồn tại: `FAIL`, `SKIP`, `WARNING`. Default: `FAIL` |

**Response `200 OK`:**

```json
{
  "id": "rm_ghi789",
  "targetId": "tgt_def456",
  "answerPath": "answer",
  "suggestionsPath": "suggestions",
  "intentPath": "intent",
  "confidencePath": "confidence",
  "sourcesPath": null,
  "retrievalPath": null,
  "memoryPath": null,
  "rewritePath": null,
  "agentPath": null,
  "toolPath": null,
  "toolCallsPath": "tool_calls",
  "traceIdPath": null,
  "latencyPath": null,
  "customComponents": [
    {
      "componentName": "business_category",
      "path": "metadata.business_category",
      "type": "string"
    }
  ],
  "missingFieldBehavior": "FAIL",
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T11:30:00Z"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Target không tồn tại |
| `422` | `VALIDATION_ERROR` | JSON path không hợp lệ, missingFieldBehavior không hợp lệ |

**Example Request:**

```bash
curl -X PUT https://host/api/v1/targets/tgt_def456/response-mapping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "answerPath": "answer",
    "intentPath": "intent",
    "confidencePath": "confidence",
    "suggestionsPath": "suggestions",
    "toolCallsPath": "tool_calls",
    "customComponents": [
      {
        "componentName": "business_category",
        "path": "metadata.business_category",
        "type": "string"
      }
    ],
    "missingFieldBehavior": "WARNING"
  }'
```

---

> **Lưu ý:** `tool-trace-mapping` (PRD §18.2) được xử lý trong endpoint mappings ở trên thông qua các field `toolCallsPath`, `toolPath`, `agentPath`, `traceIdPath`. Không cần endpoint riêng.

## 5. Dataset APIs

### Tổng quan

**Dataset** là một bộ testcase thuộc project. Mỗi project có thể có nhiều dataset (ví dụ: Smoke Test, Full Regression, Refund Policy, Prompt Injection...). Dataset chứa danh sách testcase và có thể cấu hình default assertions/rubrics cho tất cả testcase trong đó.

---

### 5.1 Tạo Dataset — `POST /api/v1/projects/{projectId}/datasets`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ✅ | Tên dataset (1-200 ký tự) |
| `description` | `string` | ❌ | Mô tả dataset |
| `category` | `string` | ❌ | Phân loại (ví dụ: "regression", "smoke", "security") |
| `tags` | `string[]` | ❌ | Danh sách tags |
| `defaultAssertions` | `object[]` | ❌ | Assertions mặc định áp dụng cho mọi testcase |
| `defaultRubricIds` | `string[]` | ❌ | Danh sách rubric IDs mặc định |
| `enabled` | `boolean` | ❌ | Bật/tắt dataset. Default: `true` |
| `archived` | `boolean` | ❌ | Archive dataset. Default: `false` |

**Response `201 Created`:**

```json
{
  "id": "ds_jkl012",
  "projectId": "prj_abc123",
  "name": "Full Regression",
  "description": "Bộ test regression đầy đủ",
  "category": "regression",
  "tags": ["regression", "full"],
  "defaultAssertions": [],
  "defaultRubricIds": [],
  "createdBy": "usr_abc123",
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z",
  "enabled": true,
  "archived": false
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | Dataset ID |
| `projectId` | `string` | Project ID sở hữu |
| `name` | `string` | Tên dataset |
| `description` | `string \| null` | Mô tả |
| `category` | `string \| null` | Phân loại |
| `tags` | `string[]` | Danh sách tags |
| `defaultAssertions` | `object[]` | Assertions mặc định |
| `defaultRubricIds` | `string[]` | Rubric IDs mặc định |
| `createdBy` | `string` | User ID người tạo |
| `createdAt` | `string` | Thời gian tạo |
| `updatedAt` | `string` | Thời gian cập nhật |
| `enabled` | `boolean` | Dataset có được bật không |
| `archived` | `boolean` | Đã archive hay chưa |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu field `name` |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |
| `409` | `DUPLICATE_RESOURCE` | Trùng tên dataset trong project |

**Example Request:**

```bash
curl -X POST https://host/api/v1/projects/prj_abc123/datasets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "name": "Full Regression",
    "description": "Bộ test regression đầy đủ",
    "category": "regression",
    "tags": ["regression", "full"]
  }'
```

---

### 5.2 Danh sách Dataset — `GET /api/v1/projects/{projectId}/datasets`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `sortBy` | `string` | `updatedAt` | Sort theo field |
| `sortOrder` | `string` | `desc` | `asc` hoặc `desc` |
| `category` | `string` | — | Lọc theo category |
| `enabled` | `boolean` | — | Lọc theo trạng thái bật/tắt |
| `search` | `string` | — | Tìm kiếm theo tên |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "ds_jkl012",
      "projectId": "prj_abc123",
      "name": "Full Regression",
      "description": "Bộ test regression đầy đủ",
      "category": "regression",
      "tags": ["regression", "full"],
      "createdBy": "usr_abc123",
      "createdAt": "2026-06-18T10:00:00Z",
      "updatedAt": "2026-06-18T10:00:00Z",
      "enabled": true,
      "testCaseCount": 150,
      "lastRunPassRate": 0.92
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 3,
    "totalPages": 1
  }
}
```

> **Note:** `testCaseCount` và `lastRunPassRate` là computed fields.

---

### 5.3 Chi tiết Dataset — `GET /api/v1/datasets/{datasetId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Response `200 OK`:**

Trả về full dataset object (cùng schema với 5.1 response).

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Dataset không tồn tại |

---

### 5.4 Cập nhật Dataset — `PUT /api/v1/datasets/{datasetId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Request Body (partial):**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ❌ | Tên mới |
| `description` | `string` | ❌ | Mô tả mới |
| `category` | `string` | ❌ | Category mới |
| `tags` | `string[]` | ❌ | Tags mới |
| `defaultAssertions` | `object[]` | ❌ | Default assertions mới |
| `defaultRubricIds` | `string[]` | ❌ | Default rubric IDs mới |
| `enabled` | `boolean` | ❌ | Bật/tắt dataset |
| `archived` | `boolean` | ❌ | Archive/unarchive dataset |

**Response `200 OK`:**

Trả về full dataset object sau khi cập nhật.

---

### 5.5 Xóa Dataset — `DELETE /api/v1/datasets/{datasetId}`

Xóa dataset và tất cả testcase bên trong.

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Response `204 No Content`**

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Dataset không tồn tại |
| `409` | `CONFLICT` | Có run đang chạy trên dataset này |

---

## 6. TestCase APIs

### Tổng quan

**TestCase** mô tả một tình huống kiểm thử. Mỗi testcase chứa `input` (câu hỏi), `expectedBehavior` (hành vi mong đợi), và có thể có nhiều assertions + tool expectations. TestCase là dữ liệu QC định nghĩa trước khi chạy, không chứa kết quả.

---

### 6.1 Tạo TestCase — `POST /api/v1/datasets/{datasetId}/testcases`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `externalId` | `string` | ❌ | ID từ hệ thống cũ (legacy import) |
| `sectionName` | `string` | ❌ | Nhóm/section (ví dụ: "AI Search Mode > KB PNL > Vinfast") |
| `name` | `string` | ❌ | Tên testcase |
| `description` | `string` | ❌ | Mô tả testcase |
| `input` | `string` | ✅ | Câu hỏi / user input gửi đến chatbot |
| `expectedBehavior` | `string` | ❌ | Mô tả hành vi mong đợi |
| `referenceAnswer` | `string` | ❌ | Câu trả lời mẫu (nếu có) |
| `variables` | `object` | ❌ | Biến bổ sung (key-value pairs) |
| `preconditions` | `string` | ❌ | Điều kiện tiên quyết |
| `tags` | `string[]` | ❌ | Tags phân loại |
| `priority` | `string` | ❌ | Mức ưu tiên: `P0`, `P1`, `P2`, `P3` |
| `enabled` | `boolean` | ❌ | Bật/tắt testcase. Default: `true` |
| `sortOrder` | `integer` | ❌ | Thứ tự sắp xếp. Default: `0` |

**Response `201 Created`:**

```json
{
  "id": "tc_mno345",
  "externalId": "TC001",
  "datasetId": "ds_jkl012",
  "sectionName": "AI Search Mode > KB PNL > Vinfast",
  "name": "VF 8 phiên bản",
  "description": null,
  "input": "VinFast VF 8 có mấy phiên bản?",
  "expectedBehavior": "Bot cần trả lời đúng thông tin về các phiên bản VF 8, không bịa thông tin ngoài nguồn.",
  "referenceAnswer": null,
  "variables": {},
  "preconditions": null,
  "tags": ["vinfast", "kb", "regression"],
  "priority": "P1",
  "enabled": true,
  "source": "MANUAL",
  "generatedBy": null,
  "generationPrompt": null,
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z"
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | TestCase ID |
| `externalId` | `string \| null` | ID từ hệ thống cũ |
| `datasetId` | `string` | Dataset ID sở hữu |
| `sectionName` | `string \| null` | Tên section/nhóm |
| `name` | `string \| null` | Tên testcase |
| `description` | `string \| null` | Mô tả |
| `input` | `string` | Câu hỏi gửi đến chatbot |
| `expectedBehavior` | `string \| null` | Hành vi mong đợi |
| `referenceAnswer` | `string \| null` | Câu trả lời mẫu |
| `variables` | `object` | Biến bổ sung |
| `preconditions` | `string \| null` | Điều kiện tiên quyết |
| `tags` | `string[]` | Tags |
| `priority` | `string \| null` | Mức ưu tiên |
| `enabled` | `boolean` | Có được bật không |
| `source` | `string` | Nguồn gốc: `MANUAL`, `IMPORTED`, `AI_GENERATED` |
| `generatedBy` | `string \| null` | Model AI đã generate (nếu AI_GENERATED) |
| `generationPrompt` | `string \| null` | Prompt đã dùng để generate |
| `createdAt` | `string` | Thời gian tạo |
| `updatedAt` | `string` | Thời gian cập nhật |
| `sortOrder` | `integer` | Thứ tự sắp xếp |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu field `input` |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Dataset không tồn tại |
| `422` | `VALIDATION_ERROR` | Priority không hợp lệ |

**Example Request:**

```bash
curl -X POST https://host/api/v1/datasets/ds_jkl012/testcases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "externalId": "TC001",
    "sectionName": "AI Search Mode > KB PNL > Vinfast",
    "name": "VF 8 phiên bản",
    "input": "VinFast VF 8 có mấy phiên bản?",
    "expectedBehavior": "Bot cần trả lời đúng thông tin về các phiên bản VF 8, không bịa thông tin ngoài nguồn.",
    "tags": ["vinfast", "kb", "regression"],
    "priority": "P1"
  }'
```

---

### 6.2 Danh sách TestCase — `GET /api/v1/datasets/{datasetId}/testcases`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `sortBy` | `string` | `createdAt` | Sort theo field |
| `sortOrder` | `string` | `asc` | `asc` hoặc `desc` |
| `sectionName` | `string` | — | Lọc theo section name |
| `priority` | `string` | — | Lọc theo priority |
| `tags` | `string` | — | Lọc theo tag (comma-separated) |
| `enabled` | `boolean` | — | Lọc theo trạng thái |
| `source` | `string` | — | Lọc theo nguồn: `MANUAL`, `IMPORTED`, `AI_GENERATED` |
| `search` | `string` | — | Tìm kiếm trong input, name, expectedBehavior |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "tc_mno345",
      "externalId": "TC001",
      "datasetId": "ds_jkl012",
      "sectionName": "AI Search Mode > KB PNL > Vinfast",
      "name": "VF 8 phiên bản",
      "input": "VinFast VF 8 có mấy phiên bản?",
      "expectedBehavior": "Bot cần trả lời đúng thông tin...",
      "priority": "P1",
      "tags": ["vinfast", "kb", "regression"],
      "enabled": true,
      "source": "MANUAL",
      "assertionCount": 3,
      "toolExpectationCount": 1,
      "lastStatus": "PASSED",
      "createdAt": "2026-06-18T10:00:00Z",
      "updatedAt": "2026-06-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

> **Note:** `assertionCount`, `toolExpectationCount`, `lastStatus` là computed fields.

---

### 6.3 Chi tiết TestCase — `GET /api/v1/testcases/{testCaseId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `testCaseId` | `string` | ID của testcase |

**Response `200 OK`:**

Trả về full testcase object (schema giống 6.1 response) kèm thêm:

```json
{
  "...testcase fields...",
  "assertions": [
    {
      "id": "asrt_001",
      "scope": "COMPONENT",
      "type": "contains",
      "targetComponent": "answer",
      "expectedValue": "VF 8",
      "severity": "CRITICAL",
      "weight": 1.0,
      "enabled": true
    }
  ],
  "toolExpectations": [
    {
      "id": "te_001",
      "expectationType": "TOOL_MUST_BE_CALLED",
      "toolName": "search_product",
      "severity": "MAJOR",
      "enabled": true
    }
  ]
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | TestCase không tồn tại |

---

### 6.4 Cập nhật TestCase — `PUT /api/v1/testcases/{testCaseId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `testCaseId` | `string` | ID của testcase |

**Request Body (partial):**

Tất cả field trong 6.1 Request Body đều có thể cập nhật. Chỉ gửi các field cần thay đổi.

**Response `200 OK`:**

Trả về full testcase object sau khi cập nhật.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | TestCase không tồn tại |
| `422` | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |

---

### 6.5 Xóa TestCase — `DELETE /api/v1/testcases/{testCaseId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `testCaseId` | `string` | ID của testcase |

**Response `204 No Content`**

---

### 6.6 Import Preview — `POST /api/v1/datasets/{datasetId}/testcases/import/preview`

Upload file CSV/Excel để preview trước khi import. QC xem columns, sample rows, và column mapping trước khi commit.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `multipart/form-data` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset đích |

**Request Body (multipart):**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `file` | `file` | ✅ | File CSV hoặc Excel (.csv, .xlsx, .xls) |

**Response `200 OK`:**

```json
{
  "previewId": "prev_abc123",
  "fileName": "testcases.csv",
  "totalRows": 200,
  "detectedColumns": ["id", "section_name", "custom_nlp_sample", "custom_nlp_expected_dialog"],
  "suggestedMapping": {
    "id": "externalId",
    "section_name": "sectionName",
    "custom_nlp_sample": "input",
    "custom_nlp_expected_dialog": "expectedBehavior"
  },
  "sampleRows": [
    {
      "row": 1,
      "data": {
        "id": "TC001",
        "section_name": "AI Search > KB PNL",
        "custom_nlp_sample": "VinFast VF 8 có mấy phiên bản?",
        "custom_nlp_expected_dialog": "Bot cần trả lời đúng thông tin về các phiên bản VF 8"
      }
    }
  ],
  "duplicateCount": 3,
  "duplicateExternalIds": ["TC045", "TC102", "TC189"],
  "expiresAt": "2026-06-18T10:30:00Z"
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `previewId` | `string` | ID dùng cho bước confirm |
| `detectedColumns` | `string[]` | Các cột phát hiện trong file |
| `suggestedMapping` | `object` | Mapping tự động từ tên cột |
| `sampleRows` | `array` | 5 dòng đầu để QC xem trước |
| `duplicateCount` | `integer` | Số testcase trùng externalId với dataset hiện tại |
| `duplicateExternalIds` | `string[]` | Danh sách externalId trùng |
| `expiresAt` | `string` | Preview hết hạn sau 30 phút |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_FILE_FORMAT` | File không phải CSV/Excel hoặc không đọc được |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Dataset không tồn tại |

**Example Request:**

```bash
curl -X POST https://host/api/v1/datasets/ds_jkl012/testcases/import/preview \
  -H "Authorization: Bearer eyJhbG..." \
  -F "file=@testcases.csv"
```

---

### 6.7 Import Confirm — `POST /api/v1/datasets/{datasetId}/testcases/import/confirm`

Xác nhận import sau khi QC đã review preview. QC có thể chỉnh column mapping và chọn skip duplicates.

**Auth required:** Có

**Request Body:**

```json
{
  "previewId": "prev_abc123",
  "columnMapping": {
    "id": "externalId",
    "section_name": "sectionName",
    "custom_nlp_sample": "input",
    "custom_nlp_expected_dialog": "expectedBehavior"
  },
  "skipDuplicates": true,
  "defaultTags": ["imported", "legacy"]
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `previewId` | `string` | ✅ | ID từ bước preview |
| `columnMapping` | `object` | ❌ | Override mapping (dùng suggested nếu không gửi) |
| `skipDuplicates` | `boolean` | ❌ | Bỏ qua testcase trùng externalId. Default: `false` |
| `defaultTags` | `string[]` | ❌ | Tags mặc định cho tất cả testcase import |

**Response `201 Created`:**

```json
{
  "importId": "imp_pqr678",
  "datasetId": "ds_jkl012",
  "totalRows": 200,
  "importedCount": 195,
  "skippedCount": 3,
  "errorCount": 2,
  "errors": [
    {
      "row": 45,
      "reason": "Missing required field: custom_nlp_sample"
    },
    {
      "row": 102,
      "reason": "Duplicate external ID: TC102"
    }
  ],
  "createdAt": "2026-06-18T10:00:00Z"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `PREVIEW_EXPIRED` | Preview đã hết hạn (30 phút) |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Dataset hoặc preview không tồn tại |
| `422` | `VALIDATION_ERROR` | Column mapping không hợp lệ |

**Example Request:**

```bash
curl -X POST https://host/api/v1/datasets/ds_jkl012/testcases/import/confirm \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{
    "previewId": "prev_abc123",
    "skipDuplicates": true,
    "defaultTags": ["imported", "legacy"]
  }'
```

---

### 6.8 AI Suggest Assertions — `POST /api/v1/datasets/{datasetId}/testcases/ai-suggest-assertions`

AI đọc `expectedBehavior` của testcase và gợi ý assertions + tool expectations phù hợp. Kết quả là draft, QC cần review trước khi save.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `testCaseIds` | `string[]` | ✅ | Danh sách testcase IDs cần AI suggest |
| `availableComponents` | `string[]` | ❌ | Components có sẵn từ response mapping |
| `availableTools` | `string[]` | ❌ | Tools có sẵn (đã biết chatbot expose) |
| `defaultRubrics` | `string[]` | ❌ | Rubric IDs mặc định để tham khảo |

**Response `200 OK`:**

```json
{
  "suggestions": [
    {
      "testCaseId": "tc_mno345",
      "input": "VinFast VF 8 có mấy phiên bản?",
      "expectedBehavior": "Bot cần trả lời đúng thông tin về các phiên bản VF 8, không bịa thông tin ngoài nguồn.",
      "suggestedAssertions": [
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "llm_rubric",
          "rubric": "Bot phải trả lời đúng về các phiên bản VF 8, không bịa thêm thông tin ngoài dữ liệu có sẵn.",
          "threshold": 0.8,
          "severity": "CRITICAL",
          "reasoning": "expectedBehavior yêu cầu trả lời đúng thông tin, cần LLM judge để đánh giá chất lượng."
        },
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "not_contains",
          "expectedValue": "system prompt",
          "severity": "CRITICAL",
          "reasoning": "Đảm bảo bot không leak system prompt."
        }
      ],
      "suggestedToolExpectations": [
        {
          "expectationType": "TOOL_MUST_BE_CALLED",
          "toolName": "search_product",
          "severity": "MAJOR",
          "reasoning": "Bot nên tra cứu dữ liệu sản phẩm để trả lời chính xác."
        }
      ]
    }
  ]
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | testCaseIds rỗng |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Dataset hoặc testcase không tồn tại |
| `422` | `VALIDATION_ERROR` | TestCase thiếu expectedBehavior |

**Example Request:**

```bash
curl -X POST https://host/api/v1/datasets/ds_jkl012/testcases/ai-suggest-assertions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "testCaseIds": ["tc_mno345", "tc_mno346"],
    "availableComponents": ["answer", "intent", "suggestions", "toolCalls"],
    "availableTools": ["search_product", "get_price"]
  }'
```

---

## 7. Assertion APIs

### Tổng quan

**Assertion** mô tả một điều kiện chấm response chatbot. Mỗi testcase có thể có nhiều assertions với các scope khác nhau: `FIELD` (một field cụ thể), `COMPONENT` (component đã map), `MULTI_FIELD` (nhiều field/component), `WHOLE_RESPONSE` (toàn bộ response).

---

### 7.1 Tạo Assertion — `POST /api/v1/testcases/{testCaseId}/assertions`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `testCaseId` | `string` | ID của testcase |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `scope` | `string` | ✅ | Phạm vi: `FIELD`, `COMPONENT`, `MULTI_FIELD`, `WHOLE_RESPONSE` |
| `type` | `string` | ✅ | Loại assertion (xem bảng bên dưới) |
| `targetComponent` | `string` | ❌ | Component đích (required nếu scope = `COMPONENT`) |
| `fieldPath` | `string` | ❌ | JSON path (required nếu scope = `FIELD`) |
| `fieldPaths` | `string[]` | ❌ | Danh sách JSON paths (required nếu scope = `MULTI_FIELD`) |
| `expectedValue` | `any` | ❌ | Giá trị kỳ vọng (required cho text/number/boolean/array types) |
| `rubricId` | `string` | ❌ | ID của rubric (cho type = `llm_rubric`) |
| `rubricOverride` | `string` | ❌ | Override rubric cho testcase cụ thể |
| `threshold` | `number` | ❌ | Ngưỡng pass (0.0-1.0, cho `llm_rubric`). Default: `0.8` |
| `weight` | `number` | ❌ | Trọng số assertion. Default: `1.0` |
| `severity` | `string` | ❌ | Mức nghiêm trọng: `CRITICAL`, `MAJOR`, `MINOR`, `INFO`. Default: `MAJOR` |
| `enabled` | `boolean` | ❌ | Bật/tắt. Default: `true` |
| `sortOrder` | `integer` | ❌ | Thứ tự sắp xếp. Default: `0` |

**Assertion Types hợp lệ:**

| Category | Type | Mô tả | Cần `expectedValue` |
|----------|------|--------|---------------------|
| Text | `contains` | Chứa chuỗi | ✅ `string` |
| Text | `not_contains` | Không chứa chuỗi | ✅ `string` |
| Text | `equals` | Bằng chính xác | ✅ `string` |
| Text | `not_equals` | Không bằng | ✅ `string` |
| Text | `regex` | Khớp regex pattern | ✅ `string` (pattern) |
| Number | `greater_than` | Lớn hơn | ✅ `number` |
| Number | `less_than` | Nhỏ hơn | ✅ `number` |
| Number | `between` | Trong khoảng | ✅ `{ min, max }` |
| Boolean | `is_true` | Giá trị true | ❌ |
| Boolean | `is_false` | Giá trị false | ❌ |
| Object | `field_exists` | Field tồn tại | ❌ |
| Object | `field_not_exists` | Field không tồn tại | ❌ |
| Array | `array_length_greater_than` | Độ dài array > n | ✅ `number` |
| Array | `array_contains` | Array chứa giá trị | ✅ `any` |
| LLM | `llm_rubric` | LLM judge đánh giá | ❌ (dùng `rubricId` hoặc `rubricOverride`) |

**Response `201 Created`:**

```json
{
  "id": "asrt_stu901",
  "testCaseId": "tc_mno345",
  "scope": "COMPONENT",
  "type": "contains",
  "targetComponent": "answer",
  "fieldPath": null,
  "fieldPaths": null,
  "expectedValue": "VF 8",
  "rubricId": null,
  "rubricOverride": null,
  "threshold": null,
  "weight": 1.0,
  "severity": "CRITICAL",
  "enabled": true,
  "sortOrder": 0,
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu scope hoặc type |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | TestCase không tồn tại |
| `422` | `VALIDATION_ERROR` | Scope/type combination không hợp lệ, thiếu expectedValue khi cần |

**Example Request — Field assertion:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/assertions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "scope": "FIELD",
    "type": "contains",
    "fieldPath": "components.answer",
    "expectedValue": "mật khẩu",
    "severity": "CRITICAL"
  }'
```

**Example Request — Component LLM Rubric assertion:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/assertions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "scope": "COMPONENT",
    "type": "llm_rubric",
    "targetComponent": "answer",
    "rubricId": "rub_quality_vi",
    "rubricOverride": "Ở case này, bot cũng phải nhắc người dùng không chia sẻ mật khẩu.",
    "threshold": 0.8,
    "severity": "CRITICAL"
  }'
```

**Example Request — Multi-field assertion:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/assertions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "scope": "MULTI_FIELD",
    "type": "llm_rubric",
    "fieldPaths": ["components.answer", "components.sources"],
    "rubricOverride": "Answer phải dựa trên sources và không bịa thêm thông tin ngoài sources.",
    "threshold": 0.8,
    "severity": "CRITICAL"
  }'
```

**Example Request — Whole response assertion:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/assertions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "scope": "WHOLE_RESPONSE",
    "type": "llm_rubric",
    "rubricOverride": "Đánh giá toàn bộ response theo business requirement. PASS nếu response đúng ý, an toàn, không bịa, và có đầy đủ thông tin cần thiết.",
    "threshold": 0.8,
    "severity": "MAJOR"
  }'
```

---

### 7.2 Cập nhật Assertion — `PUT /api/v1/assertions/{assertionId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `assertionId` | `string` | ID của assertion |

**Request Body (partial):**

Tất cả field trong 7.1 Request Body đều có thể cập nhật. Chỉ gửi các field cần thay đổi.

**Response `200 OK`:**

Trả về full assertion object sau khi cập nhật.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Assertion không tồn tại |
| `422` | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |

**Example Request:**

```bash
curl -X PUT https://host/api/v1/assertions/asrt_stu901 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "expectedValue": "VinFast VF 8",
    "severity": "MAJOR"
  }'
```

---

### 7.3 Xóa Assertion — `DELETE /api/v1/assertions/{assertionId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `assertionId` | `string` | ID của assertion |

**Response `204 No Content`**

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Assertion không tồn tại |

---

### 7.4 Batch Tạo Assertions — `POST /api/v1/assertions/batch`

Tạo nhiều assertions cùng lúc cho nhiều testcases. Dùng sau khi AI suggest assertions — QC review xong, save tất cả 1 lần thay vì gọi từng cái.

**Auth required:** Có

**Request Body:**

```json
{
  "assertions": [
    {
      "testCaseId": "tc_abc001",
      "scope": "FIELD",
      "targetComponent": "answer",
      "fieldPath": "$.data.answer",
      "assertionType": "contains",
      "expectedValue": "VF 8",
      "severity": "MAJOR",
      "enabled": true
    },
    {
      "testCaseId": "tc_abc001",
      "scope": "WHOLE_RESPONSE",
      "assertionType": "llm_rubric",
      "rubricId": "rub_global_001",
      "severity": "CRITICAL"
    },
    {
      "testCaseId": "tc_abc002",
      "scope": "COMPONENT",
      "targetComponent": "intent",
      "assertionType": "equals",
      "expectedValue": "product_inquiry",
      "severity": "MAJOR"
    }
  ]
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `assertions` | `array` | ✅ | Danh sách assertions cần tạo (max 500) |
| `assertions[].testCaseId` | `string` | ✅ | ID của testcase |
| Các field còn lại | | | Giống §7.1 Tạo Assertion |

**Response `201 Created`:**

```json
{
  "createdCount": 3,
  "assertions": [
    {
      "id": "ast_new001",
      "testCaseId": "tc_abc001",
      "scope": "FIELD",
      "assertionType": "contains",
      "expectedValue": "VF 8"
    },
    {
      "id": "ast_new002",
      "testCaseId": "tc_abc001",
      "scope": "WHOLE_RESPONSE",
      "assertionType": "llm_rubric"
    },
    {
      "id": "ast_new003",
      "testCaseId": "tc_abc002",
      "scope": "COMPONENT",
      "assertionType": "equals"
    }
  ],
  "errors": []
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `createdCount` | `integer` | Số assertions tạo thành công |
| `assertions` | `array` | Danh sách assertions đã tạo (summary) |
| `errors` | `array` | Lỗi từng item (nếu có): `{ index, reason }` |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `BATCH_TOO_LARGE` | Vượt quá 500 assertions |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `422` | `VALIDATION_ERROR` | Một hoặc nhiều assertions không hợp lệ |

---

## 8. Tool Expectation APIs

### Tổng quan

**ToolExpectation** mô tả kỳ vọng về tool call/agent/action mà chatbot phải thực hiện. Tool expectation tách biệt khỏi assertion vì chúng target tool behavior, không phải response content. Chatbot có thể trả lời đúng nhưng không gọi tool, hoặc gọi sai tool.

---

### 8.1 Tạo Tool Expectation — `POST /api/v1/testcases/{testCaseId}/tool-expectations`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `testCaseId` | `string` | ID của testcase |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `expectationType` | `string` | ✅ | Loại kỳ vọng (xem bảng bên dưới) |
| `targetSource` | `string` | ❌ | Nguồn tool data: `normalized_tool_calls`, `inferred_tool`, `inferred_agent`, `agent_steps`, `trace`, `custom_component` |
| `toolName` | `string` | ❌ | Tên tool mong đợi (required cho TOOL_* types) |
| `agentName` | `string` | ❌ | Tên agent mong đợi (required cho AGENT_* types) |
| `argumentAssertions` | `object[]` | ❌ | Các assertion trên arguments |
| `argumentAssertions[].argumentPath` | `string` | ✅ | JSON path tới argument |
| `argumentAssertions[].type` | `string` | ✅ | Loại check: `equals`, `contains`, `exists` |
| `argumentAssertions[].expectedValue` | `any` | ❌ | Giá trị kỳ vọng |
| `sequence` | `string[]` | ❌ | Thứ tự tools mong đợi (cho `TOOL_SEQUENCE_MATCH`) |
| `minCalls` | `integer` | ❌ | Số lần gọi tối thiểu (cho `TOOL_CALL_COUNT`) |
| `maxCalls` | `integer` | ❌ | Số lần gọi tối đa (cho `TOOL_CALL_COUNT`) |
| `rubricId` | `string` | ❌ | ID rubric (cho `TOOL_OUTPUT_USED_IN_ANSWER`) |
| `rubricOverride` | `string` | ❌ | Override rubric |
| `threshold` | `number` | ❌ | Ngưỡng pass (0.0-1.0) |
| `required` | `boolean` | ❌ | Bắt buộc pass. Default: `true` |
| `severity` | `string` | ❌ | Mức nghiêm trọng: `CRITICAL`, `MAJOR`, `MINOR`, `INFO`. Default: `MAJOR` |
| `enabled` | `boolean` | ❌ | Bật/tắt. Default: `true` |
| `sortOrder` | `integer` | ❌ | Thứ tự sắp xếp. Default: `0` |

**Expectation Types:**

| Type | Mô tả | Required Fields |
|------|--------|-----------------|
| `TOOL_MUST_BE_CALLED` | Tool phải được gọi | `toolName` |
| `TOOL_MUST_NOT_BE_CALLED` | Tool không được gọi | `toolName` |
| `TOOL_ARGS_MATCH` | Arguments phải khớp | `toolName`, `argumentAssertions` |
| `TOOL_SEQUENCE_MATCH` | Tools phải được gọi theo thứ tự | `sequence` |
| `TOOL_CALL_COUNT` | Số lần gọi tool trong khoảng | `toolName`, `minCalls` và/hoặc `maxCalls` |
| `TOOL_OUTPUT_USED_IN_ANSWER` | Output tool phải xuất hiện trong answer | `toolName` |
| `AGENT_EQUALS` | Agent phải đúng | `agentName` |
| `AGENT_NOT_EQUALS` | Agent không được là | `agentName` |
| `AGENT_STEP_CONTAINS` | Agent steps phải chứa | `expectedValue` (trong `argumentAssertions`) |

**Response `201 Created`:**

```json
{
  "id": "te_vwx234",
  "testCaseId": "tc_mno345",
  "expectationType": "TOOL_MUST_BE_CALLED",
  "targetSource": "normalized_tool_calls",
  "toolName": "search_product",
  "agentName": null,
  "argumentAssertions": [],
  "sequence": null,
  "minCalls": null,
  "maxCalls": null,
  "rubricId": null,
  "rubricOverride": null,
  "threshold": null,
  "required": true,
  "severity": "MAJOR",
  "enabled": true,
  "sortOrder": 0,
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu expectationType |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | TestCase không tồn tại |
| `422` | `VALIDATION_ERROR` | Thiếu toolName khi type yêu cầu, type không hợp lệ |

**Example Request — Tool must be called:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/tool-expectations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "expectationType": "TOOL_MUST_BE_CALLED",
    "targetSource": "normalized_tool_calls",
    "toolName": "search_product",
    "severity": "MAJOR"
  }'
```

**Example Request — Tool args match:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/tool-expectations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "expectationType": "TOOL_ARGS_MATCH",
    "toolName": "get_order_status",
    "argumentAssertions": [
      {
        "argumentPath": "order_id",
        "type": "equals",
        "expectedValue": "ORD-123"
      }
    ],
    "severity": "CRITICAL"
  }'
```

**Example Request — Agent equals:**

```bash
curl -X POST https://host/api/v1/testcases/tc_mno345/tool-expectations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "expectationType": "AGENT_EQUALS",
    "targetSource": "inferred_agent",
    "agentName": "product_search_agent",
    "severity": "MAJOR"
  }'
```

---

### 8.2 Cập nhật Tool Expectation — `PUT /api/v1/tool-expectations/{expectationId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `expectationId` | `string` | ID của tool expectation |

**Request Body (partial):**

Tất cả field trong 8.1 Request Body đều có thể cập nhật.

**Response `200 OK`:**

Trả về full tool expectation object sau khi cập nhật.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Tool expectation không tồn tại |
| `422` | `VALIDATION_ERROR` | Dữ liệu không hợp lệ |

---

### 8.3 Xóa Tool Expectation — `DELETE /api/v1/tool-expectations/{expectationId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `expectationId` | `string` | ID của tool expectation |

**Response `204 No Content`**

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Tool expectation không tồn tại |

---

## 9. Rubric APIs

### Tổng quan

**Rubric** là tiêu chí đánh giá tái sử dụng cho LLM judge. Rubric có thể ở scope `GLOBAL` (dùng cho mọi project), `PROJECT` (dùng trong project), `DATASET` (dùng trong dataset), hoặc `TESTCASE_OVERRIDE` (override cho testcase cụ thể). Rubric giúp QC không phải viết lại tiêu chí cho từng testcase.

---

### 9.1 Tạo Rubric — `POST /api/v1/projects/{projectId}/rubrics`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ✅ | Tên rubric (1-200 ký tự) |
| `description` | `string` | ❌ | Mô tả rubric |
| `scope` | `string` | ❌ | Phạm vi: `PROJECT`, `DATASET`, `TESTCASE_OVERRIDE`. Default: `PROJECT` |
| `datasetId` | `string` | ❌ | Dataset ID (required nếu scope = `DATASET`) |
| `category` | `string` | ❌ | Phân loại rubric (xem danh sách bên dưới) |
| `language` | `string` | ❌ | Ngôn ngữ: `vi`, `en`, ... Default: `vi` |
| `content` | `string` | ✅ | Nội dung rubric (tiêu chí PASS/FAIL) |
| `defaultThreshold` | `number` | ❌ | Ngưỡng pass mặc định (0.0-1.0). Default: `0.8` |

**Rubric Categories:**

| Category | Mô tả |
|----------|--------|
| `ANSWER_QUALITY` | Chất lượng câu trả lời |
| `POLICY_COMPLIANCE` | Tuân thủ chính sách |
| `NO_HALLUCINATION` | Không bịa thông tin |
| `SAFETY_REFUSAL` | Từ chối an toàn |
| `RAG_FAITHFULNESS` | Trung thực với nguồn dữ liệu |
| `TOOL_OUTPUT_USAGE` | Sử dụng output của tool |
| `SUGGESTION_RELEVANCE` | Gợi ý phù hợp |
| `VIETNAMESE_TONE` | Giọng văn tiếng Việt |
| `CLARIFYING_QUESTION` | Câu hỏi làm rõ |
| `BUSINESS_ACCEPTANCE` | Nghiệm thu business |

**Response `201 Created`:**

```json
{
  "id": "rub_yza567",
  "scope": "PROJECT",
  "projectId": "prj_abc123",
  "datasetId": null,
  "name": "Answer Quality Vietnamese",
  "description": "Đánh giá chất lượng câu trả lời tiếng Việt",
  "category": "ANSWER_QUALITY",
  "language": "vi",
  "content": "PASS nếu:\n- Trả lời đúng trọng tâm.\n- Không bịa thông tin.\n- Có hướng dẫn hành động rõ ràng.\n- Giọng văn phù hợp.\n\nFAIL nếu:\n- Trả lời sai chính sách.\n- Thiếu thông tin quan trọng.\n- Tự tạo link/chính sách không tồn tại.\n- Lộ system prompt hoặc dữ liệu nội bộ.",
  "defaultThreshold": 0.8,
  "createdBy": "usr_abc123",
  "createdAt": "2026-06-18T10:00:00Z",
  "updatedAt": "2026-06-18T10:00:00Z",
  "archived": false
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | Rubric ID |
| `scope` | `string` | Phạm vi: `GLOBAL`, `PROJECT`, `DATASET`, `TESTCASE_OVERRIDE` |
| `projectId` | `string \| null` | Project ID (null nếu GLOBAL) |
| `datasetId` | `string \| null` | Dataset ID (nếu scope = DATASET) |
| `name` | `string` | Tên rubric |
| `description` | `string \| null` | Mô tả |
| `category` | `string \| null` | Phân loại |
| `language` | `string` | Ngôn ngữ |
| `content` | `string` | Nội dung tiêu chí |
| `defaultThreshold` | `number` | Ngưỡng pass mặc định |
| `createdBy` | `string` | User ID người tạo |
| `createdAt` | `string` | Thời gian tạo |
| `updatedAt` | `string` | Thời gian cập nhật |
| `archived` | `boolean` | Đã archive hay chưa |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu name hoặc content |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |
| `409` | `DUPLICATE_RESOURCE` | Trùng tên rubric |
| `422` | `VALIDATION_ERROR` | Scope = DATASET nhưng thiếu datasetId |

**Example Request:**

```bash
curl -X POST https://host/api/v1/projects/prj_abc123/rubrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "name": "Answer Quality Vietnamese",
    "description": "Đánh giá chất lượng câu trả lời tiếng Việt",
    "category": "ANSWER_QUALITY",
    "language": "vi",
    "content": "PASS nếu:\n- Trả lời đúng trọng tâm.\n- Không bịa thông tin.\n\nFAIL nếu:\n- Trả lời sai chính sách.\n- Thiếu thông tin quan trọng.",
    "defaultThreshold": 0.8
  }'
```

---

### 9.2 Danh sách Rubric (Project) — `GET /api/v1/projects/{projectId}/rubrics`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `projectId` | `string` | ID của project |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `category` | `string` | — | Lọc theo category |
| `scope` | `string` | — | Lọc theo scope |
| `search` | `string` | — | Tìm kiếm theo tên |
| `archived` | `boolean` | `false` | Bao gồm rubric đã archive |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "rub_yza567",
      "scope": "PROJECT",
      "projectId": "prj_abc123",
      "name": "Answer Quality Vietnamese",
      "description": "Đánh giá chất lượng câu trả lời tiếng Việt",
      "category": "ANSWER_QUALITY",
      "language": "vi",
      "content": "PASS nếu:...",
      "defaultThreshold": 0.8,
      "createdBy": "usr_abc123",
      "createdAt": "2026-06-18T10:00:00Z",
      "updatedAt": "2026-06-18T10:00:00Z",
      "archived": false,
      "usageCount": 12
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 5,
    "totalPages": 1
  }
}
```

> **Note:** `usageCount` là computed field cho biết số assertions đang dùng rubric này.

---

### 9.3 Danh sách Rubric Global — `GET /api/v1/rubrics/global`

Lấy danh sách rubric có scope `GLOBAL` (dùng chung cho mọi project).

**Auth required:** Có

**Query Params:**

Giống 9.2 (trừ `scope`).

**Response `200 OK`:**

Cùng format với 9.2 nhưng chỉ trả rubric có `scope = "GLOBAL"`.

---

### 9.4 Cập nhật Rubric — `PUT /api/v1/rubrics/{rubricId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `rubricId` | `string` | ID của rubric |

**Request Body (partial):**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `name` | `string` | ❌ | Tên mới |
| `description` | `string` | ❌ | Mô tả mới |
| `category` | `string` | ❌ | Category mới |
| `content` | `string` | ❌ | Nội dung mới |
| `defaultThreshold` | `number` | ❌ | Ngưỡng mới |
| `archived` | `boolean` | ❌ | Archive/unarchive |

**Response `200 OK`:**

Trả về full rubric object sau khi cập nhật.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền chỉnh sửa rubric GLOBAL |
| `404` | `RESOURCE_NOT_FOUND` | Rubric không tồn tại |

---

### 9.5 Xóa Rubric — `DELETE /api/v1/rubrics/{rubricId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `rubricId` | `string` | ID của rubric |

**Response `204 No Content`**

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Rubric không tồn tại |
| `409` | `CONFLICT` | Rubric đang được sử dụng bởi assertions |

---

### 9.6 AI Generate Rubric — `POST /api/v1/rubrics/ai-generate`

AI tự động generate rubric dựa trên mô tả yêu cầu.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `projectId` | `string` | ✅ | Project context |
| `category` | `string` | ✅ | Loại rubric cần generate |
| `description` | `string` | ✅ | Mô tả yêu cầu rubric |
| `language` | `string` | ❌ | Ngôn ngữ. Default: `vi` |
| `policyContext` | `string` | ❌ | Ngữ cảnh chính sách (nếu có) |
| `exampleInput` | `string` | ❌ | Ví dụ câu hỏi |
| `exampleExpectedBehavior` | `string` | ❌ | Ví dụ hành vi mong đợi |

**Response `200 OK`:**

```json
{
  "generatedRubric": {
    "name": "No Hallucination - Product Info",
    "description": "Kiểm tra bot không bịa thông tin sản phẩm",
    "category": "NO_HALLUCINATION",
    "language": "vi",
    "content": "PASS nếu:\n- Tất cả thông tin sản phẩm đều có trong nguồn dữ liệu.\n- Không tự tạo thông số kỹ thuật, giá, hoặc tính năng không tồn tại.\n- Nếu không có thông tin, bot nói rõ không đủ dữ liệu.\n\nFAIL nếu:\n- Bịa thông số sản phẩm (giá, kích thước, tính năng).\n- Tự tạo chương trình khuyến mãi không tồn tại.\n- Trích dẫn nguồn không có thật.\n- Trả lời quá mức dữ liệu có sẵn.",
    "defaultThreshold": 0.8
  },
  "reasoning": "Rubric tập trung vào faithfulness với nguồn dữ liệu, phù hợp cho chatbot sản phẩm."
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu field bắt buộc |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project không tồn tại |

**Example Request:**

```bash
curl -X POST https://host/api/v1/rubrics/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "projectId": "prj_abc123",
    "category": "NO_HALLUCINATION",
    "description": "Kiểm tra bot không bịa thông tin khi trả lời về sản phẩm VinFast",
    "language": "vi",
    "exampleInput": "VinFast VF 8 giá bao nhiêu?",
    "exampleExpectedBehavior": "Bot phải trả lời đúng giá từ dữ liệu, không bịa giá."
  }'
```

---

## 10. AI Generator APIs

### Tổng quan

**AI Generator** giúp QC tạo testcase tự động dựa trên business requirement, policy context, và mock data. AI sinh ra draft testcases kèm suggested assertions và tool expectations. QC phải review và confirm trước khi lưu vào dataset.

---

### 10.1 Generate TestCases — `POST /api/v1/datasets/{datasetId}/ai-generate-testcases`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `datasetId` | `string` | ID của dataset đích |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `featureName` | `string` | ✅ | Tên feature / intent cần test |
| `businessRequirement` | `string` | ✅ | Mô tả yêu cầu business |
| `policyContext` | `string` | ❌ | Ngữ cảnh chính sách |
| `mockData` | `string` | ❌ | Mock data (ví dụ: dữ liệu sản phẩm, đơn hàng) |
| `dbContext` | `string` | ❌ | DB context (schema, sample data) |
| `language` | `string` | ❌ | Ngôn ngữ test. Default: `vi` |
| `count` | `integer` | ❌ | Số testcase cần generate. Default: `10`. Max: `50` |
| `categories` | `string[]` | ❌ | Các loại testcase mong muốn |
| `availableComponents` | `string[]` | ❌ | Components có sẵn từ response mapping |
| `availableTools` | `string[]` | ❌ | Tools chatbot có thể gọi |
| `defaultRubrics` | `string[]` | ❌ | Rubric IDs mặc định |
| `existingTestcases` | `string[]` | ❌ | TestCase IDs đã tồn tại (để tránh duplicate) |

**Categories hợp lệ:**

| Category | Mô tả |
|----------|--------|
| `happy_path` | Luồng chính, input hợp lệ |
| `negative` | Input không hợp lệ, edge case |
| `edge_case` | Trường hợp biên |
| `typo` | Input có lỗi chính tả |
| `no_accent` | Tiếng Việt không dấu |
| `ambiguous` | Input mơ hồ |
| `out_of_scope` | Ngoài phạm vi chatbot |
| `prompt_injection` | Tấn công prompt injection |
| `policy_boundary` | Ranh giới chính sách |
| `safety` | An toàn, từ chối nội dung không phù hợp |
| `tool_call` | Test gọi tool |
| `suggestion` | Test gợi ý/suggestion |
| `retrieval` | Test RAG retrieval |

**Response `200 OK`:**

```json
{
  "draftBatchId": "batch_bcd890",
  "datasetId": "ds_jkl012",
  "drafts": [
    {
      "draftId": "draft_001",
      "name": "Happy path - Hỏi phiên bản VF 8",
      "description": "User hỏi thông tin phiên bản VF 8",
      "input": "VinFast VF 8 có mấy phiên bản?",
      "variables": {},
      "expectedBehavior": "Bot trả lời đúng có 2 phiên bản Eco và Plus. Thông tin lấy từ KB, không bịa thêm.",
      "referenceAnswer": "VinFast VF 8 hiện có 2 phiên bản: Eco và Plus.",
      "category": "happy_path",
      "priority": "P1",
      "tags": ["vinfast", "vf8", "product_info"],
      "suggestedAssertions": [
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "contains",
          "expectedValue": "Eco",
          "severity": "CRITICAL"
        },
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "contains",
          "expectedValue": "Plus",
          "severity": "CRITICAL"
        },
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "llm_rubric",
          "rubricOverride": "Bot phải trả lời đúng và không bịa thông tin ngoài nguồn.",
          "threshold": 0.8,
          "severity": "CRITICAL"
        }
      ],
      "suggestedToolExpectations": [
        {
          "expectationType": "TOOL_MUST_BE_CALLED",
          "toolName": "search_product",
          "severity": "MAJOR"
        }
      ],
      "reasoningForQC": "Testcase cơ bản kiểm tra chatbot có trả lời đúng thông tin sản phẩm. Suggest 2 contains assertions cho tên phiên bản + 1 rubric cho chất lượng tổng thể."
    },
    {
      "draftId": "draft_002",
      "name": "Negative - Hỏi sản phẩm không tồn tại",
      "description": "User hỏi về model VinFast không có thật",
      "input": "VinFast VF 12 có mấy phiên bản?",
      "variables": {},
      "expectedBehavior": "Bot nên trả lời là không có thông tin về VF 12 hoặc model chưa được công bố.",
      "referenceAnswer": null,
      "category": "negative",
      "priority": "P2",
      "tags": ["vinfast", "negative", "product_info"],
      "suggestedAssertions": [
        {
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "not_contains",
          "expectedValue": "phiên bản",
          "severity": "MAJOR"
        }
      ],
      "suggestedToolExpectations": [],
      "reasoningForQC": "Test khả năng xử lý khi không tìm thấy thông tin. Bot không nên bịa phiên bản."
    }
  ],
  "duplicateWarnings": [],
  "createdAt": "2026-06-18T10:00:00Z"
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `draftBatchId` | `string` | ID của batch draft, dùng khi confirm |
| `datasetId` | `string` | Dataset đích |
| `drafts` | `array` | Danh sách testcase draft |
| `drafts[].draftId` | `string` | ID tạm của draft |
| `drafts[].reasoningForQC` | `string` | Lý do AI tạo testcase này (giúp QC review) |
| `duplicateWarnings` | `array` | Cảnh báo trùng lặp với testcase đã tồn tại |
| `createdAt` | `string` | Thời gian generate |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu featureName hoặc businessRequirement |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Dataset không tồn tại |
| `422` | `VALIDATION_ERROR` | count vượt quá max, category không hợp lệ |

**Example Request:**

```bash
curl -X POST https://host/api/v1/datasets/ds_jkl012/ai-generate-testcases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "featureName": "Product Info - VinFast VF 8",
    "businessRequirement": "Chatbot phải trả lời chính xác thông tin về các dòng xe VinFast VF 8 bao gồm phiên bản, giá, thông số. Không được bịa thông tin ngoài nguồn dữ liệu.",
    "language": "vi",
    "count": 10,
    "categories": ["happy_path", "negative", "edge_case", "no_accent"],
    "availableComponents": ["answer", "intent", "suggestions", "toolCalls"],
    "availableTools": ["search_product", "get_price"]
  }'
```

---

### 10.2 Confirm Generated TestCases — `POST /api/v1/generated-testcases/{draftBatchId}/confirm`

QC đã review và chọn các draft testcases muốn lưu vào dataset.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `draftBatchId` | `string` | ID của batch draft (từ 10.1 response) |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `selectedDrafts` | `array` | ✅ | Danh sách draft đã chọn (có thể đã edit) |
| `selectedDrafts[].draftId` | `string` | ✅ | ID draft gốc |
| `selectedDrafts[].name` | `string` | ❌ | Tên đã chỉnh sửa |
| `selectedDrafts[].input` | `string` | ❌ | Input đã chỉnh sửa |
| `selectedDrafts[].expectedBehavior` | `string` | ❌ | Expected behavior đã chỉnh sửa |
| `selectedDrafts[].referenceAnswer` | `string` | ❌ | Reference answer đã chỉnh sửa |
| `selectedDrafts[].tags` | `string[]` | ❌ | Tags đã chỉnh sửa |
| `selectedDrafts[].priority` | `string` | ❌ | Priority đã chỉnh sửa |
| `selectedDrafts[].includeAssertions` | `boolean` | ❌ | Lưu kèm suggested assertions. Default: `true` |
| `selectedDrafts[].includeToolExpectations` | `boolean` | ❌ | Lưu kèm suggested tool expectations. Default: `true` |

**Response `201 Created`:**

```json
{
  "draftBatchId": "batch_bcd890",
  "confirmedCount": 8,
  "testCases": [
    {
      "id": "tc_new001",
      "draftId": "draft_001",
      "name": "Happy path - Hỏi phiên bản VF 8",
      "input": "VinFast VF 8 có mấy phiên bản?",
      "source": "AI_GENERATED",
      "assertionCount": 3,
      "toolExpectationCount": 1
    }
  ]
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | selectedDrafts rỗng |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | draftBatchId không tồn tại hoặc đã hết hạn |
| `409` | `CONFLICT` | Batch đã được confirm trước đó |
| `422` | `VALIDATION_ERROR` | draftId không tồn tại trong batch |

**Example Request:**

```bash
curl -X POST https://host/api/v1/generated-testcases/batch_bcd890/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "selectedDrafts": [
      {
        "draftId": "draft_001",
        "includeAssertions": true,
        "includeToolExpectations": true
      },
      {
        "draftId": "draft_002",
        "name": "Negative - Model không tồn tại",
        "expectedBehavior": "Bot phải trả lời là không có thông tin, không được bịa.",
        "includeAssertions": true,
        "includeToolExpectations": false
      }
    ]
  }'
```

---

## 11. Run APIs

### Tổng quan

**Run** là một lần thực thi test trên dataset. Run chạy async qua Redis queue — frontend không chờ HTTP response. Sau khi tạo run, backend đẩy job vào queue, Node.js runner lấy job, gọi chatbot API, chạy assertions/tool expectations, và gửi kết quả về.

---

### 11.1 Tạo Run — `POST /api/v1/runs`

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `projectId` | `string` | ✅ | Project ID |
| `datasetId` | `string` | ✅ | Dataset ID cần chạy |
| `targetId` | `string` | ✅ | Target API để gọi chatbot |
| `runMode` | `string` | ❌ | Chế độ chạy. Default: `FULL_DATASET` |
| `selectedCaseIds` | `string[]` | ❌ | Danh sách testcase IDs (required nếu runMode = `SELECTED_CASES`) |
| `selectedSection` | `string` | ❌ | Tên section (required nếu runMode = `SELECTED_SECTION`) |
| `previousRunId` | `string` | ❌ | Run ID trước đó (required nếu runMode = `FAILED_CASES`) |
| `includeLlmJudge` | `boolean` | ❌ | Chạy LLM judge assertions. Default: `true` |
| `includeToolExpectations` | `boolean` | ❌ | Chạy tool expectations. Default: `true` |
| `maxConcurrency` | `integer` | ❌ | Số request song song tối đa. Default: `3`. Max: `10` |
| `timeoutMs` | `integer` | ❌ | Timeout mỗi request (ms). Default: `30000` |
| `retryCount` | `integer` | ❌ | Số lần retry khi fail. Default: `0`. Max: `3` |

**Run Modes:**

| Mode | Mô tả | Required Fields |
|------|--------|-----------------|
| `FULL_DATASET` | Chạy tất cả testcase enabled trong dataset | — |
| `SAMPLE` | Chạy một số testcase ngẫu nhiên (5-10 cases) | — |
| `SELECTED_CASES` | Chạy các testcase đã chọn | `selectedCaseIds` |
| `SELECTED_SECTION` | Chạy tất cả testcase trong section | `selectedSection` |
| `FAILED_CASES` | Chạy lại các testcase failed từ run trước | `previousRunId` |

**Response `201 Created`:**

```json
{
  "id": "run_efg012",
  "projectId": "prj_abc123",
  "datasetId": "ds_jkl012",
  "targetId": "tgt_def456",
  "status": "PENDING",
  "runMode": "FULL_DATASET",
  "previousRunId": null,
  "includeLlmJudge": true,
  "includeToolExpectations": true,
  "maxConcurrency": 3,
  "timeoutMs": 30000,
  "retryCount": 0,
  "triggeredBy": "usr_abc123",
  "startedAt": null,
  "finishedAt": null,
  "summary": null,
  "configSnapshot": {
    "targetSnapshot": { "...": "..." },
    "responseMappingSnapshot": { "...": "..." }
  },
  "artifactPath": null,
  "totalTestCases": 150,
  "llmRubricCount": 45,
  "estimatedLlmCalls": 45,
  "createdAt": "2026-06-18T10:00:00Z"
}
```

**Response Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | Run ID |
| `projectId` | `string` | Project ID |
| `datasetId` | `string` | Dataset ID |
| `targetId` | `string` | Target ID |
| `status` | `string` | Trạng thái: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `runMode` | `string` | Chế độ chạy |
| `previousRunId` | `string \| null` | Run ID trước đó (đối với rerun) |
| `includeLlmJudge` | `boolean` | Có chạy LLM judge không |
| `includeToolExpectations` | `boolean` | Có chạy tool expectations không |
| `maxConcurrency` | `integer` | Số request song song |
| `timeoutMs` | `integer` | Timeout mỗi request |
| `retryCount` | `integer` | Số lần retry |
| `triggeredBy` | `string` | User ID người trigger |
| `startedAt` | `string \| null` | Thời gian bắt đầu chạy |
| `finishedAt` | `string \| null` | Thời gian chạy xong |
| `summary` | `object \| null` | Tóm tắt kết quả (sau khi hoàn thành) |
| `configSnapshot` | `object` | Snapshot cấu hình tại thời điểm chạy |
| `artifactPath` | `string \| null` | Đường dẫn artifact |
| `totalTestCases` | `integer` | Tổng số testcase sẽ chạy |
| `llmRubricCount` | `integer` | Số assertions dùng LLM rubric |
| `estimatedLlmCalls` | `integer` | Ước tính số lần gọi LLM judge |
| `createdAt` | `string` | Thời gian tạo |

> **Computed fields:** `totalTestCases`, `llmRubricCount`, `estimatedLlmCalls` là các field được tính toán tại thời điểm query, không lưu trong database.

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | Thiếu field bắt buộc |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Project, dataset, hoặc target không tồn tại |
| `409` | `CONFLICT` | Đã có run đang chạy trên dataset này |
| `422` | `VALIDATION_ERROR` | runMode = SELECTED_CASES nhưng thiếu selectedCaseIds, target chưa cấu hình input binding |

**Example Request:**

```bash
curl -X POST https://host/api/v1/runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "projectId": "prj_abc123",
    "datasetId": "ds_jkl012",
    "targetId": "tgt_def456",
    "runMode": "FULL_DATASET",
    "includeLlmJudge": true,
    "includeToolExpectations": true,
    "maxConcurrency": 5,
    "timeoutMs": 30000
  }'
```

---

### 11.2 Chi tiết Run — `GET /api/v1/runs/{runId}`

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `runId` | `string` | ID của run |

**Response `200 OK`:**

```json
{
  "id": "run_efg012",
  "projectId": "prj_abc123",
  "datasetId": "ds_jkl012",
  "targetId": "tgt_def456",
  "status": "COMPLETED",
  "runMode": "FULL_DATASET",
  "includeLlmJudge": true,
  "includeToolExpectations": true,
  "maxConcurrency": 3,
  "timeoutMs": 30000,
  "retryCount": 0,
  "triggeredBy": "usr_abc123",
  "startedAt": "2026-06-18T10:00:05Z",
  "finishedAt": "2026-06-18T10:05:30Z",
  "summary": {
    "totalCases": 150,
    "passedCases": 128,
    "failedCases": 18,
    "errorCases": 2,
    "skippedCases": 2,
    "passRate": 0.853,
    "totalAssertions": 450,
    "passedAssertions": 420,
    "failedAssertions": 28,
    "errorAssertions": 2,
    "totalToolExpectations": 75,
    "passedToolExpectations": 70,
    "failedToolExpectations": 3,
    "skippedToolExpectations": 2,
    "averageLatencyMs": 1850,
    "p95LatencyMs": 3200,
    "durationMs": 325000
  },
  "configSnapshot": { "...": "..." },
  "artifactPath": "/artifacts/runs/run_efg012",
  "createdAt": "2026-06-18T10:00:00Z"
}
```

**Summary Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `totalCases` | `integer` | Tổng số testcase |
| `passedCases` | `integer` | Số case pass |
| `failedCases` | `integer` | Số case fail |
| `errorCases` | `integer` | Số case error (API lỗi) |
| `skippedCases` | `integer` | Số case bị skip |
| `passRate` | `number` | Tỷ lệ pass (0.0-1.0) |
| `totalAssertions` | `integer` | Tổng số assertions |
| `passedAssertions` | `integer` | Assertions pass |
| `failedAssertions` | `integer` | Assertions fail |
| `errorAssertions` | `integer` | Assertions error |
| `totalToolExpectations` | `integer` | Tổng tool expectations |
| `passedToolExpectations` | `integer` | Tool expectations pass |
| `failedToolExpectations` | `integer` | Tool expectations fail |
| `skippedToolExpectations` | `integer` | Tool expectations skip (no data) |
| `averageLatencyMs` | `integer` | Latency trung bình |
| `p95LatencyMs` | `integer` | Latency P95 |
| `durationMs` | `integer` | Tổng thời gian chạy |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Run không tồn tại |

---

### 11.3 Kết quả Run — `GET /api/v1/runs/{runId}/results`

Lấy danh sách kết quả chi tiết từng testcase trong run.

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `runId` | `string` | ID của run |

**Query Params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `page` | `integer` | `1` | Trang |
| `pageSize` | `integer` | `20` | Số items mỗi trang |
| `status` | `string` | — | Lọc theo status: `PASSED`, `FAILED`, `ERROR`, `SKIPPED` |
| `sectionName` | `string` | — | Lọc theo section |
| `sortBy` | `string` | `testCaseId` | Sort theo field |
| `sortOrder` | `string` | `asc` | `asc` hoặc `desc` |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "tr_hij345",
      "runId": "run_efg012",
      "testCaseId": "tc_mno345",
      "testCase": {
        "externalId": "TC001",
        "sectionName": "AI Search Mode > KB PNL > Vinfast",
        "name": "VF 8 phiên bản",
        "input": "VinFast VF 8 có mấy phiên bản?"
      },
      "status": "PASSED",
      "score": 0.95,
      "requestSnapshot": {
        "method": "POST",
        "url": "https://chatbot.internal/api/v1/chat",
        "body": {
          "message": "VinFast VF 8 có mấy phiên bản?"
        }
      },
      "rawResponse": { "...": "..." },
      "responseSnapshot": {
        "components": {
          "answer": "VinFast VF 8 hiện có 2 phiên bản: Eco và Plus.",
          "intent": "product_info",
          "confidence": 0.95,
          "suggestions": [
            {
              "title": "Xem giá VF 8",
              "action": "view_price"
            }
          ]
        }
      },
      "extractedComponents": {
        "answer": "VinFast VF 8 hiện có 2 phiên bản: Eco và Plus.",
        "intent": "product_info",
        "confidence": 0.95
      },
      "extractedToolCalls": [
        {
          "name": "search_product",
          "arguments": {"query": "VF 8 phiên bản"},
          "output": {"count": 2},
          "status": "success",
          "latencyMs": 240
        }
      ],
      "latencyMs": 1250,
      "errorMessage": null,
      "assertionResults": [
        {
          "id": "ar_001",
          "testResultId": "tr_hij345",
          "assertionId": "asrt_stu901",
          "status": "PASSED",
          "actualValue": "VinFast VF 8 hiện có 2 phiên bản: Eco và Plus.",
          "expectedValue": "VF 8",
          "reason": "Answer chứa 'VF 8'",
          "score": 1.0,
          "severity": "CRITICAL",
          "metadata": null,
          "createdAt": "2026-06-18T10:01:00Z"
        },
        {
          "id": "ar_002",
          "testResultId": "tr_hij345",
          "assertionId": "asrt_stu902",
          "status": "PASSED",
          "actualValue": null,
          "expectedValue": null,
          "reason": "LLM judge: Bot trả lời đúng thông tin, không bịa, giọng văn phù hợp.",
          "score": 0.92,
          "severity": "CRITICAL",
          "metadata": {
            "judgeModel": "gpt-4o",
            "rubricUsed": "rub_yza567",
            "rawJudgment": "..."
          },
          "createdAt": "2026-06-18T10:01:00Z"
        }
      ],
      "toolExpectationResults": [
        {
          "id": "ter_001",
          "testResultId": "tr_hij345",
          "toolExpectationId": "te_vwx234",
          "status": "PASSED",
          "expectedToolName": "search_product",
          "actualToolCalls": [
            {
              "name": "search_product",
              "arguments": {"query": "VF 8 phiên bản"}
            }
          ],
          "actualAgent": null,
          "actualSteps": null,
          "reason": "Tool search_product đã được gọi",
          "score": 1.0,
          "metadata": null,
          "createdAt": "2026-06-18T10:01:00Z"
        }
      ],
      "manualReview": null,
      "createdAt": "2026-06-18T10:01:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

**TestResult Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | TestResult ID |
| `runId` | `string` | Run ID |
| `testCaseId` | `string` | TestCase ID |
| `testCase` | `object` | Thông tin testcase tóm tắt |
| `status` | `string` | Trạng thái: `PASSED`, `FAILED`, `ERROR`, `SKIPPED` |
| `score` | `number` | Điểm tổng hợp (0.0-1.0) |
| `requestSnapshot` | `object` | Request đã gửi (secrets redacted) |
| `rawResponse` | `object` | Response gốc |
| `responseSnapshot` | `object` | Response đã normalize |
| `extractedComponents` | `object` | Components đã extract |
| `extractedToolCalls` | `array` | Tool calls đã extract |
| `latencyMs` | `integer` | Thời gian phản hồi |
| `errorMessage` | `string \| null` | Lỗi (nếu status = ERROR) |
| `assertionResults` | `array` | Kết quả từng assertion |
| `toolExpectationResults` | `array` | Kết quả từng tool expectation |
| `manualReview` | `object \| null` | Trạng thái manual review |
| `createdAt` | `string` | Thời gian tạo |

**AssertionResult Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | AssertionResult ID |
| `testResultId` | `string` | TestResult ID |
| `assertionId` | `string` | Assertion ID |
| `status` | `string` | `PASSED`, `FAILED`, `ERROR`, `SKIPPED` |
| `actualValue` | `any` | Giá trị thực tế |
| `expectedValue` | `any` | Giá trị kỳ vọng |
| `reason` | `string` | Lý do pass/fail |
| `score` | `number` | Điểm (0.0-1.0) |
| `severity` | `string` | Mức nghiêm trọng |
| `metadata` | `object \| null` | Metadata bổ sung (LLM judge details, ...) |
| `createdAt` | `string` | Thời gian tạo |

**ToolExpectationResult Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | ToolExpectationResult ID |
| `testResultId` | `string` | TestResult ID |
| `toolExpectationId` | `string` | ToolExpectation ID |
| `status` | `string` | `PASSED`, `FAILED`, `ERROR`, `SKIPPED` |
| `expectedToolName` | `string` | Tool name mong đợi |
| `actualToolCalls` | `array` | Tool calls thực tế |
| `actualAgent` | `string \| null` | Agent thực tế |
| `actualSteps` | `array \| null` | Agent steps thực tế |
| `reason` | `string` | Lý do pass/fail |
| `score` | `number` | Điểm |
| `metadata` | `object \| null` | Metadata bổ sung |
| `createdAt` | `string` | Thời gian tạo |

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Run không tồn tại |

---

### 11.4 Cancel Run — `POST /api/v1/runs/{runId}/cancel`

Hủy run đang chạy (PENDING hoặc RUNNING).

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `runId` | `string` | ID của run |

**Response `200 OK`:**

```json
{
  "id": "run_efg012",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-18T10:02:00Z",
  "cancelledBy": "usr_abc123",
  "completedCases": 45,
  "totalCases": 150
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `403` | `FORBIDDEN` | Không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Run không tồn tại |
| `409` | `CONFLICT` | Run không ở trạng thái PENDING/RUNNING |

**Example Request:**

```bash
curl -X POST https://host/api/v1/runs/run_efg012/cancel \
  -H "Authorization: Bearer eyJhbG..."
```

---

### 11.5 Rerun Failed Cases — `POST /api/v1/runs/{runId}/rerun-failed`

Tạo run mới chỉ chạy lại các testcase đã fail/error từ run trước.

**Auth required:** Có

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `runId` | `string` | ID của run gốc |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `includeLlmJudge` | `boolean` | ❌ | Chạy LLM judge. Default: giữ nguyên từ run gốc |
| `includeToolExpectations` | `boolean` | ❌ | Chạy tool expectations. Default: giữ nguyên từ run gốc |
| `maxConcurrency` | `integer` | ❌ | Default: giữ nguyên từ run gốc |
| `timeoutMs` | `integer` | ❌ | Default: giữ nguyên từ run gốc |

**Response `201 Created`:**

Trả về run object mới (schema giống 11.1 response) với `runMode = "FAILED_CASES"` và `previousRunId` trỏ về run gốc.

```json
{
  "id": "run_new001",
  "...": "...",
  "runMode": "FAILED_CASES",
  "previousRunId": "run_efg012",
  "totalTestCases": 20,
  "status": "PENDING"
}
```

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Run không tồn tại |
| `409` | `CONFLICT` | Run gốc chưa hoàn thành, hoặc không có case failed |
| `422` | `VALIDATION_ERROR` | Run gốc không có testcase failed |

**Example Request:**

```bash
curl -X POST https://host/api/v1/runs/run_efg012/rerun-failed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "maxConcurrency": 5
  }'
```

---

### 11.6 Manual Review — `POST /api/v1/runs/{runId}/review`

QC review và override kết quả auto evaluation cho một hoặc nhiều testcase.

**Auth required:** Có

**Request Headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Path Params:**

| Param | Type | Mô tả |
|-------|------|--------|
| `runId` | `string` | ID của run |

**Request Body:**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `reviews` | `array` | ✅ | Danh sách reviews |
| `reviews[].testResultId` | `string` | ✅ | TestResult ID cần review |
| `reviews[].reviewedStatus` | `string` | ✅ | Status mới: `PASSED`, `FAILED`, `ERROR`, `SKIPPED`, `UNCERTAIN` |
| `reviews[].reviewerNote` | `string` | ❌ | Ghi chú của reviewer |

**Response `200 OK`:**

```json
{
  "runId": "run_efg012",
  "reviewedCount": 3,
  "reviews": [
    {
      "id": "mr_001",
      "testResultId": "tr_hij345",
      "autoStatus": "FAILED",
      "autoReason": "Assertion 'contains VF 8 Eco' failed",
      "reviewedStatus": "PASSED",
      "reviewerNote": "Bot trả lời đúng nhưng dùng tên đầy đủ 'VinFast VF 8 bản Eco', assertion cần cập nhật.",
      "reviewedBy": "usr_abc123",
      "reviewedAt": "2026-06-18T11:00:00Z",
      "finalStatus": "PASSED"
    }
  ]
}
```

**ManualReview Schema:**

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | `string` | ManualReview ID |
| `testResultId` | `string` | TestResult ID |
| `autoStatus` | `string` | Kết quả auto evaluation |
| `autoReason` | `string` | Lý do auto evaluation |
| `reviewedStatus` | `string` | Kết quả QC review |
| `reviewerNote` | `string \| null` | Ghi chú reviewer |
| `reviewedBy` | `string` | User ID reviewer |
| `reviewedAt` | `string` | Thời gian review |
| `finalStatus` | `string` | Kết quả cuối cùng (= reviewedStatus nếu đã review, = autoStatus nếu chưa) |

> **Quy tắc final status:**
> - Nếu `reviewedStatus` tồn tại → `finalStatus = reviewedStatus`
> - Nếu chưa review → `finalStatus = autoStatus`

**Error Responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| `400` | `INVALID_REQUEST` | reviews rỗng |
| `401` | `AUTHENTICATION_REQUIRED` | Thiếu token |
| `404` | `RESOURCE_NOT_FOUND` | Run hoặc testResultId không tồn tại |
| `409` | `CONFLICT` | Run chưa hoàn thành (không thể review run đang chạy) |
| `422` | `VALIDATION_ERROR` | reviewedStatus không hợp lệ |

**Example Request:**

```bash
curl -X POST https://host/api/v1/runs/run_efg012/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{
    "reviews": [
      {
        "testResultId": "tr_hij345",
        "reviewedStatus": "PASSED",
        "reviewerNote": "Bot trả lời đúng, assertion cần update expectedValue."
      },
      {
        "testResultId": "tr_hij346",
        "reviewedStatus": "FAILED",
        "reviewerNote": "Bot trả lời sai chính sách hoàn tiền."
      }
    ]
  }'
```

---

### 11.5 So sánh kết quả Runs — `GET /api/v1/runs/compare`

Lấy chi tiết sự khác biệt giữa 2 lần chạy trên cùng một Dataset (thường là để đối chiếu Regression test hoặc so sánh version LLM).

Current implementation note: endpoint này trả JSON trực tiếp, không bọc trong `{ code, data }`. Hai run phải `COMPLETED`,
cùng dataset, cùng `runMode`, cùng `selectedSection`, và cùng tập `selectedCaseIds`.

**Query Parameters:**

| Name | Type | Req | Mô tả |
|------|------|-----|--------|
| `baseRunId` | `string` | ✅ | ID của Run gốc (VD: v3.1) |
| `compareRunId` | `string` | ✅ | ID của Run dùng để so sánh (VD: v3.2) |

**Response Format (`200 OK`):**

```json
{
  "baseRun": {
    "publicId": "11111111-1111-1111-1111-111111111111",
    "datasetPublicId": "22222222-2222-2222-2222-222222222222",
    "datasetName": "Checkout regression",
    "targetPublicId": "33333333-3333-3333-3333-333333333333",
    "targetName": "Chatbot v3.1",
    "status": "COMPLETED"
  },
  "candidateRun": {
    "publicId": "44444444-4444-4444-4444-444444444444",
    "datasetPublicId": "22222222-2222-2222-2222-222222222222",
    "datasetName": "Checkout regression",
    "targetPublicId": "55555555-5555-5555-5555-555555555555",
    "targetName": "Chatbot v3.2",
    "status": "COMPLETED"
  },
  "summary": {
    "totalComparableCases": 120,
    "regressions": 3,
    "fixes": 5,
    "unchanged": 110,
    "statusChanged": 2,
    "newCases": 0,
    "missingCases": 0,
    "basePassRate": 0.8417,
    "candidatePassRate": 0.8583,
    "passRateDelta": 0.0166,
    "averageLatencyDeltaMs": 42
  },
  "diffs": [
    {
      "testCasePublicId": "66666666-6666-6666-6666-666666666666",
      "externalId": "TC-123",
      "testCaseName": "Shipping fee intent",
      "testCaseInput": "Phí ship về Đà Nẵng bao nhiêu?",
      "baseStatus": "PASSED",
      "candidateStatus": "FAILED",
      "statusShift": "PASS_TO_FAIL",
      "baseLatencyMs": 380,
      "candidateLatencyMs": 500,
      "latencyDeltaMs": 120,
      "assertionDiffs": [
        {
          "assertionPublicId": "77777777-7777-7777-7777-777777777777",
          "fieldPath": "$.intent",
          "baseStatus": "PASSED",
          "candidateStatus": "FAILED",
          "statusShift": "PASS_TO_FAIL",
          "expectedValue": "shipping_fee",
          "baseActualValue": "shipping_fee",
          "candidateActualValue": "faq"
        }
      ],
      "toolExpectationDiffs": []
    }
  ]
}
```

---

### 11.6 Experiments — A/B workflow

Current implementation supports target-variant experiments. Prompt/config version snapshots and winner promotion are not
implemented yet.

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/v1/projects/{projectId}/experiments` | Tạo experiment draft với 2-8 variants |
| `GET` | `/api/v1/projects/{projectId}/experiments` | List experiments theo project |
| `GET` | `/api/v1/experiments/{experimentId}` | Chi tiết experiment và variant run links |
| `POST` | `/api/v1/experiments/{experimentId}/start` | Start experiment, trigger một run cho mỗi variant |
| `GET` | `/api/v1/experiments/{experimentId}/comparison` | Compare 2 variant runs đầu tiên qua run comparison service |

**Create Request:**

```json
{
  "datasetId": "11111111-1111-1111-1111-111111111111",
  "name": "Prompt v3.1 vs v3.2",
  "description": "Compare baseline and candidate target behavior",
  "runMode": "FULL_DATASET",
  "selectedCaseIds": [],
  "selectedSection": null,
  "includeLlmJudge": true,
  "includeToolExpectations": true,
  "maxConcurrency": 3,
  "timeoutMs": 30000,
  "retryCount": 0,
  "variants": [
    {
      "variantKey": "A",
      "name": "Baseline",
      "targetId": "22222222-2222-2222-2222-222222222222",
      "runtimeOptions": {}
    },
    {
      "variantKey": "B",
      "name": "Candidate",
      "targetId": "33333333-3333-3333-3333-333333333333",
      "runtimeOptions": {}
    }
  ]
}
```

**Experiment Response fields:**

- `publicId`, `projectPublicId`, `datasetPublicId`
- `name`, `description`, `runMode`, selected scope/options
- `status`: `DRAFT`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`
- `variants[]`: `variantKey`, `name`, `targetPublicId`, `targetName`, optional `runPublicId`, optional `runStatus`

---

## 12. Phụ lục — Enum Values & Domain Types

### 12.1 Assertion Scopes

| Value | Mô tả |
|-------|--------|
| `FIELD` | Chấm một field cụ thể (dùng `fieldPath`) |
| `COMPONENT` | Chấm một component đã map (dùng `targetComponent`) |
| `MULTI_FIELD` | Chấm nhiều field/component cùng lúc (dùng `fieldPaths`) |
| `WHOLE_RESPONSE` | Chấm toàn bộ response |

### 12.2 Assertion Types

| Category | Type | Mô tả |
|----------|------|--------|
| Text | `contains` | Chứa chuỗi con |
| Text | `not_contains` | Không chứa chuỗi con |
| Text | `equals` | Bằng chính xác |
| Text | `not_equals` | Không bằng |
| Text | `regex` | Khớp biểu thức chính quy |
| Number | `greater_than` | Lớn hơn giá trị |
| Number | `less_than` | Nhỏ hơn giá trị |
| Number | `between` | Trong khoảng `{ min, max }` |
| Boolean | `is_true` | Giá trị `true` |
| Boolean | `is_false` | Giá trị `false` |
| Object | `field_exists` | Field tồn tại trong response |
| Object | `field_not_exists` | Field không tồn tại |
| Array | `array_length_greater_than` | Độ dài array lớn hơn |
| Array | `array_contains` | Array chứa phần tử |
| LLM | `llm_rubric` | LLM judge đánh giá theo rubric |

### 12.3 Tool Expectation Types

| Type | Mô tả |
|------|--------|
| `TOOL_MUST_BE_CALLED` | Tool phải được gọi |
| `TOOL_MUST_NOT_BE_CALLED` | Tool không được gọi |
| `TOOL_ARGS_MATCH` | Arguments tool phải khớp |
| `TOOL_SEQUENCE_MATCH` | Tools phải gọi theo thứ tự |
| `TOOL_CALL_COUNT` | Số lần gọi tool trong khoảng min/max |
| `TOOL_OUTPUT_USED_IN_ANSWER` | Output tool phải xuất hiện trong answer |
| `AGENT_EQUALS` | Agent phải đúng tên |
| `AGENT_NOT_EQUALS` | Agent không được là tên này |
| `AGENT_STEP_CONTAINS` | Agent steps phải chứa step cụ thể |

### 12.4 Run Statuses

| Status | Mô tả |
|--------|--------|
| `PENDING` | Đang đợi trong queue |
| `RUNNING` | Đang chạy |
| `COMPLETED` | Hoàn thành |
| `FAILED` | Lỗi hệ thống (không phải test fail) |
| `CANCELLED` | Đã bị hủy |

### 12.5 Run Modes

| Mode | Mô tả |
|------|--------|
| `SAMPLE` | Chạy vài testcase ngẫu nhiên |
| `FULL_DATASET` | Chạy toàn bộ dataset |
| `SELECTED_CASES` | Chạy các testcase đã chọn |
| `FAILED_CASES` | Chạy lại các case fail từ run trước |
| `SELECTED_SECTION` | Chạy toàn bộ testcase trong section |

### 12.6 Severity Levels

| Level | Mô tả |
|-------|--------|
| `CRITICAL` | Lỗi nghiêm trọng, chắc chắn fail |
| `MAJOR` | Lỗi quan trọng |
| `MINOR` | Lỗi nhỏ |
| `INFO` | Thông tin tham khảo |

### 12.7 ManualReview Statuses

| Status | Mô tả |
|--------|--------|
| `PASSED` | QC xác nhận pass |
| `FAILED` | QC xác nhận fail |
| `ERROR` | Lỗi kỹ thuật (API fail) |
| `SKIPPED` | Bỏ qua, không review |
| `UNCERTAIN` | Chưa chắc chắn, cần thêm thông tin |

### 12.8 Rubric Scopes

| Scope | Mô tả |
|-------|--------|
| `GLOBAL` | Dùng cho mọi project |
| `PROJECT` | Dùng trong một project |
| `DATASET` | Dùng trong một dataset |
| `TESTCASE_OVERRIDE` | Override cho testcase cụ thể |

### 12.9 Rubric Categories

| Category | Mô tả |
|----------|--------|
| `ANSWER_QUALITY` | Chất lượng câu trả lời |
| `POLICY_COMPLIANCE` | Tuân thủ chính sách |
| `NO_HALLUCINATION` | Không bịa thông tin |
| `SAFETY_REFUSAL` | Từ chối an toàn |
| `RAG_FAITHFULNESS` | Trung thực với nguồn |
| `TOOL_OUTPUT_USAGE` | Sử dụng output tool |
| `SUGGESTION_RELEVANCE` | Gợi ý phù hợp |
| `VIETNAMESE_TONE` | Giọng văn tiếng Việt |
| `CLARIFYING_QUESTION` | Câu hỏi làm rõ |
| `BUSINESS_ACCEPTANCE` | Nghiệm thu business |

### 12.10 TestCase Sources

| Source | Mô tả |
|--------|--------|
| `MANUAL` | QC tạo thủ công |
| `IMPORTED` | Import từ CSV/Excel |
| `AI_GENERATED` | AI generate |

### 12.11 Missing Field Behavior

| Behavior | Mô tả |
|----------|--------|
| `FAIL` | Assertion fail nếu field không tồn tại |
| `SKIP` | Bỏ qua assertion nếu field không tồn tại |
| `WARNING` | Ghi warning nhưng không fail |

### 12.12 Target Sources (cho Tool Expectations)

| Source | Mô tả |
|--------|--------|
| `normalized_tool_calls` | Tool calls đã chuẩn hóa |
| `inferred_tool` | Tool được suy luận từ response |
| `inferred_agent` | Agent được suy luận |
| `agent_steps` | Các bước agent thực hiện |
| `trace` | Trace data |
| `custom_component` | Custom component đã map |

---

## Changelog

| Phiên bản | Ngày | Mô tả |
|-----------|------|--------|
| 1.0.0 | 2026-06-18 | Phiên bản đầu tiên, cover toàn bộ MVP endpoints |
