# QA Eval Platform - Phân công Client / Backend theo màn

> Tài liệu này dùng để phân công việc giữa Client, Backend Spring Boot và Node Promptfoo Runner cho QA Eval Platform.
>
> Kiến trúc đã chốt: **React Web Client -> Spring Boot API -> Redis Stream Queue -> Node Promptfoo Runner -> Spring Boot Internal API -> SSE -> React**.
>
> Spring Boot là **source of truth**. Redis chỉ là **job dispatch layer**. Node Runner chỉ là **worker chạy eval bằng Promptfoo**.

---

## 0. Mục tiêu tài liệu

Tài liệu này giúp team chia việc rõ ràng theo từng màn:

- Client cần làm UI gì.
- Backend cần cung cấp API gì.
- Backend cần lưu entity/model gì.
- Node Runner cần xử lý gì.
- Contract giữa Client và Backend cần thống nhất gì.
- Màn nào phụ thuộc màn nào.
- Acceptance criteria cho từng màn.

Tài liệu này không thay thế API Contract chi tiết, nhưng đủ để chia task và bắt đầu code theo module.

---

## 1. Kiến trúc tổng quan sau khi thêm Redis Queue

### 1.1 Luồng chính

```text
QC / Tester
  -> React Web Client
      -> Spring Boot API
          -> PostgreSQL Database
          -> Redis Stream Queue
              -> Node Promptfoo Runner
                  -> Chatbot Target API
                  -> Judge LLM Provider
                  -> Spring Boot Internal API
                      -> PostgreSQL Database
                      -> SSE Events
                          -> React Web Client
```

### 1.2 Vai trò từng thành phần

| Thành phần | Vai trò |
|---|---|
| React Web Client | UI cấu hình project, config, dataset, test run, result và review |
| Spring Boot API | Backend chính, quản lý domain, DB, validation, auth, SSE, internal APIs |
| PostgreSQL | Source of truth cho project/config/dataset/run/result/review |
| Redis Stream Queue | Điều phối job chạy eval, không phải source of truth |
| Node Promptfoo Runner | Worker consume job, build Promptfoo suite, chạy eval, report progress/result |
| Chatbot Target API | Hệ thống chatbot/API cần kiểm chứng |
| Judge LLM Provider | LLM dùng để chấm rubric/semantic checks |
| Artifact Storage | Lưu generated suite, raw output, logs, report |

### 1.3 Flow tạo Test Run

```text
1. User bấm Run ở client.
2. Client gọi Spring Boot API: POST /api/projects/{projectId}/runs.
3. Spring Boot validate config/dataset/verification.
4. Spring Boot snapshot config version + dataset version + verification version.
5. Spring Boot tạo TestRun status = QUEUED trong PostgreSQL.
6. Spring Boot publish message vào Redis Stream.
7. Node Runner consume message.
8. Node Runner gọi Spring Boot Internal API để lấy EvalRunRequest.
9. Node Runner report RUNNING/progress/case result về Spring Boot.
10. Spring Boot lưu DB và bắn SSE cho client.
11. Node Runner hoàn tất, report final result.
12. Spring Boot update TestRun status = SUCCESS / FAILED / ERROR / CANCELLED.
```

### 1.4 Redis Stream message

Message trên queue nên nhỏ, không chứa secret và không chứa toàn bộ dataset.

```json
{
  "eventType": "RUN_REQUESTED",
  "runId": "00a6c250-7f1b-41b4-810f-484010cce1a8",
  "projectId": "2d08c315-e52b-4426-a3cb-51d38f4f2292",
  "datasetVersionId": "9ea44efa-9d98-42e5-8903-7d51fdb48880",
  "targetConfigVersionId": "target_cfg_v3",
  "judgeConfigVersionId": "judge_cfg_v2",
  "verificationConfigVersionId": "verify_cfg_v5",
  "createdAt": "2026-06-24T10:30:00Z"
}
```

Node Runner nhận `runId`, sau đó gọi:

```http
GET /internal/runs/{runId}/eval-request
```

Spring Boot trả về `EvalRunRequest` đã build từ snapshot.

---

## 2. Nguyên tắc phân công chung

### 2.1 Client chịu trách nhiệm

Client chịu trách nhiệm:

- UI/UX theo màn.
- Form state.
- Client-side validation cơ bản.
- Gọi API.
- Mapping API error vào form.
- i18n.
- Render loading/error/empty state.
- Render realtime progress bằng SSE.
- Render charts/result/review.

Client không chịu trách nhiệm:

- Encrypt/decrypt secret.
- Parse cURL chính thức để lưu DB.
- Gọi trực tiếp Node Runner.
- Gọi trực tiếp Chatbot Target API trong production flow.
- Tự map Promptfoo raw result.

### 2.2 Backend Spring Boot chịu trách nhiệm

Spring Boot chịu trách nhiệm:

