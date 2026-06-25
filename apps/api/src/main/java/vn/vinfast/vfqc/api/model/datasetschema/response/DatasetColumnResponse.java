package vn.vinfast.vfqc.api.model.datasetschema.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnDataType;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnRole;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record DatasetColumnResponse(
    @Schema(description = "Public ID of the column")
    UUID publicId,

    @Schema(description = "Name of the column")
    String columnName,

    @Schema(description = "Display name")
    String displayName,

    @Schema(description = "Data type")
    ColumnDataType dataType,

    @Schema(description = "Column role")
    ColumnRole role,

    @Schema(description = "Whether the column is required")
    boolean required,

    @Schema(description = "Sample value")
    String sampleValue,

    @Schema(description = "Description")
    String description,

    @Schema(description = "Display order")
    Integer displayOrder,

    @Schema(description = "Creation timestamp")
    OffsetDateTime createdAt,

    @Schema(description = "Update timestamp")
    OffsetDateTime updatedAt
) {}
