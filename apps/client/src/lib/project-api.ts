import { apiClient } from './api-client'
import type {
  ProjectResponse,
  ProjectSetupStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  PageResponse,
} from '@/types/project'

export async function listProjects(page: number = 0, size: number = 20): Promise<PageResponse<ProjectResponse>> {
  const query = new URLSearchParams({ page: page.toString(), size: size.toString() }).toString()
  return apiClient(`/projects?${query}`)
}

export async function getProject(publicId: string): Promise<ProjectResponse> {
  return apiClient(`/projects/${publicId}`)
}

export async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
  return apiClient('/projects', { method: 'POST', body: data })
}

export async function updateProject(publicId: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
  return apiClient(`/projects/${publicId}`, { method: 'PATCH', body: data })
}

export async function deleteProject(publicId: string): Promise<void> {
  return apiClient(`/projects/${publicId}`, { method: 'DELETE' })
}

export async function getSetupStatus(publicId: string): Promise<ProjectSetupStatus> {
  return apiClient(`/projects/${publicId}/setup-status`)
}
