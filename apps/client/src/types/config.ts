export type LlmProvider = 'OPENAI' | 'AZURE_OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'CUSTOM'

export type ColumnDataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'

export type ColumnRole = 'INPUT' | 'EXPECTED_OUTPUT' | 'CONTEXT' | 'METADATA'

export type CheckOperator =
  | 'EQUALS'
  | 'CONTAINS'
  | 'ICONTAINS'
  | 'NOT_CONTAINS'
  | 'CONTAINS_ALL'
  | 'CONTAINS_ANY'
  | 'STARTS_WITH'
  | 'REGEX'
  | 'NOT_EMPTY'
  | 'IS_JSON'
  | 'JAVASCRIPT'
  | 'LLM_JUDGE'

export type ExpectedSource = 'DATASET_COLUMN' | 'LITERAL'

export type VerificationMode = 'FIELD_CHECKS' | 'OVERALL_RUBRIC' | 'RULE_AND_LLM'

// ==========================================
// Target Config
// ==========================================

export interface TargetConfigResponse {
  publicId: string
  version: number
  name: string | null
  method: string
  url: string
  maskedHeaders: Record<string, string>
  maskedQueryParams: Record<string, string>
  bodyTemplate: string | null
  responsePath: string | null
  timeoutMs: number
  requestFieldSnapshot: string | null
  responseFieldSnapshot: string | null
  rawCurl: string | null
  lastTestStatus: string | null    // "SUCCESS" | "FAILED"
  lastTestedAt: string | null      // ISO-8601
  createdAt: string
  updatedAt: string
}

export interface SaveTargetConfigRequest {
  method: string
  url: string
  headers?: Record<string, string> | null
  queryParams?: Record<string, string> | null
  bodyTemplate?: string | null
  responsePath?: string | null
  timeoutMs: number
  name?: string | null
}

export interface ExecuteCurlRequest {
  curl: string
}

export interface SecretDetection {
  location: string    // "HEADER" | "QUERY_PARAM"
  keyName: string
  action: string      // "REDACTED"
}

export interface TestExecutionResult {
  httpStatus: number
  latencyMs: number
  responseBody: string | null
  errorMessage: string | null
  responseFieldTree: Record<string, any> | null
}

export interface ConnectResponse {
  config: TargetConfigResponse
  secretsDetected: SecretDetection[]
  testResult: TestExecutionResult
}

export interface TestTargetConfigRequest {
  sampleInput?: Record<string, string> | null
}

// ==========================================
// Judge Config
// ==========================================

export interface JudgeConfigResponse {
  publicId: string
  version: number
  provider: LlmProvider
  baseUrl: string | null
  hasApiKey: boolean
  model: string | null
  customModelName: string | null
  temperature: number | null
  maxTokens: number | null
  timeoutMs: number | null
  retryCount: number | null
  lastTestStatus: string | null    // "SUCCESS" | "FAILED"
  lastTestedAt: string | null      // ISO-8601
  createdAt: string
  updatedAt: string
}

export interface SaveJudgeConfigRequest {
  provider: LlmProvider
  baseUrl?: string | null
  apiKey?: string | null       // Send "SECRET_REDACTED" to keep existing key
  model: string
  customModelName?: string | null
  temperature?: number | null
  maxTokens?: number | null
  timeoutMs: number
  retryCount: number
}

export interface TestJudgeConfigRequest {
  systemPrompt: string
  userMessage: string
}

export interface JudgeExecutionResult {
  generatedText: string | null
  promptTokens: number
  completionTokens: number
  latencyMs: number
  errorMessage: string | null
  successful: boolean
}

// ==========================================
// Dataset Schema
// ==========================================

export interface DatasetColumnResponse {
  publicId: string
  columnName: string
  displayName: string | null
  dataType: ColumnDataType
  role: ColumnRole
  required: boolean
  sampleValue: string | null
  description: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface DatasetSchemaResponse {
  publicId: string
  version: number
  createdAt: string
  columns: DatasetColumnResponse[]
}

export interface CreateColumnRequest {
  columnName: string
  displayName?: string | null
  dataType: ColumnDataType
  role: ColumnRole
  required: boolean
  sampleValue?: string | null
  description?: string | null
}

export interface UpdateColumnRequest {
  displayName?: string | null
  dataType: ColumnDataType
  role: ColumnRole
  required: boolean
  sampleValue?: string | null
  description?: string | null
  displayOrder: number
}

// ==========================================
// Verification Config
// ==========================================

export interface FieldCheckResponse {
  publicId: string
  responsePath: string
  operator: CheckOperator
  expectedSource: ExpectedSource
  expectedColumn: string | null
  expectedValue: string | null
  threshold: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface FieldCheckRequest {
  publicId?: string | null
  responsePath: string
  operator: CheckOperator
  expectedSource: ExpectedSource
  expectedColumn?: string | null
  expectedValue?: string | null
  threshold?: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmRubricResponse {
  publicId: string
  name: string
  targetPath: string | null
  rubric: string
  threshold: number
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmRubricRequest {
  publicId?: string | null
  name: string
  targetPath?: string | null
  rubric: string
  threshold: number
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface VerificationConfigResponse {
  publicId: string
  version: number
  mode: VerificationMode
  fieldChecks: FieldCheckResponse[]
  llmRubrics: LlmRubricResponse[]
  createdAt: string
  updatedAt: string
}

export interface SaveVerificationRequest {
  mode: VerificationMode
  fieldChecks?: FieldCheckRequest[] | null
  llmRubrics?: LlmRubricRequest[] | null
}

export interface OperatorCatalogResponse {
  operator: CheckOperator
  displayName: string
  description: string
}
