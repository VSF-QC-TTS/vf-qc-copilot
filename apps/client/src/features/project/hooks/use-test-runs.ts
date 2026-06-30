import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  cancelTestRun,
  createTestRun,
  getTestRun,
  listTestRunEvents,
  listTestRunResults,
  listTestRuns,
  listCustomColumns,
  addCustomColumn,
  saveCustomValue,
  overrideResult,
  prepareTestRunExport,
} from '@/lib/test-run-api'
import type {
  CreateTestRunRequest,
  TestRunResponse,
  AddCustomColumnRequest,
  SaveCustomValueRequest,
  OverrideResultRequest,
} from '@/types/test-run'

export function isRunActive(run: TestRunResponse | undefined): boolean {
  return run?.status === 'QUEUED' || run?.status === 'RUNNING'
}

export function useTestRuns(projectPublicId: string | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: ['testRuns', projectPublicId, page, size],
    queryFn: () => listTestRuns(projectPublicId!, page, size),
    enabled: Boolean(projectPublicId),
    refetchInterval: (query) => {
      const runs = query.state.data?.content ?? []
      return runs.some(isRunActive) ? 1500 : false
    },
  })
}

export function useCreateTestRun(projectPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTestRunRequest) => createTestRun(projectPublicId!, data),
    onSuccess: (run) => {
      toast.success('Đã tạo test run')
      queryClient.invalidateQueries({ queryKey: ['testRuns', projectPublicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectPublicId, 'setupStatus'] })
      queryClient.setQueryData(['testRun', run.publicId], run)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useTestRun(runPublicId: string | undefined, forcePoll = false) {
  return useQuery({
    queryKey: ['testRun', runPublicId],
    queryFn: () => getTestRun(runPublicId!),
    enabled: Boolean(runPublicId),
    refetchInterval: (query) => {
      if (forcePoll) return 1500
      const run = query.state.data as TestRunResponse | undefined
      return isRunActive(run) ? 1500 : false
    },
  })
}

export function useTestRunResults(runPublicId: string | undefined, poll = false, page = 0, size = 50) {
  return useQuery({
    queryKey: ['testRunResults', runPublicId, page, size],
    queryFn: () => listTestRunResults(runPublicId!, page, size),
    enabled: Boolean(runPublicId),
    refetchInterval: poll ? 1500 : false,
  })
}

export function useTestRunEvents(runPublicId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ['testRunEvents', runPublicId],
    queryFn: () => listTestRunEvents(runPublicId!),
    enabled: Boolean(runPublicId),
    refetchInterval: poll ? 1500 : false,
  })
}

export function useCancelTestRun(projectPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelTestRun,
    onSuccess: (run) => {
      toast.success('Đã gửi yêu cầu hủy run')
      queryClient.invalidateQueries({ queryKey: ['testRuns', projectPublicId] })
      queryClient.setQueryData(['testRun', run.publicId], run)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useCustomColumns(runPublicId: string | undefined) {
  return useQuery({
    queryKey: ['customColumns', runPublicId],
    queryFn: () => listCustomColumns(runPublicId!),
    enabled: Boolean(runPublicId),
  })
}

export function useAddCustomColumn(runPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddCustomColumnRequest) => addCustomColumn(runPublicId!, data),
    onSuccess: () => {
      toast.success('Đã thêm cột tùy chỉnh')
      queryClient.invalidateQueries({ queryKey: ['customColumns', runPublicId] })
      queryClient.invalidateQueries({ queryKey: ['testRunResults', runPublicId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSaveCustomValue(runPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ resultPublicId, data }: { resultPublicId: string; data: SaveCustomValueRequest }) =>
      saveCustomValue(resultPublicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRunResults', runPublicId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useOverrideResult(runPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ resultPublicId, data }: { resultPublicId: string; data: OverrideResultRequest }) =>
      overrideResult(resultPublicId, data),
    onSuccess: () => {
      toast.success('Đã hiệu chỉnh kết quả')
      queryClient.invalidateQueries({ queryKey: ['testRun', runPublicId] })
      queryClient.invalidateQueries({ queryKey: ['testRunResults', runPublicId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function usePrepareTestRunExport(projectPublicId: string | undefined, runPublicId: string | undefined) {
  return useMutation({
    mutationFn: () => prepareTestRunExport(projectPublicId!, runPublicId!),
    onError: (error: Error) => toast.error(error.message),
  })
}
