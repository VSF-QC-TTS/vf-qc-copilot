export type ProjectResponse = {
  publicId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectSetupStatus = {
  hasTargetConfig: boolean
  hasJudgeConfig: boolean
  hasDatasetSchema: boolean
  hasVerification: boolean
  hasDatasets: boolean
  totalTestRuns: number
}

export type CreateProjectRequest = {
  name: string
  description?: string | null
}

export type UpdateProjectRequest = {
  name?: string | null
  description?: string | null
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