- REST API cho client.
- Validation.
- Business rules.
- Persistence.
- Encrypt/decrypt secret.
- Snapshot version khi chạy test run.
- Publish job vào Redis.
- Internal API cho Node Runner.
- Lưu progress/result.
- SSE cho client.
- Export report.
- Manual review.
- API error format và i18n messageCode.

Spring Boot không chịu trách nhiệm:

- Chạy Promptfoo trực tiếp.
- Gọi Promptfoo library trong Java.
- Phụ thuộc trực tiếp Promptfoo schema trong domain.
- Thực hiện UI logic.

### 2.3 Node Promptfoo Runner chịu trách nhiệm

Node Runner chịu trách nhiệm:

- Consume Redis Stream.
- Fetch EvalRunRequest từ Spring Boot.
- Validate request ở runner boundary.
- Build Promptfoo suite.
- Map verification config sang Promptfoo assertions/rubrics.
- Gọi Chatbot Target API.
- Gọi Judge LLM Provider nếu cần.
- Map raw Promptfoo result sang normalized result.
- Report progress/case result/final result về Spring Boot.
- Check cancel signal.

Node Runner không chịu trách nhiệm:

- Quản lý project/dataset/config lâu dài.
- Lưu DB trực tiếp.
- Trả response trực tiếp cho client.
- Là source of truth của result.

---

# I. Shared Contract & Foundation

## 3. Shared API/Error/i18n Contract

> Auth flow hiện tại đã chuyển sang RFC 9457 Problem Details. Contract code-of-truth cho client nằm tại `docs/api/auth/client-contract.md`. Context ngắn cho phía API nằm tại `docs/api/auth/context.md`. Nếu dùng AI coding agent để triển khai client auth, dùng `docs/client/auth/ai-brief.md` và `docs/client/auth/implementation-checklist.md` để bắt agent đọc context và lập plan trước. Phần dưới đây là định hướng ban đầu và có thể cũ hơn code.

### 3.1 Mục tiêu

Đây là phần cần làm trước để Client và Backend không lệch nhau.

### 3.2 Client tasks

- Tạo base HTTP client.
- Tạo type `ApiErrorResponse`.
- Tạo type `ApiFieldError`.
- Tạo helper `isApiError`.
- Tạo helper `applyApiFieldErrorsToForm`.
- Tạo i18n namespace cho validation/error.
- Quy ước client không hiển thị trực tiếp backend message nếu có `messageCode`.

### 3.3 Backend tasks

- Tạo `ApiErrorResponse`.
- Tạo `ApiFieldError`.
- Tạo `ApiExceptionHandler`.
- Tạo `TraceIdProvider`.
- Tạo global validation handler cho `MethodArgumentNotValidException`.
- Tất cả validation annotation dùng `messageCode`, không hard-code tiếng Việt.
- Tất cả API lỗi trả cùng format.

### 3.4 Error format

```json
{
  "timestamp": "2026-06-24T10:30:00Z",
  "status": 400,
  "errorCode": "VALIDATION_ERROR",
  "messageCode": "error.validation",
  "message": "Request validation failed",
  "path": "/api/projects",
  "traceId": "7f2a9d8d0c4b4b13",
  "fieldErrors": [
    {
      "field": "name",
      "errorCode": "PROJECT_NAME_REQUIRED",
      "messageCode": "validation.project.name.required",
      "message": "Project name is required",
      "rejectedValue": "",
      "params": {}
    }
  ]
}
```

### 3.5 Acceptance criteria

- Client submit form sai thì field error hiện đúng field.
- Backend không trả lỗi validation lộn format.
- Client có fallback nếu thiếu i18n key.
- TraceId có trong response lỗi.

---

# II. Project Module

## 4. Màn Project List / Switch Project

### 4.1 Mục tiêu

User có thể tạo project và chuyển qua lại giữa các project.

### 4.2 Client tasks

- Màn danh sách project.
- Button tạo project.
- Modal/form tạo project.
- Form sửa tên/mô tả project.
- UI chọn project hiện tại.
- Hiển thị trạng thái setup của project:
  - API Config.
  - LLM Judge.
  - Dataset Columns.
  - Verification.
  - Datasets.
  - Test Runs.
- Loading/empty/error states.

### 4.3 Backend tasks

- Entity `Project`.
- Repository `ProjectRepository`.
- Service `ProjectService`.
- Controller `ProjectController`.
- API tạo/sửa/xem/list project.
- Soft delete project nếu đã có dataset/test run.
- API trả project setup status.

### 4.4 API đề xuất

```http
POST   /api/projects
GET    /api/projects
GET    /api/projects/{projectId}
PATCH  /api/projects/{projectId}
DELETE /api/projects/{projectId}
GET    /api/projects/{projectId}/setup-status
```

### 4.5 Acceptance criteria

- Tạo project thành công.
- List project có phân trang hoặc tối thiểu có sort theo `updatedAt`.
- Chuyển project không làm mất state quan trọng.
- Project có setup status rõ ràng.

---

# III. Config Module

Module Config gồm:

