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
  | 'NOT_EMPTY'
  | 'IS_JSON'

export type ExpectedSource = 'DATASET_COLUMN'

export type VerificationMode = 'FIELD_CHECKS' | 'LLM_JUDGE' | 'COMBINED'

export type VerificationItemType = 'FIELD_ASSERTION' | 'FIELD_ASSERTION_GROUP' | 'LLM_JUDGE'

export type FieldAggregation = 'ALL' | 'ANY' | 'AT_LEAST' | 'AVERAGE'

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

export interface ExpectedValue {
  source: ExpectedSource
  columnKey: string | null
  value: string | null
  template: string | null
}

export type ExpectedValueRequest = ExpectedValue
export type ExpectedValueResponse = ExpectedValue

export interface FieldAssertionResponse {
  publicId: string
  actualPath: string
  operator: CheckOperator
  expected: ExpectedValueResponse | null
  threshold: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface FieldAssertionRequest {
  publicId?: string | null
  actualPath: string
  operator: CheckOperator
  expected?: ExpectedValueRequest | null
  threshold?: number | null
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmCriterionResponse {
  publicId: string
  name: string
  description: string
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface LlmCriterionRequest {
  publicId?: string | null
  name: string
  description: string
  weight: number
  enabled: boolean
  displayOrder: number
}

export interface VerificationItemResponse {
  publicId: string
  type: VerificationItemType
  name: string
  enabled: boolean
  critical: boolean
  weight: number
  threshold: number | null
  displayOrder: number
  aggregation: FieldAggregation | null
  minPassCount: number | null
  fieldAssertion: FieldAssertionResponse | null
  fieldAssertions: FieldAssertionResponse[]
  targetPaths: string[]
  referenceColumnKeys: string[]
  rubric: string | null
  criteria: LlmCriterionResponse[]
}

export interface VerificationItemRequest {
  publicId?: string | null
  type: VerificationItemType
  name: string
  enabled: boolean
  critical: boolean
  weight: number
  threshold?: number | null
  displayOrder: number
  aggregation?: FieldAggregation | null
  minPassCount?: number | null
  fieldAssertion?: FieldAssertionRequest | null
  fieldAssertions?: FieldAssertionRequest[] | null
  targetPaths?: string[] | null
  referenceColumnKeys?: string[] | null
  rubric?: string | null
  criteria?: LlmCriterionRequest[] | null
}

export interface VerificationConfigResponse {
  publicId: string
  version: number
  mode: VerificationMode
  threshold: number
  items: VerificationItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface SaveVerificationRequest {
  mode: VerificationMode
  threshold: number
  items?: VerificationItemRequest[] | null
}

export interface OperatorCatalogResponse {
  operator: CheckOperator
  displayName: string
  description: string
  category: OperatorCategory
  requiresExpected: boolean
  supportedExpectedSources: ExpectedSource[]
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
