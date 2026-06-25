import type { ApiErrorResponse } from '@/types/api'
import { isApiError } from '@/lib/api-error'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// ---------------------------------------------------------------------------
// Token store (memory-only, never persisted to localStorage)
// ---------------------------------------------------------------------------

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

// ---------------------------------------------------------------------------
// Refresh queue — prevents duplicate refreshes + retries failed requests
//
// When multiple requests fail with ACCESS_TOKEN_EXPIRED simultaneously:
// 1. First failure triggers a single refresh request
// 2. All subsequent failures queue their retry callbacks
// 3. After refresh completes: drain queue (retry all or reject all)
// 4. No infinite loops: each request retries at most once
// ---------------------------------------------------------------------------

type QueueEntry = {
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
  retry: () => Promise<unknown>
}

let isRefreshing = false
const failedQueue: QueueEntry[] = []

function drainQueue(success: boolean) {
  for (const entry of failedQueue) {
    if (success) {
      entry.retry().then(entry.resolve, entry.reject)
    } else {
      entry.reject(new Error('Session expired'))
    }
  }
  failedQueue.length = 0
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      accessToken = null
      return false
    }

    const data = await res.json()
    accessToken = data.accessToken
    return true
  } catch {
    accessToken = null
    return false
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly response: ApiErrorResponse

  constructor(response: ApiErrorResponse) {
    super(response.detail)
    this.name = 'ApiError'
    this.response = response
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  skipAuth?: boolean
}

async function rawFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (!skipAuth && accessToken) {
    reqHeaders['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  // No content
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  const data = await res.json()

  if (!res.ok) {
    if (isApiError(data)) {
      throw new ApiError(data)
    }
    throw new Error(data.detail ?? data.message ?? 'Request failed')
  }

  return data as T
}

// ---------------------------------------------------------------------------
// Public API client with refresh queue
// ---------------------------------------------------------------------------

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await rawFetch<T>(path, options)
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.response.code !== 'ACCESS_TOKEN_EXPIRED'
    ) {
      throw error
    }

    // Already refreshing — queue this request's retry
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: resolve as (value: unknown) => void,
          reject,
          retry: () => rawFetch<T>(path, options),
        })
      })
    }

    // First failure — initiate refresh + drain queue after
    isRefreshing = true

    try {
      const refreshed = await attemptRefresh()

      // Drain all queued requests
      drainQueue(refreshed)

      if (refreshed) {
        // Retry the original request that triggered the refresh
        return await rawFetch<T>(path, options)
      }

      throw error
    } finally {
      isRefreshing = false
    }
  }
}
