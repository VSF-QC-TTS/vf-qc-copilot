package vn.vinfast.vfqc.api.interfaces.dto.schema.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record SchemaColumnResponse(
    @Schema(description = "Stable public ID (used as column key in verification rules)")
    UUID publicId,

    @Schema(description = "Column name")
    String columnName,

    @Schema(description = "Description")
    String description,

    @Schema(description = "Data type")
    String dataType,

    @Schema(description = "Role")
    String role,

    @Schema(description = "Sample value")
    String sampleValue,

    @Schema(description = "Display order")
    Integer displayOrder
) {}
