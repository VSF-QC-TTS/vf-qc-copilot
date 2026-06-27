package vn.vinfast.vfqc.api.model.dataset.response;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetRowValidationStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetValidationError;

public record DatasetRowResponse(
    UUID publicId,
    int rowIndex,
    Map<String, Object> data,
    DatasetRowValidationStatus validationStatus,
    List<DatasetValidationError> validationErrors,
    OffsetDateTime createdAt) {}