```text
1. API Config
2. LLM Judge
3. Dataset Column
4. Verification
```

---

## 5. Màn API Config

### 5.1 Mục tiêu

User paste cURL, backend parse thành HTTP request config, test thử, xem request/response fields, rồi lưu lại làm Target Config.

### 5.2 Client tasks

#### UI chính

- Ô paste cURL.
- Button `Parse cURL`.
- Request editor:
  - Method.
  - URL.
  - Headers.
  - Query params.
  - Body template.
  - Timeout.
- Button `Test Config`.
- Button `Save Config`.
- Panel preview:
  - Request preview đã sanitize.
  - Response raw preview.
  - Response field/path tree.
  - Response path chính, ví dụ `$.answer`.
  - Test status, latency, HTTP status.

#### Client state

- Form state cho parsed config.
- Loading state khi parse cURL.
- Loading state khi test config.
- Dirty state khi user sửa request.
- Error state khi parse/test lỗi.
- Hiển thị secret dạng masked, không hiển thị raw secret.

### 5.3 Backend tasks

- Parse cURL thành `TargetConfig`.
- Detect secret trong header/query/body.
- Encrypt secret trước khi lưu DB.
- Redact/mask secret khi trả client.
- Lưu target config theo project.
- Version hóa target config.
- Test target config bằng cách decrypt secret trong runtime.
- Lưu test history đã sanitize.
- Extract request field snapshot.
- Extract response field snapshot.
- Cung cấp response path tree cho client.

### 5.4 Backend models

```text
TargetConfig
  - id
  - projectId
  - version
  - name
  - method
  - url
  - headers
  - queryParams
  - bodyTemplate
  - responsePath
  - timeoutMs
  - secretRefs
  - requestFieldSnapshot
  - responseFieldSnapshot
  - lastTestStatus
  - lastTestedAt
  - createdAt
  - updatedAt
```

```text
SecretRef
  - id
  - projectId
  - ownerType
  - ownerId
  - secretName
  - secretLocation
  - secretPath
  - encryptedValue
  - maskedValue
  - createdAt
  - updatedAt
```

### 5.5 API đề xuất

```http
POST /api/projects/{projectId}/config/target/parse-curl
POST /api/projects/{projectId}/config/target/test
PUT  /api/projects/{projectId}/config/target
GET  /api/projects/{projectId}/config/target
GET  /api/projects/{projectId}/config/target/test-history
```

### 5.6 Acceptance criteria

- Paste cURL có Authorization header thì client chỉ thấy masked value.
- Backend không lưu raw secret plain text.
- Test config thành công thì có response preview và field tree.
- Lưu config xong reload lại vẫn thấy config đã sanitize.
- Response path chính được lưu và dùng ở verification/test run.

---

## 6. Màn LLM Judge

### 6.1 Mục tiêu

User cấu hình LLM provider/model dùng để chấm rubric hoặc semantic checks.

### 6.2 Client tasks

#### Provider panel

- Select Provider:
  - OPENAI.
  - GEMINI.
  - ANTHROPIC.
  - CUSTOM.
- Hiển thị default base URL do backend trả.
- Input API key.
- Select model từ backend catalog.
- Nếu chọn custom model thì hiện ô nhập model name.

#### Judge parameters panel

- Temperature.
- Max tokens.
- Timeout.
- Retry count.
- TopP nếu có.
- Button `Test connection`.
- Hiển thị:
  - Status.
  - Latency.
  - Usage nếu có.
  - Estimated cost nếu backend trả.
  - Sanitized metadata.

### 6.3 Backend tasks

- Cung cấp provider catalog.
- Cung cấp model catalog.
- Cung cấp default base URL.
- Lưu JudgeConfig.
- Encrypt API key.
- Không trả API key raw về client.
- Test connection tới provider.
- Lưu test history đã sanitize.
- Tính estimated cost nếu có usage/pricing.

### 6.4 Backend models

```text
JudgeConfig
  - id
  - projectId
  - version
  - provider
  - baseUrl
  - model
  - customModelName
  - encryptedApiKeyRef
  - temperature
  - maxTokens
  - timeoutMs
  - retryCount
  - lastTestStatus
  - lastTestedAt
  - createdAt
  - updatedAt
```

```text
ModelCatalog
  - provider
  - model
  - displayName
  - baseUrl
  - supportsJsonMode
  - supportsStreaming
  - inputTokenCost
  - outputTokenCost
  - currency
  - enabled
  - lastUpdatedAt
```

### 6.5 API đề xuất

```http
GET  /api/llm/providers
GET  /api/llm/providers/{provider}/models
PUT  /api/projects/{projectId}/config/judge
GET  /api/projects/{projectId}/config/judge
POST /api/projects/{projectId}/config/judge/test
GET  /api/projects/{projectId}/config/judge/test-history
```

### 6.6 Acceptance criteria

- User chọn provider thì base URL/model list hiện đúng.
- API key không bao giờ trả raw về client.
- Test connection thành công có status/latency.
- Lưu config xong reload lại thấy provider/model/params.
- Nếu mode Verification cần LLM mà Judge chưa config thì backend báo lỗi rõ.

