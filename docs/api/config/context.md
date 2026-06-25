# API Config Context

File này là context ngắn cho client/AI coding agent về 4 module Config (Target, Judge, Dataset Schema, Verification). Backend code là source of truth.

## Overview

User phải config 4 thứ trước khi chạy test:

1. **Target Config** — Chatbot API cần test (paste cURL → gọi thử → lấy response JSON tree)
2. **Dataset Schema** — Định nghĩa các cột của bảng test data (input, expected_output...)
3. **Judge Config** — Cấu hình AI chấm điểm (OpenAI, Gemini, Anthropic, Azure, Custom)
4. **Verification Config** — Mapping response fields ↔ dataset columns + check rules

Base path: `/api/v1/projects/{publicId}/config/...`
Tất cả endpoint đều yêu cầu authentication.

---

## 1. Target Config

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Execute cURL | `POST` | `.../config/target/execute-curl` | `200 ExecuteCurlResponse` |
| Save config | `PUT` | `.../config/target` | `200 TargetConfigResponse` |
| Get config | `GET` | `.../config/target` | `200 TargetConfigResponse` |
| Test config | `POST` | `.../config/target/test` | `200 TestExecutionResult` |
| Get response fields | `GET` | `.../config/target/response-fields` | `200 string[]` |

### Data Types

```ts
type ExecuteCurlRequest = {
  curl: string; // Raw cURL string (multi-line OK, shell quoting OK)
};

type ExecuteCurlResponse = {
  config: SaveTargetConfigRequest; // Parsed config (secrets replaced with SECRET_REDACTED)
  secretDetections: SecretDetection[]; // Detected sensitive values
  executionResult: TestExecutionResult; // Actual HTTP response from target
};

type SecretDetection = {
  location: string; // "HEADER" | "QUERY_PARAM"
  name: string; // Key name (e.g. "Authorization")
  maskedValue: string; // Always "REDACTED"
};

type SaveTargetConfigRequest = {
  method: string;
  url: string;
  headers: Record<string, string> | null;
  queryParams: Record<string, string> | null;
  bodyTemplate: string | null; // JSON with {{placeholder}} for dataset variables
  responsePath: string | null;
  timeoutMs: number;
  name: string | null;
};

type TestTargetConfigRequest = {
  sampleInput: Record<string, string>; // Substituted into bodyTemplate {{placeholders}}
};

type TestExecutionResult = {
  httpStatus: number;
  latencyMs: number;
  responseBody: string | null;
  errorMessage: string | null;
  responseFieldTree: Record<string, any> | null; // Raw JSON tree of response
};

type TargetConfigResponse = {
  publicId: string;
  version: number;
  name: string | null;
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  bodyTemplate: string | null;
  responsePath: string | null;
  timeoutMs: number;
  requestFieldSnapshot: string | null;
  responseFieldSnapshot: string | null;
  lastTestStatus: string | null; // "SUCCESS" | "FAILED"
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// GET .../config/target/response-fields
// Returns: string[]
// Example: ["$.status", "$.data.vin", "$.data.engine.power", "$.data.battery.capacity"]
// Frontend uses this for drag-and-drop field mapping in verification config.
```

### Flow

1. User pastes cURL vào textarea → client calls `POST execute-curl`
2. Backend: parse cURL (tokenizer) → detect secrets → execute HTTP → return response
3. Frontend shows: response JSON tree + detected secrets (masked)
4. User confirms → client calls `PUT save`
5. User can re-test later with `POST test` (with sampleInput for `{{placeholder}}` variables)
6. Frontend cần hiển thị dropdown response fields → call `GET response-fields`

---

## 2. Judge Config

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Save config | `PUT` | `.../config/judge` | `200 JudgeConfigResponse` |
| Get config | `GET` | `.../config/judge` | `200 JudgeConfigResponse` |
| Test connection | `POST` | `.../config/judge/test` | `200 JudgeExecutionResult` |

### Data Types

