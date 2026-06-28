export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'CUSTOM'

export type KeySource = 'PLATFORM' | 'PERSONAL'

export type CheckOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'REGEX'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUALS'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUALS'

export type VerificationMode = 'FIELD_CHECKS' | 'LLM_JUDGE' | 'COMBINED'

export type VerificationItemType = 'FIELD_ASSERTION' | 'LLM_JUDGE'

export type OperatorCategory = 'TEXT' | 'NUMBER' | 'STRUCTURE' | 'PRESENCE'

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

export interface ResponseFieldExampleResponse {
  path: string
  example: string | null
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

export interface FieldAssertionResponse {
  publicId: string
  actualPath: string
  operator: CheckOperator
  expectedColumnKey: string
}

export interface FieldAssertionRequest {
  publicId?: string | null
  actualPath: string
  operator: CheckOperator
  expectedColumnKey: string | null
}

export interface VerificationItemResponse {
  publicId: string
  type: VerificationItemType
  fieldAssertion: FieldAssertionResponse | null
  targetPaths: string[]
  referenceColumnKeys: string[]
  rubric: string | null
}

export interface VerificationItemRequest {
  publicId?: string | null
  type: VerificationItemType
  fieldAssertion?: FieldAssertionRequest | null
  targetPaths?: string[] | null
  referenceColumnKeys?: string[] | null
  rubric?: string | null
}

export interface VerificationConfigResponse {
  publicId: string
  version: number
  mode: VerificationMode
  items: VerificationItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface SaveVerificationRequest {
  mode: VerificationMode
  items?: VerificationItemRequest[] | null
}

export interface OperatorCatalogResponse {
  operator: CheckOperator
  displayName: string
  description: string
  category: OperatorCategory
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
