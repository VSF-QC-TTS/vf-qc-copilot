import { apiClient } from './api-client'
import type {
  CreateTestRunRequest,
  RunEventResponse,
  TestResultPageResponse,
  TestRunPageResponse,
  TestRunResponse,
} from '@/types/test-run'

export function listTestRuns(projectPublicId: string, page = 0, size = 20): Promise<TestRunPageResponse> {
  const query = new URLSearchParams({ page: String(page), size: String(size) }).toString()
  return apiClient(`/projects/${projectPublicId}/runs?${query}`)
}

export function createTestRun(projectPublicId: string, data: CreateTestRunRequest): Promise<TestRunResponse> {
  return apiClient(`/projects/${projectPublicId}/runs`, {
    method: 'POST',
    body: data,
  })
}

export function getTestRun(runPublicId: string): Promise<TestRunResponse> {
  return apiClient(`/runs/${runPublicId}`)
}

export function listTestRunResults(runPublicId: string, page = 0, size = 50): Promise<TestResultPageResponse> {
  const query = new URLSearchParams({ page: String(page), size: String(size) }).toString()
  return apiClient(`/runs/${runPublicId}/results?${query}`)
}

export function listTestRunEvents(runPublicId: string): Promise<RunEventResponse[]> {
  return apiClient(`/runs/${runPublicId}/events`)
}

export function cancelTestRun(runPublicId: string): Promise<TestRunResponse> {
  return apiClient(`/runs/${runPublicId}/cancel`, { method: 'POST' })
}
