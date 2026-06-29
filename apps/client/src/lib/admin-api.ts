import { apiClient } from '@/lib/api-client'
import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminUpdateUserRequest,
  AdminUserPage,
} from '@/types/admin'
import type { UserResponse } from '@/types/api'

export function listUsers(page = 0, size = 20, search = ''): Promise<AdminUserPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  })
  if (search.trim()) {
    params.set('search', search.trim())
  }
  return apiClient(`/admin/users?${params.toString()}`)
}

export function createUser(data: AdminCreateUserRequest): Promise<UserResponse> {
  return apiClient('/admin/users', { method: 'POST', body: data })
}

export function updateUser(
  publicId: string,
  data: AdminUpdateUserRequest,
): Promise<UserResponse> {
  return apiClient(`/admin/users/${publicId}`, { method: 'PATCH', body: data })
}

export function resetPassword(
  publicId: string,
  data: AdminResetPasswordRequest,
): Promise<UserResponse> {
  return apiClient(`/admin/users/${publicId}/password`, { method: 'POST', body: data })
}

export function disableUser(publicId: string): Promise<void> {
  return apiClient(`/admin/users/${publicId}`, { method: 'DELETE' })
}
