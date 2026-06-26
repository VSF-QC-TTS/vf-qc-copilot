import { apiClient } from './api-client'
import type {
  TargetConfigResponse,
  SaveTargetConfigRequest,
  ExecuteCurlRequest,
  ConnectResponse,
  TestTargetConfigRequest,
  TestExecutionResult,
  JudgeConfigResponse,
  SaveJudgeConfigRequest,
  TestJudgeConfigRequest,
  JudgeExecutionResult,
  DatasetSchemaResponse,
  CreateColumnRequest,
  UpdateColumnRequest,
  VerificationConfigResponse,
  SaveVerificationRequest,
  OperatorCatalogResponse,
} from '@/types/config'

// ==========================================
// Target Config API
// ==========================================

export async function getTargetConfig(publicId: string): Promise<TargetConfigResponse> {
  return apiClient(`/projects/${publicId}/config/target`)
}

export async function saveTargetConfig(publicId: string, data: SaveTargetConfigRequest): Promise<TargetConfigResponse> {
  return apiClient(`/projects/${publicId}/config/target`, {
    method: 'PUT',
    body: data,
  })
}

export async function connectTarget(publicId: string, data: ExecuteCurlRequest): Promise<ConnectResponse> {
  return apiClient(`/projects/${publicId}/config/target/connect`, {
    method: 'POST',
    body: data,
  })
}

export async function testTargetConfig(publicId: string, data: TestTargetConfigRequest): Promise<TestExecutionResult> {
  return apiClient(`/projects/${publicId}/config/target/test`, {
    method: 'POST',
    body: data,
  })
}

export async function getResponseFields(publicId: string): Promise<string[]> {
  return apiClient(`/projects/${publicId}/config/target/response-fields`)
}

// ==========================================
// Judge Config API
// ==========================================

export async function getJudgeConfig(publicId: string): Promise<JudgeConfigResponse> {
  return apiClient(`/projects/${publicId}/config/judge`)
}

export async function saveJudgeConfig(publicId: string, data: SaveJudgeConfigRequest): Promise<JudgeConfigResponse> {
  return apiClient(`/projects/${publicId}/config/judge`, {
    method: 'PUT',
    body: data,
  })
}

export async function testJudgeConfig(publicId: string, data: TestJudgeConfigRequest): Promise<JudgeExecutionResult> {
  return apiClient(`/projects/${publicId}/config/judge/test`, {
    method: 'POST',
    body: data,
  })
}

// ==========================================
// Dataset Schema API
// ==========================================

export async function getDatasetSchema(publicId: string): Promise<DatasetSchemaResponse> {
  return apiClient(`/projects/${publicId}/dataset-schema`)
}

export async function createColumn(publicId: string, data: CreateColumnRequest): Promise<DatasetSchemaResponse> {
  return apiClient(`/projects/${publicId}/dataset-schema/columns`, {
    method: 'POST',
    body: data,
  })
}

export async function updateColumn(publicId: string, columnId: string, data: UpdateColumnRequest): Promise<DatasetSchemaResponse> {
  return apiClient(`/projects/${publicId}/dataset-schema/columns/${columnId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function deleteColumn(publicId: string, columnId: string): Promise<DatasetSchemaResponse> {
  return apiClient(`/projects/${publicId}/dataset-schema/columns/${columnId}`, {
    method: 'DELETE',
  })
}

// ==========================================
// Verification Config API
// ==========================================

export async function getVerificationConfig(publicId: string): Promise<VerificationConfigResponse> {
  return apiClient(`/projects/${publicId}/config/verification`)
}

export async function saveVerificationConfig(publicId: string, data: SaveVerificationRequest): Promise<VerificationConfigResponse> {
  return apiClient(`/projects/${publicId}/config/verification`, {
    method: 'PUT',
    body: data,
  })
}

export async function getOperators(): Promise<OperatorCatalogResponse[]> {
  return apiClient(`/verification/operators`)
}