---

## 7. Màn Dataset Column

### 7.1 Mục tiêu

Cấu hình schema dataset theo project. Mỗi project có bộ cột riêng và cần version hóa schema.

### 7.2 Client tasks

- Table list columns.
- Add column.
- Edit column.
- Delete column.
- Hiển thị:
  - Column name.
  - Display name.
  - Data type.
  - Role.
  - Required.
  - Sample value.
  - Description.
  - Đang được verification dùng hay không.
- Phân trang nếu nhiều column.
- Validate client-side duplicate column name cơ bản.
- Confirm khi delete column.

### 7.3 Backend tasks

- Entity `DatasetSchemaVersion`.
- Entity `DatasetColumn`.
- CRUD columns.
- Version hóa schema khi columns thay đổi.
- Validate duplicate column.
- Chặn hoặc cảnh báo khi xóa column đang được dataset/verification dùng.
- API validate schema.

### 7.4 DataType / Role

```text
DataType:
- STRING
- NUMBER
- BOOLEAN
- JSON
- ARRAY
- OBJECT
```

```text
Role:
- INPUT
- EXPECTED
- CONTEXT
- EVALUATION_PARAM
- METADATA
```

### 7.5 API đề xuất

```http
GET    /api/projects/{projectId}/dataset-schema
POST   /api/projects/{projectId}/dataset-schema/columns
PATCH  /api/projects/{projectId}/dataset-schema/columns/{columnId}
DELETE /api/projects/{projectId}/dataset-schema/columns/{columnId}
POST   /api/projects/{projectId}/dataset-schema/validate
```

### 7.6 Acceptance criteria

- Project mới có mặc định `id` và `input` hoặc hướng dẫn tạo `input`.
- Thêm/sửa/xóa column tạo schema version mới.
- Không xóa nhầm column đang được verification dùng mà không cảnh báo.
- Client render đúng columns theo schema hiện tại.

---

## 8. Màn Verification

### 8.1 Mục tiêu

Cấu hình cách chấm output của chatbot target.

Verification chỉ được cấu hình khi đã có:

```text
- API Config hợp lệ.
- Dataset Columns hợp lệ.
```

Nếu mode dùng LLM thì cần thêm:

```text
- LLM Judge Config hợp lệ.
```

### 8.2 Verification modes

```text
FIELD_CHECKS
OVERALL_RUBRIC
RULE_AND_LLM
```

UI label:

```text
FIELD_CHECKS   -> Từng trường
OVERALL_RUBRIC -> Rubric tổng
RULE_AND_LLM   -> Rule + LLM
```

---

### 8.3 Field Checks

#### Client tasks

- Hiển thị operator catalog từ backend.
- Cho user tạo nhiều rules.
- Mỗi rule có:
  - Response path.
  - Operator.
  - Expected source: dataset column / static value / expression.
  - Expected column.
  - Expected value.
  - Threshold nếu cần.
  - Weight.
  - Enabled.
- Cho kéo thả response path nếu làm được.
- Fallback: bảng response paths + dataset columns + copy token/path.
- Validate form theo operator.

#### Backend tasks

- API operator catalog.
- Lưu `FieldCheck` rules.
- Validate rule theo operator.
- Validate response path có tồn tại trong sample response nếu có.
- Validate expected column có trong dataset schema.
- Version hóa VerificationConfig.

#### Operators đề xuất

```text
EQUALS
NOT_EQUALS
CONTAINS
NOT_CONTAINS
REGEX
GREATER_THAN
GREATER_THAN_OR_EQUALS
LESS_THAN
LESS_THAN_OR_EQUALS
RANGE
IS_JSON
LLM_JUDGE
CUSTOM_JAVASCRIPT
```

---

### 8.4 Single Rubric

#### Client tasks

- Chọn target path:
  - `$.answer`.
  - Entire response.
- Textarea nhập rubric.
- Threshold.
- Weight.
- Bảng gợi ý dataset placeholders:
  - `{{input}}`
  - `{{expected_answer}}`
  - `{{context}}`
- Preview rubric.

#### Backend tasks

- Lưu `OverallRubricConfig`.
- Validate rubric không rỗng.
- Validate threshold từ 0 đến 1.
- Validate nếu dùng placeholder thì column tồn tại.

---

### 8.5 Rule + LLM

#### Client tasks

- Tạo deterministic field checks.
- Tạo nhiều LLM rubrics.
- Preview scoring weight.
- Kéo thả/copy response paths và dataset columns.
- Validate tổng weight nếu có rule tính điểm.

#### Backend tasks

- Lưu `RuleAndLlmConfig`.
- Validate ít nhất có 1 field check hoặc 1 LLM rubric.
- Validate JudgeConfig tồn tại nếu có LLM rubric.
- Version hóa VerificationConfig.

### 8.6 Models

