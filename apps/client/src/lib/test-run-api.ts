import { apiClient, authorizedFetch, throwApiError } from './api-client'
import type {
  AddCustomColumnRequest,
  CreateTestRunRequest,
  CustomColumnResponse,
  OverrideResultRequest,
  RunEventResponse,
  SaveCustomValueRequest,
  TestResultOverrideResponse,
  TestResultPageResponse,
  TestRunJobResponse,
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

export function listCustomColumns(runPublicId: string): Promise<CustomColumnResponse[]> {
  return apiClient(`/runs/${runPublicId}/custom-columns`)
}

export function addCustomColumn(runPublicId: string, data: AddCustomColumnRequest): Promise<CustomColumnResponse> {
  return apiClient(`/runs/${runPublicId}/custom-columns`, {
    method: 'POST',
    body: data,
  })
}

export function saveCustomValue(resultPublicId: string, data: SaveCustomValueRequest): Promise<void> {
  return apiClient(`/results/${resultPublicId}/custom-values`, {
    method: 'POST',
    body: data,
  })
}

export function overrideResult(resultPublicId: string, data: OverrideResultRequest): Promise<TestResultOverrideResponse> {
  return apiClient(`/results/${resultPublicId}/override`, {
    method: 'POST',
    body: data,
  })
}

export function prepareTestRunExport(projectPublicId: string, runPublicId: string): Promise<TestRunJobResponse> {
  return apiClient(`/projects/${projectPublicId}/runs/${runPublicId}/exports/excel`, {
    method: 'POST',
  })
}

export async function downloadTestRunExcel(projectPublicId: string, runPublicId: string, jobPublicId: string): Promise<void> {
  const res = await authorizedFetch(`/projects/${projectPublicId}/runs/${runPublicId}/downloads/${jobPublicId}`)
  if (!res.ok) {
    await throwApiError(res)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition')
  const filename = parseFilename(disposition) ?? `test-run-${runPublicId}.xlsx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function streamTestRunJobEvents(
  jobPublicId: string,
  onEvent: (event: TestRunJobResponse) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await authorizedFetch(`/runs/jobs/${jobPublicId}/events`, {
    headers: { Accept: 'text/event-stream' },
    signal,
  })

  if (!res.ok) {
    await throwApiError(res)
  }
  if (!res.body) {
    throw new Error('Server did not open a progress stream')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const json = line.slice(5).trim()
        if (json) {
          try {
            onEvent(JSON.parse(json) as TestRunJobResponse)
          } catch (e) {
            console.error('Failed to parse SSE event data', e)
          }
        }
      }
    }
  }
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null
  const match = disposition.match(/filename=["']?([^"']+)["']?/)
  return match ? match[1] : null
}
