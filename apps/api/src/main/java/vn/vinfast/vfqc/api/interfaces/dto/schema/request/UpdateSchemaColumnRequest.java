package vn.vinfast.vfqc.api.interfaces.dto.schema.request;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record UpdateSchemaColumnRequest(
    @Schema(description = "New column name")
    String columnName,

    @Schema(description = "New description")
    String description,

    @Schema(description = "New data type")
    String dataType,

    @Schema(description = "New role")
    String role,

    @Schema(description = "New sample value")
    String sampleValue
) {}