```text
VerificationConfig
  - id
  - projectId
  - version
  - mode
  - fieldChecks
  - overallRubric
  - ruleAndLlm
  - createdAt
  - updatedAt
```

```text
FieldCheck
  - id
  - responsePath
  - operator
  - expectedSource
  - expectedColumn
  - expectedValue
  - threshold
  - weight
  - enabled
```

```text
LlmRubric
  - id
  - name
  - targetPath
  - rubric
  - threshold
  - weight
  - enabled
```

### 8.7 API đề xuất

```http
GET  /api/projects/{projectId}/verification/operators
GET  /api/projects/{projectId}/config/verification
PUT  /api/projects/{projectId}/config/verification
POST /api/projects/{projectId}/config/verification/validate
```

### 8.8 Acceptance criteria

- Không cho lưu verification nếu thiếu API Config/Dataset Columns.
- Không cho lưu LLM rubric nếu thiếu Judge Config.
- Field Checks support nhiều rules.
- Rule + LLM là mix deterministic + LLM, không phải chỉ là nhiều field hơn.
- Backend trả lỗi validation có messageCode rõ.

---

# IV. Dataset Module

## 9. Màn Dataset List

### 9.1 Mục tiêu

Hiển thị danh sách dataset của project, hỗ trợ import/export, versioning và metadata.

### 9.2 Client tasks

- Màn danh sách dataset.
- Hiển thị:
  - Name.
  - Description.
  - Source.
  - Latest version.
  - Schema version.
  - Validation status.
  - Total cases.
  - CreatedAt.
  - UpdatedAt.
- Search theo tên/mô tả.
- Filter theo source/status.
- Import CSV/Excel.
- Export CSV/Excel.
- Sửa tên/mô tả.
- Xóa dataset.
- Phân trang.

### 9.3 Backend tasks

- Entity `Dataset`.
- Entity `DatasetVersion`.
- Entity `DatasetCase`.
- Import CSV/Excel.
- Export CSV/Excel.
- Create new dataset version khi data thay đổi.
- Soft delete dataset.
- API list có phân trang/filter/sort.

### 9.4 Models

```text
Dataset
  - id
  - projectId
  - name
  - description
  - source
  - latestVersionId
  - createdAt
  - updatedAt
  - deletedAt
```

```text
DatasetVersion
  - id
  - datasetId
  - projectId
  - version
  - schemaVersionId
  - source
  - validationStatus
  - totalCases
  - validCases
  - invalidCases
  - createdAt
  - createdBy
```

### 9.5 API đề xuất

```http
GET    /api/projects/{projectId}/datasets
POST   /api/projects/{projectId}/datasets
PATCH  /api/datasets/{datasetId}
DELETE /api/datasets/{datasetId}
POST   /api/datasets/{datasetId}/import
GET    /api/datasets/{datasetId}/export
```

### 9.6 Acceptance criteria

- Import tạo dataset version.
- Update data tạo version mới.
- Test run cũ vẫn trỏ version cũ.
- List có phân trang.
- Export đúng schema version.

---

## 10. Màn Dataset Detail

### 10.1 Mục tiêu

Cho phép xem, sửa, validate và quản lý test cases trong dataset.

### 10.2 Client tasks

- Table view.
- Case cards view nếu có thời gian.
- Library/list view nếu có thời gian.
- Render columns theo schema version.
- Mặc định hiển thị `id` và `input`.
- CRUD từng test case.
- Search theo keyword.
- Filter theo validation status.
- Nút Validate lại.
- Hiển thị validation errors:
  - Row.
  - Column.
  - Error code/message.
- Import thêm data.
- Export data.
- Generate cases bằng AI.

### 10.3 Backend tasks

- CRUD dataset cases.
- Data lưu dạng JSONB theo schema.
- Validate cases theo schema.
- Validation report có phân trang.
- Search keyword trong JSONB hoặc indexed fields.
- Filter invalid rows.
- Generate dataset bằng AI.
- Sau generate vẫn validate output.

### 10.4 Models

```text
DatasetCase
  - id
  - datasetVersionId
  - projectId
  - rowIndex
  - data
  - validationStatus
  - validationErrors
  - createdAt
  - updatedAt
```

### 10.5 API đề xuất

```http
GET    /api/datasets/{datasetId}/versions/{versionId}
GET    /api/datasets/{datasetId}/versions/{versionId}/cases
POST   /api/datasets/{datasetId}/versions/{versionId}/cases
PATCH  /api/dataset-cases/{caseId}
DELETE /api/dataset-cases/{caseId}
POST   /api/datasets/{datasetId}/versions/{versionId}/validate
GET    /api/datasets/{datasetId}/versions/{versionId}/validation-report
POST   /api/datasets/{datasetId}/generate
```

### 10.6 Acceptance criteria

- Dataset detail render đúng columns theo schema.
- Invalid rows có thể filter.
- Validate lại cập nhật status.
- CRUD testcase tạo dataset version mới hoặc có cơ chế version rõ.
- AI generate không bypass validation.

