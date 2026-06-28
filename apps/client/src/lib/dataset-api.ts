import { API_BASE_URL, ApiError, apiClient, getAccessToken } from './api-client'
import { isApiError } from './api-error'
import type {
  ConfirmDatasetImportRequest,
  CreateDatasetRequest,
  DatasetDetailResponse,
  DatasetJobEventResponse,
  DatasetJobResponse,
  DatasetPageResponse,
  DatasetRowPageResponse,
  GenerateDatasetRequest,
  SaveDatasetRowsRequest,
  UpdateDatasetRequest,
} from '@/types/dataset'

export function listDatasets(projectPublicId: string, page = 0, size = 20): Promise<DatasetPageResponse> {
  return apiClient(`/projects/${projectPublicId}/datasets?page=${page}&size=${size}`)
}

export function createDataset(projectPublicId: string, data: CreateDatasetRequest): Promise<DatasetDetailResponse> {
  return apiClient(`/projects/${projectPublicId}/datasets`, {
    method: 'POST',
    body: data,
  })
}

export function getDataset(datasetPublicId: string): Promise<DatasetDetailResponse> {
  return apiClient(`/datasets/${datasetPublicId}`)
}

export function updateDataset(datasetPublicId: string, data: UpdateDatasetRequest): Promise<DatasetDetailResponse> {
  return apiClient(`/datasets/${datasetPublicId}`, {
    method: 'PATCH',
    body: data,
  })
}

export function archiveDataset(datasetPublicId: string): Promise<void> {
  return apiClient(`/datasets/${datasetPublicId}`, {
    method: 'DELETE',
  })
}

export function listDatasetRows(
  datasetPublicId: string,
  versionPublicId: string,
  page = 0,
  size = 50,
): Promise<DatasetRowPageResponse> {
  return apiClient(`/datasets/${datasetPublicId}/versions/${versionPublicId}/rows?page=${page}&size=${size}`)
}

export function saveDatasetRows(
  datasetPublicId: string,
  versionPublicId: string,
  data: SaveDatasetRowsRequest,
): Promise<DatasetDetailResponse> {
  return apiClient(`/datasets/${datasetPublicId}/versions/${versionPublicId}/rows`, {
    method: 'POST',
    body: data,
  })
}

export function activateDatasetVersion(datasetPublicId: string, versionPublicId: string): Promise<DatasetDetailResponse> {
  return apiClient(`/datasets/${datasetPublicId}/versions/${versionPublicId}/activate`, {
    method: 'POST',
  })
}

export function generateDatasetRows(
  datasetPublicId: string,
  data: GenerateDatasetRequest,
): Promise<DatasetJobResponse> {
  return apiClient(`/datasets/${datasetPublicId}/generations`, {
    method: 'POST',
    body: data,
  })
}

export function prepareDatasetExport(datasetPublicId: string, versionPublicId: string): Promise<DatasetJobResponse> {
  return apiClient(`/datasets/${datasetPublicId}/versions/${versionPublicId}/exports/excel`, {
    method: 'POST',
  })
}

export function confirmDatasetImport(
  datasetPublicId: string,
  jobPublicId: string,
  data: ConfirmDatasetImportRequest,
): Promise<DatasetJobResponse> {
  return apiClient(`/datasets/${datasetPublicId}/imports/${jobPublicId}/confirm`, {
    method: 'POST',
    body: data,
  })
}

export function cancelDatasetJob(jobPublicId: string): Promise<DatasetJobResponse> {
  return apiClient(`/dataset-jobs/${jobPublicId}/cancel`, {
    method: 'POST',
  })
}

export async function getExcelSheets(datasetPublicId: string, file: File): Promise<string[]> {
  const body = new FormData()
  body.append('file', file)
  const res = await authorizedFetch(`/datasets/${datasetPublicId}/imports/excel/sheets`, {
    method: 'POST',
    body,
  })
  return readJsonResponse<string[]>(res)
}

export async function importDatasetExcel(
  datasetPublicId: string,
  file: File,
  sheetName?: string | null,
): Promise<DatasetJobResponse> {
  const body = new FormData()
  body.append('file', file)
  const queryParam = sheetName ? `?sheetName=${encodeURIComponent(sheetName)}` : ''
  const res = await authorizedFetch(`/datasets/${datasetPublicId}/imports/excel${queryParam}`, {
    method: 'POST',
    body,
  })
  return readJsonResponse<DatasetJobResponse>(res)
}

export async function downloadDatasetVersionExcel(datasetPublicId: string, versionPublicId: string): Promise<void> {
  const res = await authorizedFetch(`/datasets/${datasetPublicId}/versions/${versionPublicId}/download.xlsx`)
  if (!res.ok) {
    await throwApiError(res)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition')
  const filename = parseFilename(disposition) ?? `dataset-${versionPublicId}.xlsx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function streamDatasetJobEvents(
  jobPublicId: string,
  onEvent: (event: DatasetJobEventResponse) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await authorizedFetch(`/dataset-jobs/${jobPublicId}/events`, {
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
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      const data = chunk
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('')
      if (data) {
        onEvent(JSON.parse(data) as DatasetJobEventResponse)
      }
    }
  }
}

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const data: unknown = await res.json()
  if (!res.ok) {
    if (isApiError(data)) {
      throw new ApiError(data)
    }
    throw new Error('Request failed')
  }
  return data as T
}

async function throwApiError(res: Response): Promise<never> {
  const data: unknown = await res.json().catch(() => null)
  if (isApiError(data)) {
    throw new ApiError(data)
  }
  throw new Error('Request failed')
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) {
    return null
  }
  const match = /filename="([^"]+)"/.exec(disposition)
  return match?.[1] ?? null
}
