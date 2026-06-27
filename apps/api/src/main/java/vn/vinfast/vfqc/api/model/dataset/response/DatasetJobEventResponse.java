package vn.vinfast.vfqc.api.model.dataset.response;

import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobType;

public record DatasetJobEventResponse(
    UUID jobPublicId,
    DatasetJobType type,
    DatasetJobStatus status,
    int progress,
    String message,
    String errorMessage,
    UUID datasetPublicId,
    UUID datasetVersionPublicId,
    List<DatasetColumnMappingSuggestionResponse> mappingSuggestions) {}