```ts
type LlmProvider = "OPENAI" | "AZURE_OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";

type SaveJudgeConfigRequest = {
  provider: LlmProvider;
  baseUrl: string | null; // Required for AZURE_OPENAI and CUSTOM
  apiKey: string | null; // Send "SECRET_REDACTED" to keep existing key
  model: string | null;
  customModelName: string | null; // For CUSTOM and AZURE_OPENAI deployment name
  temperature: number | null; // 0.0 - 2.0
  maxTokens: number | null;
  timeoutMs: number | null;
  retryCount: number | null;
};

type TestJudgeConfigRequest = {
  systemPrompt: string;
  userMessage: string;
};

type JudgeConfigResponse = {
  publicId: string;
  version: number;
  provider: LlmProvider;
  baseUrl: string | null;
  hasApiKey: boolean; // true if encrypted key exists (never exposes actual key)
  model: string | null;
  customModelName: string | null;
  temperature: number | null;
  maxTokens: number | null;
  timeoutMs: number | null;
  retryCount: number | null;
  lastTestStatus: string | null;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type JudgeExecutionResult = {
  content: string | null; // LLM response text
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  errorMessage: string | null;
  successful: boolean;
};
```

### Provider Notes

| Provider | Auth | Base URL |
| --- | --- | --- |
| `OPENAI` | `Authorization: Bearer {key}` | Default: `api.openai.com/v1/chat/completions` |
| `GEMINI` | `?key={key}` (query param) | Default: `generativelanguage.googleapis.com/v1beta` |
| `ANTHROPIC` | `x-api-key: {key}` | Default: `api.anthropic.com/v1/messages` |
| `AZURE_OPENAI` | `api-key: {key}` | **Required**: `https://{resource}.openai.azure.com` |
| `CUSTOM` | `Bearer {key}` (optional) | **Required**: Any OpenAI-compatible URL (vLLM, Ollama...) |

---

## 3. Dataset Schema

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Get latest | `GET` | `.../dataset-schema` | `200 DatasetSchemaResponse` |
| Add column | `POST` | `.../dataset-schema/columns` | `200 DatasetSchemaResponse` |
| Update column | `PATCH` | `.../dataset-schema/columns/{columnPublicId}` | `200 DatasetSchemaResponse` |
| Delete column | `DELETE` | `.../dataset-schema/columns/{columnPublicId}` | `200 DatasetSchemaResponse` |

### Data Types

```ts
type ColumnDataType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
type ColumnRole = "INPUT" | "EXPECTED_OUTPUT" | "CONTEXT" | "METADATA";

type CreateColumnRequest = {
  columnName: string;
  displayName: string | null;
  dataType: ColumnDataType;
  role: ColumnRole;
  required: boolean;
  sampleValue: string | null;
  description: string | null;
};

type UpdateColumnRequest = {
  displayName: string | null;
  dataType: ColumnDataType | null;
  role: ColumnRole | null;
  required: boolean | null;
  sampleValue: string | null;
  description: string | null;
};

type DatasetSchemaResponse = {
  publicId: string;
  version: number;
  columns: DatasetColumnResponse[];
  createdAt: string;
};

type DatasetColumnResponse = {
  publicId: string;
  columnName: string;
  displayName: string | null;
  dataType: ColumnDataType;
  role: ColumnRole;
  required: boolean;
  sampleValue: string | null;
  description: string | null;
  displayOrder: number;
};
```

### Notes

- Schema là **immutable versioned**: mỗi thay đổi (add/update/delete column) tạo version mới.
- `GET` luôn trả về version mới nhất.

---

## 4. Verification Config

### Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Get config | `GET` | `.../config/verification` | `200 VerificationConfigResponse` |
| Save config | `PUT` | `.../config/verification` | `200 VerificationConfigResponse` |
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
  | "CONTAINS_ALL"    // Must contain ALL values (comma-separated)
  | "CONTAINS_ANY"    // Must contain at least one (comma-separated)
  | "STARTS_WITH"     // Starts with string
  | "REGEX"           // Regular expression match
  | "NOT_EMPTY"       // Field present and not empty (no expected value needed)
  | "IS_JSON"         // Valid JSON (no expected value needed)
  | "JAVASCRIPT"      // Custom JS expression (expectedValue = JS code returning true/false)
  | "LLM_JUDGE";      // Uses AI judge with rubric (expectedValue = rubric prompt)

