import { apiClient } from './api-client'
import type {
  TargetConfigResponse,
  SaveTargetConfigRequest,
  ExecuteCurlRequest,
  ConnectResponse,
  TestTargetConfigRequest,
  TestExecutionResult,
  AiConfigResponse,
  SaveAiConfigRequest,
  TestAiConfigRequest,
  AiExecutionResult,
  ProjectSchemaResponse,
  CreateSchemaColumnRequest,
  UpdateSchemaColumnRequest,
  VerificationConfigResponse,
  SaveVerificationRequest,
  OperatorCatalogResponse,
  ResponseFieldExampleResponse,
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

export async function getResponseFieldExamples(publicId: string): Promise<ResponseFieldExampleResponse[]> {
  return apiClient(`/projects/${publicId}/config/target/response-field-examples`)
}

// ==========================================
// AI Config API (replaces Judge Config)
// ==========================================

export async function getAiConfig(publicId: string): Promise<AiConfigResponse> {
  return apiClient(`/projects/${publicId}/config/ai`)
}

export async function saveAiConfig(publicId: string, data: SaveAiConfigRequest): Promise<AiConfigResponse> {
  return apiClient(`/projects/${publicId}/config/ai`, {
    method: 'PUT',
    body: data,
  })
}

export async function testAiConfig(publicId: string, data: TestAiConfigRequest): Promise<AiExecutionResult> {
  return apiClient(`/projects/${publicId}/config/ai/test`, {
    method: 'POST',
    body: data,
  })
}

export async function listCompareConfigs(publicId: string): Promise<AiConfigResponse[]> {
  return apiClient(`/projects/${publicId}/config/ai/compare`)
}

export async function deleteCompareConfig(publicId: string, configId: string): Promise<void> {
  return apiClient(`/projects/${publicId}/config/ai/compare/${configId}`, {
    method: 'DELETE',
  })
}

// ==========================================
// Project Schema API (replaces Dataset Schema)
// ==========================================

export async function getProjectSchema(publicId: string): Promise<ProjectSchemaResponse> {
  return apiClient(`/projects/${publicId}/config/schema`)
}

export async function createSchemaColumn(publicId: string, data: CreateSchemaColumnRequest): Promise<ProjectSchemaResponse> {
  return apiClient(`/projects/${publicId}/config/schema/columns`, {
    method: 'POST',
    body: data,
  })
}

export async function updateSchemaColumn(publicId: string, columnId: string, data: UpdateSchemaColumnRequest): Promise<ProjectSchemaResponse> {
  return apiClient(`/projects/${publicId}/config/schema/columns/${columnId}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteSchemaColumn(publicId: string, columnId: string): Promise<ProjectSchemaResponse> {
  return apiClient(`/projects/${publicId}/config/schema/columns/${columnId}`, {
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
