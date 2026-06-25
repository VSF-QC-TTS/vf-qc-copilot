# API Config Context

File này là context ngắn cho client/AI coding agent về 4 module Config (Target, Judge, Dataset Schema, Verification). Code backend vẫn là source of truth; nếu cần contract chi tiết hơn, đọc file Java tương ứng.

## Backend Status

Config modules đã có đầy đủ flow:

- Cấu hình Target API (paste cURL → parse → execute → lưu config)
- Cấu hình LLM Judge (5 providers: OpenAI, Gemini, Anthropic, Azure OpenAI, Custom)
- Cấu hình Dataset Schema (immutable versioned, add/update/delete columns)
- Cấu hình Verification (field checks + LLM rubrics, 12 operators, drag-drop mapping)

Backend dùng Spring Boot API. Tất cả endpoint đều yêu cầu authentication.

## Authentication

Tất cả request phải có `Authorization: Bearer <token>`.
Client rule: nếu nhận lỗi 401, refresh token và thử lại. Nếu thất bại, route user về login.

## Error Model

Backend errors dùng RFC 9457 Problem Details. Giống với auth module.

Client rules:

- Dùng top-level `code` cho global/page state.
- Dùng `fieldErrors[].field` để map lỗi vào form field.
- Dùng `fieldErrors[].messageCode` cho i18n key.
- Validation messages dùng key prefix `validation.` — map sang `validation.json` trên client.

---

## 1. Target Config

Base path: `/api/v1/projects/{publicId}/config/target`

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Execute cURL | `POST` | `/execute-curl` | `200 ExecuteCurlResponse` |
| Save config | `PUT` | `/` | `200 TargetConfigResponse` |
| Get config | `GET` | `/` | `200 TargetConfigResponse` |
| Test config | `POST` | `/test` | `200 TestExecutionResult` |
| Get response fields | `GET` | `/response-fields` | `200 string[]` |

### Data Types

```ts
// --- Requests ---

type ExecuteCurlRequest = {
  curl: string; // @NotBlank(message = "invalid-curl"). Raw cURL string (multi-line OK, shell quoting OK)
};

type SaveTargetConfigRequest = {
  method: string;       // @NotBlank(message = "validation.not-blank")
  url: string;          // @NotBlank(message = "validation.not-blank")
  headers: Record<string, string> | null;
  queryParams: Record<string, string> | null;
  bodyTemplate: string | null;  // Request body template, can contain {{placeholders}}
  responsePath: string | null;  // JSONPath to the main response data array/object
  timeoutMs: number;    // @NotNull @Min(1000, message = "validation.min")
  name: string | null;
};

type TestTargetConfigRequest = {
  sampleInput: Record<string, string> | null; // Key-value pairs to substitute {{placeholders}} in bodyTemplate or URL
};

// --- Responses ---

type ExecuteCurlResponse = {
  parsedConfig: SaveTargetConfigRequest;     // Parsed cURL → config format (secrets replaced with SECRET_REDACTED)
  secretsDetected: SecretDetection[];        // Detected sensitive values
  testResult: TestExecutionResult;           // Actual HTTP response from target
};

type SecretDetection = {
  location: string;   // "HEADER" | "QUERY_PARAM"
  keyName: string;    // Key name (e.g. "Authorization")
  action: string;     // "REDACTED"
};

type TestExecutionResult = {
  httpStatus: number;
  latencyMs: number;
  responseBody: string | null;
  errorMessage: string | null;
  responseFieldTree: Record<string, any> | null; // Raw JSON tree of response
};

type TargetConfigResponse = {
  publicId: string;        // UUID
  version: number;
  name: string | null;
  method: string;
  url: string;
  maskedHeaders: Record<string, string>;      // Secrets replaced with SECRET_REDACTED
  maskedQueryParams: Record<string, string>;  // Secrets replaced with SECRET_REDACTED
  bodyTemplate: string | null;
  responsePath: string | null;
  timeoutMs: number;
  requestFieldSnapshot: string | null;   // JSON string of request body structure
  responseFieldSnapshot: string | null;  // JSON string of response body structure
  lastTestStatus: string | null;         // "SUCCESS" | "FAILED"
  lastTestedAt: string | null;           // ISO-8601
  createdAt: string;                     // ISO-8601
  updatedAt: string;                     // ISO-8601
};

// GET /response-fields trả về:
// string[] — VD: ["$.status", "$.data.vin", "$.data.engine.power"]
// Frontend dùng cho dropdown/drag-drop field mapping ở verification config.
```

### Error Codes (Target)

