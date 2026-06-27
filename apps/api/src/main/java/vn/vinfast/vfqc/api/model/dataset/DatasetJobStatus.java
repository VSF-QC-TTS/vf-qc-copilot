package vn.vinfast.vfqc.api.model.dataset;

public enum DatasetJobStatus {
  QUEUED,
  RUNNING,
  NEEDS_CONFIRMATION,
  COMPLETED,
  FAILED,
  CANCEL_REQUESTED,
  CANCELLED
}
