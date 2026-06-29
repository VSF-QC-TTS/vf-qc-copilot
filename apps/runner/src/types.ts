export type TestCaseStatus = 'PASSED' | 'FAILED' | 'ERROR';
export type VerificationMode = 'FIELD_CHECKS' | 'LLM_JUDGE' | 'COMBINED';
export type VerificationItemType = 'FIELD_ASSERTION' | 'LLM_JUDGE';
export type CheckOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'REGEX'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUALS'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUALS';

export interface EvalRunRequest {
  runId: string;
  internalRunId: number;
  targetConfig: TargetConfigPayload;
  aiConfig: AiConfigPayload | null;
  datasetRows: DatasetRowPayload[];
  schemaColumns: SchemaColumnPayload[];
  verification: VerificationPayload;
}

export interface TargetConfigPayload {
  method: string;
  url: string;
  headers?: string | null;
  queryParams?: string | null;
  bodyTemplate?: string | null;
  responsePath?: string | null;
  timeoutMs?: number | null;
  secrets: Record<string, string>;
}

export interface AiConfigPayload {
  provider: string;
  baseUrl?: string | null;
  evaluationModel: string;
  temperature?: number | null;
  maxTokens?: number | null;
  timeoutMs?: number | null;
  retryCount?: number | null;
  apiKey?: string | null;
}

export interface DatasetRowPayload {
  publicId: string;
  internalId: number;
  rowIndex: number;
  data: string;
}

export interface SchemaColumnPayload {
  publicId: string;
  columnName: string;
  dataType: string;
  role: string;
}

export interface VerificationPayload {
  mode: VerificationMode;
  version: number;
  items: VerificationItemPayload[];
}

export interface VerificationItemPayload {
  publicId: string;
  internalId: number;
  type: VerificationItemType;
  targetPaths?: string | null;
  referenceColumnKeys?: string | null;
  rubric?: string | null;
  fieldAssertion?: FieldAssertionPayload | null;
}

export interface FieldAssertionPayload {
  actualPath: string;
  operator: CheckOperator;
  expectedColumnKey: string;
}

export interface RunnerAssertionResult {
  assertionName: string;
  assertionType: string;
  responsePath: string | null;
  passed: boolean;
  score: number;
  reason: string;
  expectedValue: string | null;
  actualValue: string | null;
}

export interface RunnerCaseResult {
  datasetRowPublicId: string;
  caseIndex: number;
  inputData: string;
  actualOutput: string;
  status: TestCaseStatus;
  passed: boolean;
  score: number;
  errorMessage: string | null;
  latencyMs: number;
  rawTargetResponse: string;
  assertions: RunnerAssertionResult[];
}
