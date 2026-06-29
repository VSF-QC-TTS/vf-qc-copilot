package vn.vinfast.vfqc.api.model.testrun.response;

import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;

public record TestRunJobResponse(
    UUID publicId,
    UUID runPublicId,
    String type,
    DatasetJobStatus status,
    int progress,
    String message,
    String errorMessage,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime completedAt) {}
