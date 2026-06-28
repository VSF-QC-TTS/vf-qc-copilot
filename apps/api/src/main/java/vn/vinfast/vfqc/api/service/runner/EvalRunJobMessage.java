package vn.vinfast.vfqc.api.service.runner;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EvalRunJobMessage(
    String eventType,
    UUID runId,
    Long internalRunId,
    Long projectId,
    OffsetDateTime createdAt) {

  public static EvalRunJobMessage requested(UUID runId, Long internalRunId, Long projectId) {
    return new EvalRunJobMessage("RUN_REQUESTED", runId, internalRunId, projectId, OffsetDateTime.now());
  }
}
