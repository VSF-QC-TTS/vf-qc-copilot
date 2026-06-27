package vn.vinfast.vfqc.api.interfaces.dto.schema.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record CreateSchemaColumnRequest(
    @Schema(description = "Column name", example = "expected_response")
    @NotBlank(message = "validation.not-blank")
    String columnName,

    @Schema(description = "Description of what this column contains")
    String description
) {}
