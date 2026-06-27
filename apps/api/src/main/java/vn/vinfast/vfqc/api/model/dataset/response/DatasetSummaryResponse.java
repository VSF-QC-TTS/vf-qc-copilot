package vn.vinfast.vfqc.api.model.dataset.response;

import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetSource;
import vn.vinfast.vfqc.api.model.dataset.DatasetStatus;

public record DatasetSummaryResponse(
    UUID publicId,
    String name,
    String description,
    DatasetSource source,
    DatasetStatus status,
    DatasetVersionSummaryResponse latestVersion,
    DatasetVersionSummaryResponse activeVersion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