---

# V. Test Run Module

## 11. Màn Test Run List

### 11.1 Mục tiêu

Hiển thị các lượt chạy của project, bao gồm queued/running/completed/error/cancelled.

### 11.2 Client tasks

- UI list/card cho test runs.
- Không chỉ dùng bảng tĩnh; cần thể hiện run đang chạy.
- Hiển thị:
  - Run name/number.
  - Status.
  - Dataset version.
  - Verification mode.
  - Total cases.
  - Passed/failed/error.
  - Score.
  - StartedAt.
  - FinishedAt.
  - Duration.
  - CreatedBy.
- Filter theo status.
- Sort theo time/score/duration.
- Pagination.
- Action:
  - View detail.
  - Cancel.
  - Rerun.
  - Export.

### 11.3 Backend tasks

- Entity `TestRun`.
- API list runs.
- API create run.
- API cancel.
- API rerun.
- API export.
- Khi create run:
  - Validate runnable config.
  - Snapshot versions.
  - Save TestRun QUEUED.
  - Publish Redis job.

### 11.4 TestRun snapshot

Mỗi run phải lưu:

```text
- targetConfigVersionId
- judgeConfigVersionId
- datasetSchemaVersionId
- datasetVersionId
- verificationConfigVersionId
```

### 11.5 Models

```text
TestRun
  - id
  - projectId
  - name
  - status
  - externalRunId
  - targetConfigVersionId
  - judgeConfigVersionId
  - datasetSchemaVersionId
  - datasetVersionId
  - verificationConfigVersionId
  - totalCases
  - passedCases
  - failedCases
  - errorCases
  - score
  - queuedAt
  - startedAt
  - finishedAt
  - durationMs
  - cancellationRequested
  - errorMessage
  - createdBy
  - createdAt
```

### 11.6 API đề xuất

```http
GET  /api/projects/{projectId}/runs
POST /api/projects/{projectId}/runs
GET  /api/runs/{runId}
POST /api/runs/{runId}/cancel
POST /api/runs/{runId}/rerun
GET  /api/runs/{runId}/export
```

### 11.7 Acceptance criteria

- Bấm Run trả về TestRun status `QUEUED` nhanh, không chờ runner chạy xong.
- Có message trong Redis Stream.
- Nếu config thiếu thì không tạo run hoặc tạo ERROR rõ ràng theo rule đã chốt.
- Rerun dùng snapshot hoặc cho user chọn latest config tùy rule product, nhưng phải rõ.

---

## 12. Màn Test Run Detail

### 12.1 Mục tiêu

Hiển thị realtime progress khi run đang chạy, và kết quả chi tiết khi run hoàn tất. Cho phép review, override, ghi chú bug, export report.

### 12.2 Client tasks

- Màn detail theo runId.
- Nếu status `QUEUED` hoặc `RUNNING`, mở SSE:
  - `GET /api/runs/{runId}/events`
- Hiển thị:
  - Progress bar.
  - Status.
  - Total/pass/fail/error.
  - Score summary.
  - Duration.
  - Timeline events.
  - Case result list/table.
  - Chart theo score/status/operator.
- Filter:
  - passed.
  - failed.
  - error.
  - reviewed.
  - not reviewed.
- Sort:
  - score.
  - latency.
  - status.
- Search:
  - input.
  - actual output.
  - expected.
- Actions:
  - Cancel.
  - Rerun.
  - Export.
  - Review testcase.
  - Override pass/fail.
  - Ghi bug note.

### 12.3 Backend tasks

- SSE endpoint.
- Event service.
- Save run events.
- Save case result.
- Save assertion result.
- Query result có phân trang/filter/sort/search.
- Manual review API.
- Cancel API set `cancellationRequested = true`.
- Internal API cho Node Runner report progress/result.
- Nếu run đã hoàn tất, SSE có thể trả final event rồi close.

### 12.4 SSE events

```text
RUN_QUEUED
RUN_STARTED
CASE_STARTED
CASE_COMPLETED
CASE_FAILED
RUN_PROGRESS
RUN_COMPLETED
RUN_FAILED
RUN_CANCELLED
```

### 12.5 Models

```text
TestResult
  - id
  - runId
  - caseId
  - input
  - actualOutput
  - passed
  - score
  - errorMessage
  - latencyMs
  - rawTargetResponse
  - createdAt
```

```text
AssertionResult
  - id
  - testResultId
  - assertionName
  - assertionType
  - fieldName
  - responsePath
  - passed
  - score
  - reason
  - expectedValue
  - actualValue
  - createdAt
```

```text
RunEvent
  - id
  - runId
  - eventType
  - payload
  - createdAt
```

```text
ManualReview
  - id
  - testResultId
  - reviewerId
  - actualPassed
  - note
  - bugRef
  - createdAt
  - updatedAt
```

### 12.6 API đề xuất

