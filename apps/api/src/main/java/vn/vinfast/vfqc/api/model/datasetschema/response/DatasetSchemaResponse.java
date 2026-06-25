package vn.vinfast.vfqc.api.model.datasetschema.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record DatasetSchemaResponse(
    @Schema(description = "Public ID of the schema version")
    UUID publicId,

    @Schema(description = "Version number")
    Integer version,

    @Schema(description = "Creation timestamp")
    OffsetDateTime createdAt,

    @Schema(description = "List of columns in this schema")
    List<DatasetColumnResponse> columns
) {}
