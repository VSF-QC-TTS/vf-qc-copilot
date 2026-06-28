import type { PageResponse } from './project'

export type DatasetSource = 'MANUAL' | 'IMPORTED' | 'AI_GENERATED'
export type DatasetStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type DatasetVersionStatus = 'DRAFT' | 'VALID' | 'INVALID' | 'ACTIVE'
export type DatasetRowValidationStatus = 'VALID' | 'INVALID'
export type DatasetJobType = 'IMPORT_EXCEL' | 'AI_GENERATE' | 'EXPORT_EXCEL'
export type DatasetJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'NEEDS_CONFIRMATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
export type DatasetColumnMappingAction = 'MAP_TO_SCHEMA' | 'ADD_TO_SCHEMA' | 'IGNORE'

export interface DatasetVersionSummaryResponse {
  publicId: string
  versionNumber: number
  schemaPublicId: string | null
  source: DatasetSource
  status: DatasetVersionStatus
  totalRows: number
  validRows: number
  invalidRows: number
  createdAt: string
}

export interface DatasetSummaryResponse {
  publicId: string
  name: string
  description: string | null
  source: DatasetSource
  status: DatasetStatus
  latestVersion: DatasetVersionSummaryResponse | null
  activeVersion: DatasetVersionSummaryResponse | null
  createdAt: string
  updatedAt: string
}

export interface DatasetDetailResponse extends DatasetSummaryResponse {
  versions: DatasetVersionSummaryResponse[]
}

export interface DatasetValidationError {
  rowIndex: number | null
  columnName: string | null
  code: string
  message: string
}

export interface DatasetRowResponse {
  publicId: string
  rowIndex: number
  data: Record<string, unknown>
  validationStatus: DatasetRowValidationStatus
  validationErrors: DatasetValidationError[]
  createdAt: string
}

export interface DatasetColumnMappingSuggestionResponse {
  sourceColumn: string
  schemaColumnPublicId: string | null
  targetColumn: string
  newColumn: boolean
}

export interface DatasetJobResponse {
  publicId: string
  datasetPublicId: string | null
  datasetVersionPublicId: string | null
  type: DatasetJobType
  status: DatasetJobStatus
  progress: number
  message: string | null
  errorMessage: string | null
  mappingSuggestions: DatasetColumnMappingSuggestionResponse[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface DatasetJobEventResponse {
  jobPublicId: string
  type: DatasetJobType
  status: DatasetJobStatus
  progress: number
  message: string | null
  errorMessage: string | null
  datasetPublicId: string | null
  datasetVersionPublicId: string | null
  mappingSuggestions: DatasetColumnMappingSuggestionResponse[]
}

export interface CreateDatasetRequest {
  name: string
  description?: string | null
}

export interface UpdateDatasetRequest {
  name?: string | null
  description?: string | null
}

export interface GenerateDatasetRequest {
  context: string
  rowCount: number
  notes?: string | null
}

export interface DatasetColumnMappingRequest {
  sourceColumn: string
  action: DatasetColumnMappingAction
  schemaColumnPublicId?: string | null
  newColumnName?: string | null
  newColumnRole?: string | null
  newColumnDataType?: string | null
}

export interface ConfirmDatasetImportRequest {
  mappings: DatasetColumnMappingRequest[]
}

export interface SaveDatasetRowsRequest {
  rows: Record<string, unknown>[]
}

export type DatasetPageResponse = PageResponse<DatasetSummaryResponse>
export type DatasetRowPageResponse = PageResponse<DatasetRowResponse>
