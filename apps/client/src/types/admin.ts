import type { UserResponse, UserRole, UserStatus } from '@/types/api'
import type { PageResponse } from '@/types/project'

export type AdminUserPage = PageResponse<UserResponse>

export type AdminCreateUserRequest = {
  email: string
  password: string
  displayName?: string | null
  role: UserRole
  status: UserStatus
}

export type AdminUpdateUserRequest = {
  displayName?: string | null
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
}

export type AdminResetPasswordRequest = {
  password: string
}

export const USER_ROLES: readonly UserRole[] = ['QC_MEMBER', 'QC_LEAD', 'ADMIN']

export const USER_STATUSES: readonly UserStatus[] = [
  'PENDING_EMAIL_VERIFICATION',
  'ACTIVE',
  'DISABLED',
]