| Code | HTTP | Validation message | Client behavior |
| --- | --- | --- | --- |
| `INVALID_CURL` | 400 | `invalid-curl` | Show parse error trong textarea cURL |
| `TARGET_CONFIG_NOT_FOUND` | 404 | — | Show empty state "Chưa cấu hình Target API" |
| `TARGET_TEST_FAILED` | 502 | — | Show error message với HTTP status code |
| `VALIDATION_ERROR` | 400 | `validation.not-blank`, `validation.min` | Map `fieldErrors` vào form fields |

### Flow

1. User pastes cURL vào textarea → client calls `POST /execute-curl`
2. Backend: parse cURL (POSIX tokenizer) → detect secrets → execute HTTP → return response
3. Frontend shows: response JSON tree + detected secrets (masked)
4. User confirms → client calls `PUT /` (save)
5. User re-test later: `POST /test` (with `sampleInput` for `{{placeholder}}` variables)
6. Frontend cần response fields cho verification: `GET /response-fields`

---

## 2. Judge Config

Base path: `/api/v1/projects/{publicId}/config/judge`

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Save config | `PUT` | `/` | `200 JudgeConfigResponse` |
| Get config | `GET` | `/` | `200 JudgeConfigResponse` |
| Test connection | `POST` | `/test` | `200 JudgeExecutionResult` |

### Data Types

```ts
type LlmProvider = "OPENAI" | "AZURE_OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";

// --- Requests ---

type SaveJudgeConfigRequest = {
  provider: LlmProvider;          // @NotNull(message = "validation.not-null")
  baseUrl: string | null;         // Required for AZURE_OPENAI and CUSTOM
  apiKey: string | null;          // Send "SECRET_REDACTED" to keep existing key
  model: string;                  // @NotBlank(message = "validation.not-blank")
  customModelName: string | null; // For AZURE_OPENAI deployment name or CUSTOM model name
  temperature: number | null;     // @Min(0) @Max(2). BigDecimal in backend.
  maxTokens: number | null;       // @Min(1)
  timeoutMs: number;              // @NotNull @Min(1000, message = "validation.min")
  retryCount: number;             // @NotNull @Min(0, message = "validation.min")
};

type TestJudgeConfigRequest = {
  systemPrompt: string;  // @NotBlank(message = "validation.not-blank")
  userMessage: string;   // @NotBlank(message = "validation.not-blank")
};

// --- Responses ---

type JudgeConfigResponse = {
  publicId: string;              // UUID
  version: number;
  provider: LlmProvider;
  baseUrl: string | null;
  hasApiKey: boolean;            // true if encrypted key exists (never exposes actual key)
  model: string | null;
  customModelName: string | null;
  temperature: number | null;    // BigDecimal
  maxTokens: number | null;
  timeoutMs: number | null;
  retryCount: number | null;
  lastTestStatus: string | null; // "SUCCESS" | "FAILED"
  lastTestedAt: string | null;   // ISO-8601
  createdAt: string;             // ISO-8601
  updatedAt: string;             // ISO-8601
};

type JudgeExecutionResult = {
  generatedText: string | null;  // LLM response text
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  errorMessage: string | null;
  successful: boolean;
};
```

### Provider Notes

| Provider | Auth | Base URL | Notes |
| --- | --- | --- | --- |
| `OPENAI` | `Authorization: Bearer {key}` | Default | — |
| `GEMINI` | `?key={key}` (query param) | Default | JSON format khác (system_instruction, contents) |
| `ANTHROPIC` | `x-api-key: {key}` | Default | anthropic-version header required |
| `AZURE_OPENAI` | `api-key: {key}` | **Required** `https://{resource}.openai.azure.com` | `customModelName` = deployment name |
| `CUSTOM` | `Bearer {key}` (optional) | **Required** | OpenAI-compatible format (vLLM, Ollama, LM Studio...) |

### Error Codes (Judge)

