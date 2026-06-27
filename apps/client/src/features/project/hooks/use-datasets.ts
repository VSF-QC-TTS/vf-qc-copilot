import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  activateDatasetVersion,
  archiveDataset,
  confirmDatasetImport,
  createDataset,
  downloadDatasetVersionExcel,
  generateDatasetRows,
  getDataset,
  importDatasetExcel,
  listDatasetRows,
  listDatasets,
  prepareDatasetExport,
  saveDatasetRows,
  updateDataset,
} from '@/lib/dataset-api'
import type {
  ConfirmDatasetImportRequest,
  CreateDatasetRequest,
  GenerateDatasetRequest,
  SaveDatasetRowsRequest,
  UpdateDatasetRequest,
} from '@/types/dataset'

export function useDatasets(projectPublicId: string | undefined) {
  return useQuery({
    queryKey: ['datasets', projectPublicId],
    queryFn: () => listDatasets(projectPublicId!),
    enabled: Boolean(projectPublicId),
  })
}

export function useDataset(datasetPublicId: string | undefined) {
  return useQuery({
    queryKey: ['dataset', datasetPublicId],
    queryFn: () => getDataset(datasetPublicId!),
    enabled: Boolean(datasetPublicId),
  })
}

export function useDatasetRows(datasetPublicId: string | undefined, versionPublicId: string | undefined) {
  return useQuery({
    queryKey: ['datasetRows', datasetPublicId, versionPublicId],
    queryFn: () => listDatasetRows(datasetPublicId!, versionPublicId!),
    enabled: Boolean(datasetPublicId && versionPublicId),
  })
}

export function useCreateDataset(projectPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDatasetRequest) => createDataset(projectPublicId!, data),
    onSuccess: () => {
      toast.success('Đã tạo dataset')
      queryClient.invalidateQueries({ queryKey: ['datasets', projectPublicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectPublicId, 'setupStatus'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateDataset(datasetPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDatasetRequest) => updateDataset(datasetPublicId!, data),
    onSuccess: () => {
      toast.success('Đã cập nhật dataset')
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetPublicId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useArchiveDataset(projectPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveDataset,
    onSuccess: () => {
      toast.success('Đã lưu trữ dataset')
      queryClient.invalidateQueries({ queryKey: ['datasets', projectPublicId] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectPublicId, 'setupStatus'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useImportDatasetExcel(datasetPublicId: string | undefined) {
  return useMutation({
    mutationFn: (file: File) => importDatasetExcel(datasetPublicId!, file),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useConfirmDatasetImport(datasetPublicId: string | undefined, jobPublicId: string | undefined) {
  return useMutation({
    mutationFn: (data: ConfirmDatasetImportRequest) => confirmDatasetImport(datasetPublicId!, jobPublicId!, data),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useGenerateDatasetRows(datasetPublicId: string | undefined) {
  return useMutation({
    mutationFn: (data: GenerateDatasetRequest) => generateDatasetRows(datasetPublicId!, data),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function usePrepareDatasetExport(datasetPublicId: string | undefined, versionPublicId: string | undefined) {
  return useMutation({
    mutationFn: () => prepareDatasetExport(datasetPublicId!, versionPublicId!),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDownloadDatasetVersionExcel(datasetPublicId: string | undefined, versionPublicId: string | undefined) {
  return useMutation({
    mutationFn: () => downloadDatasetVersionExcel(datasetPublicId!, versionPublicId!),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSaveDatasetRows(datasetPublicId: string | undefined, versionPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaveDatasetRowsRequest) => saveDatasetRows(datasetPublicId!, versionPublicId!, data),
    onSuccess: () => {
      toast.success('Đã tạo draft version mới')
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetPublicId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useActivateDatasetVersion(datasetPublicId: string | undefined, versionPublicId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => activateDatasetVersion(datasetPublicId!, versionPublicId!),
    onSuccess: () => {
      toast.success('Đã active version')
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetPublicId] })
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
