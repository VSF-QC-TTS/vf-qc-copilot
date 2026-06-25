import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as projectApi from '@/lib/project-api'
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types/project'

export function useProjectsInfinite(size = 20) {
  return useInfiniteQuery({
    queryKey: ['projects', 'list'],
    queryFn: ({ pageParam }) => projectApi.listProjects(pageParam, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined
      return lastPage.page + 1
    },
  })
}

export function useProject(publicId: string | undefined) {
  return useQuery({
    queryKey: ['projects', publicId],
    queryFn: () => projectApi.getProject(publicId!),
    enabled: !!publicId,
  })
}

export function useSetupStatus(publicId: string | undefined) {
  return useQuery({
    queryKey: ['projects', publicId, 'setupStatus'],
    queryFn: () => projectApi.getSetupStatus(publicId!),
    enabled: !!publicId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
    },
  })
}

export function useUpdateProject(publicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProjectRequest) => projectApi.updateProject(publicId, data),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['projects', publicId], updatedProject)
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (publicId: string) => projectApi.deleteProject(publicId),
    onSuccess: (_, publicId) => {
      queryClient.removeQueries({ queryKey: ['projects', publicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
    },
  })
}