```http
GET  /api/runs/{runId}
GET  /api/runs/{runId}/events
GET  /api/runs/{runId}/results
GET  /api/runs/{runId}/results/{caseId}
POST /api/runs/{runId}/cancel
POST /api/runs/{runId}/rerun
GET  /api/runs/{runId}/export
POST /api/test-results/{testResultId}/review
PATCH /api/test-results/{testResultId}/review
```

### 12.7 Acceptance criteria

- Run đang chạy có realtime events.
- Refresh page vẫn xem được progress/result từ DB.
- Filter/sort/search result hoạt động.
- Manual review không sửa raw evaluation result.
- Cancel run dừng được ở mức hợp lý.

---

# VI. Redis Queue & Node Runner

## 13. Spring Boot Queue Integration

### 13.1 Backend tasks

- Tạo interface `EvalJobPublisher`.
- Tạo implementation `RedisEvalJobPublisher`.
- Publish message vào Redis Stream khi tạo run.
- Không publish secret/raw dataset vào Redis.
- Tạo internal API cho Node Runner:
  - Get EvalRunRequest.
  - Report run started.
  - Report case started/completed/failed.
  - Report run completed/failed/cancelled.
  - Check cancel status.
- Lưu result/progress vào DB.
- Bắn SSE cho client.

### 13.2 API internal đề xuất

```http
GET  /internal/runs/{runId}/eval-request
POST /internal/runs/{runId}/events
POST /internal/runs/{runId}/case-results
POST /internal/runs/{runId}/complete
POST /internal/runs/{runId}/fail
POST /internal/runs/{runId}/cancelled
GET  /internal/runs/{runId}/cancel-status
```

### 13.3 Interface gợi ý

```java
public interface EvalJobPublisher {
    void publishRunRequested(EvalRunJobMessage message);
}
```

---

## 14. Node Promptfoo Runner

### 14.1 Node Runner tasks

- Setup Redis consumer group.
- Consume stream `eval.run.requested`.
- Implement `RedisRunConsumer`.
- Implement `RunJobHandler`.
- Implement `EvalRequestClient`.
- Implement `ProgressReporter`.
- Implement `CancelSignalChecker`.
- Implement `RequestValidator`.
- Implement `PromptfooSuiteBuilder`.
- Implement `VerificationMapper`.
- Implement `TargetProviderAdapter`.
- Implement `JudgeProviderAdapter`.
- Implement `PromptfooExecutor`.
- Implement `ResultMapper`.
- Implement `ArtifactWriter`.
- Ack message sau khi xử lý xong hoặc đưa vào retry/DLQ strategy.

### 14.2 Node Runner flow

```text
RedisRunConsumer
  -> RunJobHandler
      -> EvalRequestClient.getEvalRequest(runId)
      -> ProgressReporter.reportStarted(runId)
      -> PromptfooSuiteBuilder.build(request)
      -> PromptfooExecutor.execute(suite)
          -> TargetProviderAdapter
          -> JudgeProviderAdapter
      -> ResultMapper.map(rawResult)
      -> ProgressReporter.reportCaseResults(...)
      -> ProgressReporter.reportCompleted(...)
```

### 14.3 Cancel flow

MVP đơn giản:

```text
Node Runner trước mỗi case gọi:
GET /internal/runs/{runId}/cancel-status

Nếu true:
  - dừng chạy case tiếp theo
  - report cancelled về Spring Boot
  - ack queue message
```

### 14.4 Acceptance criteria

- Node Runner consume được job từ Redis.
- Node Runner không cần client gọi.
- Node Runner lấy eval request từ Spring Boot.
- Node Runner report progress/result về Spring Boot.
- Queue message không chứa secret.
- Cancel hoạt động tối thiểu giữa các case.

---

# VII. Phân công theo phase

## 15. Phase 0 - Contract & Foundation

### Client

- Setup API client.
- Setup i18n.
- Setup error mapper.
- Setup layout/project shell.
- Define shared TypeScript enums.

### Backend

- Setup ApiErrorResponse.
- Setup validation handler.
- Setup base project.
- Setup PostgreSQL.
- Setup Redis connection.
- Setup shared enums.

### Node Runner

- Setup Node project.
- Setup Redis connection.
- Setup health check.
- Setup internal API client skeleton.

---

## 16. Phase 1 - Project + Config

### Client

- Project list/switch.
- API Config screen.
- LLM Judge screen.
- Dataset Column screen.
- Verification screen basic.

### Backend

- Project APIs.
- Target config APIs.
- Judge config APIs.
- Dataset schema APIs.
- Verification config APIs.
- Secret encryption.
- Config versioning.

### Node Runner

- Chưa bắt buộc chạy thật.
- Có thể chuẩn bị DTO `EvalRunRequest`.

---

## 17. Phase 2 - Dataset

### Client

- Dataset list.
- Dataset detail table.
- Import/export UI.
- Dataset validation UI.
- Case CRUD UI.

### Backend

- Dataset APIs.
- Dataset versioning.
- CSV/Excel import.
- CSV/Excel export.
- Dataset validation.
- Dataset case CRUD.

