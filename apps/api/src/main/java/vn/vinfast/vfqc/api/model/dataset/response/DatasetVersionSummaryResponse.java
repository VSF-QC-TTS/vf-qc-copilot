package vn.vinfast.vfqc.api.model.dataset.response;

import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetSource;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersionStatus;

public record DatasetVersionSummaryResponse(
    UUID publicId,
    int versionNumber,
    UUID schemaPublicId,
    DatasetSource source,
    DatasetVersionStatus status,
    int totalRows,
    int validRows,
    int invalidRows,
    OffsetDateTime createdAt) {}