type SaveVerificationRequest = {
  mode: VerificationMode;
  fieldChecks: FieldCheckRequest[] | null;
  llmRubrics: LlmRubricRequest[] | null;
};

type FieldCheckRequest = {
  publicId: string | null; // null = new, UUID = update existing
  responsePath: string; // JSON path from target response (e.g. "$.data.vin")
  operator: CheckOperator;
  expectedSource: ExpectedSource;
  expectedColumn: string | null; // Dataset column name (when source = DATASET_COLUMN)
  expectedValue: string | null; // Literal value (when source = LITERAL) or JS code / rubric
  threshold: number | null; // Score threshold for LLM_JUDGE (0.0 - 1.0)
  weight: number; // Default 1.0
  enabled: boolean;
  displayOrder: number;
};

type LlmRubricRequest = {
  publicId: string | null;
  rubricPrompt: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
};

type VerificationConfigResponse = {
  publicId: string;
  version: number;
  mode: VerificationMode;
  fieldChecks: FieldCheckResponse[];
  llmRubrics: LlmRubricResponse[];
  createdAt: string;
  updatedAt: string;
};

type OperatorCatalogResponse = {
  operator: CheckOperator;
  displayName: string;
  description: string;
};
```

### Preconditions (enforced by backend)

- **Must have Target Config** before saving verification (need response fields)
- **Must have Dataset Schema** before saving verification (need column names)
- **Must have Judge Config** if mode = `OVERALL_RUBRIC` | `RULE_AND_LLM` or any field uses `LLM_JUDGE`

### Frontend Drag-and-Drop Flow

1. Call `GET .../config/target/response-fields` → get `string[]` of JSON paths
2. Call `GET .../dataset-schema` → get `DatasetColumnResponse[]` with column names
3. Render two panels: **Response Fields** (left) and **Dataset Columns** (right)
4. User drags a response field (e.g. `$.data.vin`) → drops on a dataset column (e.g. `expected_vin`)
5. This creates a `FieldCheckRequest` with:
   - `responsePath` = `"$.data.vin"`
   - `expectedSource` = `"DATASET_COLUMN"`
   - `expectedColumn` = `"expected_vin"`
   - `operator` = `"EQUALS"` (default, user can change)
6. User can also add LITERAL checks (expected value hardcoded) or JAVASCRIPT/LLM_JUDGE checks
7. Save all with `PUT .../config/verification`

---

## Important Error Codes

| Code | When | Client Behavior |
| --- | --- | --- |
| `TARGET_CONFIG_NOT_FOUND` | GET/test target without config | Show "Configure target first" |
| `JUDGE_CONFIG_NOT_FOUND` | GET/test judge without config | Show "Configure judge first" |
| `DATASET_SCHEMA_NOT_FOUND` | GET schema without any version | Show "Define schema first" |
| `VERIFICATION_CONFIG_NOT_FOUND` | GET verification without config | Show empty state |
| `INVALID_CURL` | Bad cURL string | Show parse error in textarea |
| `MISSING_TARGET_CONFIG` | Save verification without target | Block and prompt to configure target |
| `MISSING_DATASET_SCHEMA` | Save verification without schema | Block and prompt to define schema |
| `MISSING_JUDGE_CONFIG` | Save verification needing LLM without judge | Block and prompt to configure judge |
| `TARGET_TEST_FAILED` | Target HTTP returned non-2xx | Show error with HTTP status |
| `JUDGE_CONNECTION_FAILED` | LLM call failed | Show connection error |
| `UNSUPPORTED_LLM_PROVIDER` | Provider enum value without implementation | Should not happen (all 5 implemented) |
| `DUPLICATE_COLUMN_NAME` | Add column with existing name | Show field error on columnName |
| `COLUMN_NOT_FOUND` | Update/delete non-existent column | Show 404 |

## Backend Files Worth Reading

- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/TargetConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/JudgeConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/DatasetSchemaController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/VerificationConfigController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/model/verificationconfig/CheckOperator.java`