### Node Runner

- Chưa bắt buộc chạy thật.

---

## 18. Phase 3 - Test Run với Fake Runner

### Client

- Test run list.
- Test run detail.
- SSE client.
- Result table basic.
- Filter/sort/search basic.

### Backend

- TestRun APIs.
- Result APIs.
- SSE.
- Redis publish.
- Fake runner hoặc fake internal result flow.
- Snapshot config/dataset/verification.

### Node Runner

- Có thể mock consume job và trả fake result.

---

## 19. Phase 4 - Promptfoo Runner thật

### Client

- Hoàn thiện realtime progress.
- Hoàn thiện result charts.
- Hiển thị artifact/report links.

### Backend

- Internal APIs cho Node Runner.
- Result persistence hoàn chỉnh.
- Artifact metadata.
- Cancel/rerun/export.

### Node Runner

- Consume Redis job thật.
- Build Promptfoo suite.
- Map verification.
- Execute Promptfoo.
- Report result.
- Artifact writer.

---

## 20. Phase 5 - Review & Report

### Client

- Manual review UI.
- Override pass/fail.
- Bug note.
- Export report UI.
- Advanced charts.

### Backend

- ManualReview APIs.
- Report export.
- Review audit.
- Advanced query result.

### Node Runner

- Không cần thay đổi nhiều, trừ khi thêm artifact/report format.

---

# VIII. Checklist phân công nhanh

## 21. Client checklist

- [ ] Project List/Switch.
- [ ] API Config screen.
- [ ] LLM Judge screen.
- [ ] Dataset Column screen.
- [ ] Verification screen.
- [ ] Dataset List screen.
- [ ] Dataset Detail screen.
- [ ] Test Run List screen.
- [ ] Test Run Detail screen.
- [ ] SSE client.
- [ ] API error mapper.
- [ ] i18n validation messages.
- [ ] Manual review UI.
- [ ] Export report UI.

## 22. Backend checklist

- [ ] Shared error/validation handler.
- [ ] Project module.
- [ ] Target Config module.
- [ ] Judge Config module.
- [ ] Dataset Schema module.
- [ ] Verification module.
- [ ] Dataset module.
- [ ] TestRun module.
- [ ] Result module.
- [ ] Review module.
- [ ] Secret encryption.
- [ ] Version/snapshot system.
- [ ] RedisEvalJobPublisher.
- [ ] Internal Runner APIs.
- [ ] SSE.
- [ ] Export report.
- [ ] Cancel/rerun.

## 23. Node Runner checklist

- [ ] RedisRunConsumer.
- [ ] RunJobHandler.
- [ ] EvalRequestClient.
- [ ] ProgressReporter.
- [ ] CancelSignalChecker.
- [ ] RequestValidator.
- [ ] PromptfooSuiteBuilder.
- [ ] VerificationMapper.
- [ ] TargetProviderAdapter.
- [ ] JudgeProviderAdapter.
- [ ] PromptfooExecutor.
- [ ] ResultMapper.
- [ ] ArtifactWriter.
- [ ] Retry/DLQ strategy.

---

# IX. Definition of Done chung

Một màn được coi là xong khi:

```text
1. Client UI có loading/error/empty/success state.
2. Client gọi API thật hoặc mock contract đã thống nhất.
3. Backend có request/response DTO rõ.
4. Backend validation dùng messageCode.
5. API lỗi trả ApiErrorResponse.
6. Có phân trang nếu list có thể lớn.
7. Có test tối thiểu cho service/controller quan trọng.
8. Không lộ secret raw ra client/log.
9. Không phá version/snapshot rule.
10. Có acceptance criteria được demo.
```

---

# X. Những việc không nên làm

```text
- Không để React gọi Node Runner trực tiếp.
- Không để Redis là source of truth.
- Không nhét full dataset/secret vào Redis message.
- Không lưu raw secret plain text.
- Không dùng encode thay cho encrypt.
- Không để Spring Boot domain phụ thuộc Promptfoo schema.
- Không sửa raw evaluation result khi QC review.
- Không hard-code tiếng Việt trong backend validation annotation.
- Không định nghĩa Hybrid là nhiều field hơn Field Checks.
- Không để TestRun thiếu snapshot config/dataset/verification.
```

---

# XI. Tóm tắt phân công chính

```text
Client:
  - Làm UI theo màn
  - Gọi Spring Boot API
  - Handle form/error/i18n
  - Render SSE/realtime/result/review

Backend Spring Boot:
  - Là source of truth
  - Quản lý project/config/dataset/run/result/review
  - Validate/encrypt/version/snapshot
  - Publish Redis job
  - Nhận progress/result từ Node Runner
  - Bắn SSE cho client

Node Promptfoo Runner:
  - Consume Redis job
  - Lấy EvalRunRequest từ Spring Boot
  - Build và chạy Promptfoo
  - Gọi target/judge
  - Map result
  - Report progress/result về Spring Boot
```
