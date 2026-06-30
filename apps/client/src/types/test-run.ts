import type { PageResponse } from './project'

export type TestRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'ERROR'
  | 'CANCELLED'

export type TestCaseStatus = 'PASSED' | 'FAILED' | 'ERROR'

export type RunEventType =
  | 'RUN_QUEUED'
  | 'RUN_STARTED'
  | 'CASE_STARTED'
  | 'CASE_COMPLETED'
  | 'CASE_FAILED'
  | 'RUN_PROGRESS'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'RUN_CANCELLED'

export interface CreateTestRunRequest {
  name?: string | null
  datasetPublicId?: string | null
  isComparison?: boolean
  compareAiConfigPublicIds?: string[] | null
  comparePromptTemplate?: string | null
}

export interface TestRunResponse {
  publicId: string
  name: string
  runType?: 'EVALUATION' | 'COMPARISON'
  compareAiConfigs?: any | null
  status: TestRunStatus
  projectId: number
  targetConfigId: number | null
  targetConfigVersion: number | null
  aiConfigId: number | null
  aiConfigVersion: number | null
  projectSchemaId: number | null
  projectSchemaVersion: number | null
  datasetId: number
  datasetVersionId: number
  datasetVersionNumber: number
  verificationConfigId: number
  verificationConfigVersion: number
  totalCases: number
  passedCases: number
  failedCases: number
  errorCases: number
  score: number | null
  queuedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  cancellationRequested: boolean
  errorMessage: string | null
  createdAt: string
}

export interface AssertionResultResponse {
  publicId: string
  assertionName: string
  assertionType: string
  responsePath: string | null
  passed: boolean
  score: number
  reason: string | null
  expectedValue: string | null
  actualValue: string | null
  createdAt: string
}

export interface CustomColumnResponse {
  publicId: string
  columnName: string
  dataType: string
}

export interface CustomValueResponse {
  customColumnPublicId: string
  value: string | null
}

export interface TestResultOverrideResponse {
  publicId: string
  overriddenStatus: TestCaseStatus
  overriddenScore: number
  correctedReason: string | null
  correctedByUserEmail: string
  createdAt: string
}

export interface AddCustomColumnRequest {
  columnName: string
  dataType: string
}

export interface SaveCustomValueRequest {
  customColumnPublicId: string
  value: string | null
}

export interface OverrideResultRequest {
  overriddenStatus: TestCaseStatus
  overriddenScore: number
  correctedReason: string | null
}

export interface TestRunJobResponse {
  publicId: string
  runPublicId: string | null
  type: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  progress: number
  message: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface TestResultResponse {
  publicId: string
  runPublicId: string
  datasetRowId: number
  caseIndex: number
  inputData: string | null
  actualOutput: string | null
  status: TestCaseStatus
  passed: boolean
  score: number | null
  errorMessage: string | null
  latencyMs: number | null
  assertions: AssertionResultResponse[]
  customValues: CustomValueResponse[]
  override: TestResultOverrideResponse | null
  createdAt: string
}

export interface RunEventResponse {
  publicId: string
  runPublicId: string
  eventType: RunEventType
  payload: string | null
  createdAt: string
}

export type TestRunPageResponse = PageResponse<TestRunResponse>
export type TestResultPageResponse = PageResponse<TestResultResponse>