| Code | HTTP | Client behavior |
| --- | --- | --- |
| `JUDGE_CONFIG_NOT_FOUND` | 404 | Show empty state "Chưa cấu hình LLM Judge" |
| `JUDGE_CONNECTION_FAILED` | 502 | Show connection error với message chi tiết |
| `UNSUPPORTED_LLM_PROVIDER` | 400 | — (shouldn't happen, all 5 providers implemented) |

---

## 3. Dataset Schema

Base path: `/api/v1/projects/{publicId}/dataset-schema`

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Get latest | `GET` | `/` | `200 DatasetSchemaResponse` |
| Add column | `POST` | `/columns` | `200 DatasetSchemaResponse` |
| Update column | `PATCH` | `/columns/{columnPublicId}` | `200 DatasetSchemaResponse` |
| Delete column | `DELETE` | `/columns/{columnPublicId}` | `200 DatasetSchemaResponse` |

### Data Types

```ts
type ColumnDataType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
type ColumnRole = "INPUT" | "EXPECTED_OUTPUT" | "CONTEXT" | "METADATA";

// --- Requests ---

type CreateColumnRequest = {
  columnName: string;          // @NotBlank(message = "validation.not-blank")
  displayName: string | null;
  dataType: ColumnDataType;    // @NotNull(message = "validation.not-null")
  role: ColumnRole;            // @NotNull(message = "validation.not-null")
  required: boolean;
  sampleValue: string | null;
  description: string | null;  // Prompt context for this column
};

type UpdateColumnRequest = {
  displayName: string | null;
  dataType: ColumnDataType;    // @NotNull(message = "validation.not-null")
  role: ColumnRole;            // @NotNull(message = "validation.not-null")
  required: boolean;
  sampleValue: string | null;
  description: string | null;
  displayOrder: number;        // @NotNull(message = "validation.not-null")
};

// --- Responses ---

type DatasetSchemaResponse = {
  publicId: string;           // UUID
  version: number;
  createdAt: string;          // ISO-8601
  columns: DatasetColumnResponse[];
};

type DatasetColumnResponse = {
  publicId: string;           // UUID
  columnName: string;
  displayName: string | null;
  dataType: ColumnDataType;
  role: ColumnRole;
  required: boolean;
  sampleValue: string | null;
  description: string | null;
  displayOrder: number;
  createdAt: string;          // ISO-8601
  updatedAt: string;          // ISO-8601
};
```

### Notes

- Schema là **immutable versioned**: mỗi thay đổi (add/update/delete column) tạo version mới.
- `GET` luôn trả về version mới nhất.
- `columnName` dùng cho mapping với `FieldCheck.expectedColumn`.

### Error Codes (Dataset Schema)

| Code | HTTP | Client behavior |
| --- | --- | --- |
| `DATASET_SCHEMA_NOT_FOUND` | 404 | Show empty state "Chưa có schema" |
| `DUPLICATE_COLUMN_NAME` | 409 | Show field error trên `columnName` |
| `COLUMN_NOT_FOUND` | 404 | Show toast "Cột không tồn tại" |

---

## 4. Verification Config

Base path: `/api/v1/projects/{publicId}/config/verification`
Operators endpoint: `/api/v1/verification/operators` (global, không cần project ID)

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Get config | `GET` | `/` | `200 VerificationConfigResponse` |
| Save config | `PUT` | `/` | `200 VerificationConfigResponse` |
| List operators | `GET` | `/api/v1/verification/operators` | `200 OperatorCatalogResponse[]` |

### Data Types

```ts
type VerificationMode = "FIELD_CHECKS" | "OVERALL_RUBRIC" | "RULE_AND_LLM";
type ExpectedSource = "LITERAL" | "DATASET_COLUMN";

type CheckOperator =
  | "EQUALS"          // Exact match
  | "CONTAINS"        // Substring match
  | "ICONTAINS"       // Case-insensitive substring match
  | "NOT_CONTAINS"    // Must NOT contain substring
  | "CONTAINS_ALL"    // Must contain ALL values (comma-separated in expectedValue)
  | "CONTAINS_ANY"    // Must contain at least one (comma-separated in expectedValue)
  | "STARTS_WITH"     // Starts with string
  | "REGEX"           // Regular expression match (expectedValue = regex pattern, LITERAL only)
  | "NOT_EMPTY"       // Field present and not empty (no expected value needed)
  | "IS_JSON"         // Valid JSON (no expected value needed)
  | "JAVASCRIPT"      // Custom JS expression (expectedValue = JS code, must return true/false, LITERAL only)
  | "LLM_JUDGE";      // Uses AI judge with rubric (expectedValue = rubric prompt, LITERAL only)

// --- Requests ---

type SaveVerificationRequest = {
  mode: VerificationMode;              // @NotNull(message = "validation.not-null")
  fieldChecks: FieldCheckRequest[] | null;   // @Valid
  llmRubrics: LlmRubricRequest[] | null;     // @Valid
};

type FieldCheckRequest = {
  publicId: string | null;             // null = new, UUID = update existing
  responsePath: string;                // @NotBlank(message = "validation.not-blank"). JSON path from target response (e.g. "$.data.vin")
  operator: CheckOperator;            // @NotNull(message = "validation.not-null")
  expectedSource: ExpectedSource;     // @NotNull(message = "validation.not-null")
  expectedColumn: string | null;      // Dataset column name (required when source = DATASET_COLUMN)
  expectedValue: string | null;       // Literal value (required when source = LITERAL), or JS code / regex / rubric prompt
  threshold: number | null;           // @DecimalMin("0.0") @DecimalMax("1.0"). Score threshold for LLM_JUDGE
  weight: number;                     // @NotNull @DecimalMin("0.0"). Default 1.0
  enabled: boolean;
  displayOrder: number;               // @NotNull(message = "validation.not-null")
};

type LlmRubricRequest = {
  publicId: string | null;            // null = new, UUID = update existing
  name: string;                       // @NotBlank(message = "validation.not-blank"). Rubric criteria name
  targetPath: string | null;          // Optional JSON path to extract specific response part for evaluation
  rubric: string;                     // @NotBlank(message = "validation.not-blank"). The prompt/rubric for LLM judge
  threshold: number;                  // @NotNull @DecimalMin("0.0") @DecimalMax("1.0"). Score required to pass
  weight: number;                     // @NotNull @DecimalMin("0.0"). Weight in overall score
  enabled: boolean;
  displayOrder: number;               // @NotNull(message = "validation.not-null")
};

// --- Responses ---

type VerificationConfigResponse = {
  publicId: string;                   // UUID
  version: number;
  mode: VerificationMode;
  fieldChecks: FieldCheckResponse[];
  llmRubrics: LlmRubricResponse[];
  createdAt: string;                  // ISO-8601
  updatedAt: string;                  // ISO-8601
};

type FieldCheckResponse = {
  publicId: string;                   // UUID
  responsePath: string;
  operator: CheckOperator;
  expectedSource: ExpectedSource;
  expectedColumn: string | null;
  expectedValue: string | null;
  threshold: number | null;           // BigDecimal
  weight: number;                     // BigDecimal
  enabled: boolean;
  displayOrder: number;
};

type LlmRubricResponse = {
  publicId: string;                   // UUID
  name: string;
  targetPath: string | null;
  rubric: string;
  threshold: number;                  // BigDecimal
  weight: number;                     // BigDecimal
  enabled: boolean;
  displayOrder: number;
};

type OperatorCatalogResponse = {
  operator: CheckOperator;
  displayName: string;
  description: string;
};
```

### Preconditions (enforced by backend)

- **Must have Target Config** trước khi save verification (cần response fields)
- **Must have Dataset Schema** trước khi save verification (cần column names)
- **Must have Judge Config** nếu mode = `OVERALL_RUBRIC` | `RULE_AND_LLM` hoặc bất kỳ field nào dùng `LLM_JUDGE`

### Frontend Drag-and-Drop Flow

1. Call `GET .../config/target/response-fields` → get `string[]` of JSON paths
2. Call `GET .../dataset-schema` → get `DatasetSchemaResponse` with column names
3. Render hai panel: **Response Fields** (trái) và **Dataset Columns** (phải)
4. User kéo response field (e.g. `$.data.vin`) → thả vào dataset column (e.g. `expected_vin`)
5. Tạo `FieldCheckRequest`:
   - `responsePath` = `"$.data.vin"`
   - `expectedSource` = `"DATASET_COLUMN"`
   - `expectedColumn` = `"expected_vin"`
   - `operator` = `"EQUALS"` (default, user có thể thay đổi)
6. User cũng có thể thêm LITERAL checks hoặc JAVASCRIPT/LLM_JUDGE
7. Save tất cả cùng lúc: `PUT .../config/verification`

### Error Codes (Verification)

| Code | HTTP | Client behavior |
| --- | --- | --- |
| `VERIFICATION_CONFIG_NOT_FOUND` | 404 | Show empty state |
| `MISSING_TARGET_CONFIG` | 422 | Block save, prompt "Cấu hình Target API trước" |
| `MISSING_DATASET_SCHEMA` | 422 | Block save, prompt "Định nghĩa Dataset Schema trước" |
| `MISSING_JUDGE_CONFIG` | 422 | Block save, prompt "Cấu hình LLM Judge trước" |
| `BAD_REQUEST` | 400 | Show validation error (e.g. invalid regex pattern, missing expectedValue) |

---

## Backend Files Worth Reading

Read these only if implementation behavior is unclear:

- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/TargetConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/JudgeConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/DatasetSchemaController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/VerificationConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/model/verificationconfig/CheckOperator.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/shared/error/ErrorCode.java`
