package vn.vinfast.vfqc.api.model.dataset.response;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobType;

public record DatasetJobResponse(
    UUID publicId,
    UUID datasetPublicId,
    UUID datasetVersionPublicId,
    DatasetJobType type,
    DatasetJobStatus status,
    int progress,
    String message,
    String errorMessage,
    List<DatasetColumnMappingSuggestionResponse> mappingSuggestions,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime completedAt) {}
