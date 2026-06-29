import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as adminApi from '@/lib/admin-api'
import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminUpdateUserRequest,
} from '@/types/admin'

export function useAdminUsers(page: number, size: number, search: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, size, search],
    queryFn: () => adminApi.listUsers(page, size, search),
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminCreateUserRequest) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateAdminUser(publicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUpdateUserRequest) => adminApi.updateUser(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useResetAdminUserPassword(publicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminResetPasswordRequest) => adminApi.resetPassword(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDisableAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (publicId: string) => adminApi.disableUser(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
