export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'CUSTOM'

export type KeySource = 'PLATFORM' | 'PERSONAL'

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

export type VerificationMode = 'FIELD_CHECKS_ONLY' | 'OVERALL_RUBRIC' | 'RULE_AND_LLM'

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
// AI Config (replaces Judge Config)
// ==========================================

export interface AiConfigResponse {
  publicId: string
  version: number
  provider: AiProvider
  baseUrl: string | null
  keySource: KeySource
  hasApiKey: boolean
  evaluationModel: string | null
  generationModel: string | null
  temperature: number | null
  maxTokens: number | null
  timeoutMs: number | null
  retryCount: number | null
  lastTestStatus: string | null    // "SUCCESS" | "FAILED"
  lastTestedAt: string | null      // ISO-8601
  createdAt: string
  updatedAt: string
}

export interface SaveAiConfigRequest {
  provider: AiProvider
  baseUrl?: string | null
  apiKey?: string | null       // Send "SECRET_REDACTED" to keep existing key
  keySource: KeySource
  evaluationModel: string
  generationModel?: string | null
  temperature?: number | null
  maxTokens?: number | null
  timeoutMs: number
  retryCount: number
}

export interface TestAiConfigRequest {
  systemPrompt: string
  userMessage: string
}

export interface AiExecutionResult {
  generatedText: string | null
  promptTokens: number
  completionTokens: number
  latencyMs: number
  errorMessage: string | null
  successful: boolean
}

// ==========================================
// Project Schema (simplified from Dataset Schema)
// ==========================================

export interface SchemaColumnResponse {
  publicId: string
  columnName: string
  dataType: string
  role: string
  sampleValue: string | null
  displayOrder: number
}

export interface ProjectSchemaResponse {
  publicId: string
  version: number
  columns: SchemaColumnResponse[]
  createdAt: string
}

export interface CreateSchemaColumnRequest {
  columnName: string
  dataType: string
  role: string
  sampleValue?: string | null
}

export interface UpdateSchemaColumnRequest {
  columnName?: string | null
  dataType?: string | null
  role?: string | null
  sampleValue?: string | null
}

// ==========================================
// Verification Config
// ==========================================

export interface FieldCheckRuleResponse {
  publicId: string
  responsePath: string
  operator: CheckOperator
  expectedSource: ExpectedSource
  expectedColumnKey: string | null   // UUID of SchemaColumn.publicId
  expectedValue: string | null
  threshold: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface FieldCheckRuleRequest {
  publicId?: string | null
  responsePath: string
  operator: CheckOperator
  expectedSource: ExpectedSource
  expectedColumnKey?: string | null   // UUID of SchemaColumn.publicId
  expectedValue?: string | null
  threshold?: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmRubricRuleResponse {
  publicId: string
  name: string
  targetPath: string | null
  rubric: string
  threshold: number
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmRubricRuleRequest {
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
  fieldChecks: FieldCheckRuleResponse[]
  llmRubrics: LlmRubricRuleResponse[]
  createdAt: string
  updatedAt: string
}

export interface SaveVerificationRequest {
  mode: VerificationMode
  fieldChecks?: FieldCheckRuleRequest[] | null
  llmRubrics?: LlmRubricRuleRequest[] | null
}

export interface OperatorCatalogResponse {
  operator: CheckOperator
  displayName: string
  description: string
}

// ==========================================
// Project Setup Status
// ==========================================

export interface ProjectSetupStatus {
  hasTargetConfig: boolean
  hasAiConfig: boolean
  hasProjectSchema: boolean
  hasVerification: boolean
  hasDatasets: boolean
  totalTestRuns: number
}
