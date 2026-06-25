package vn.vinfast.vfqc.api.model.datasetschema.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnDataType;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnRole;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record CreateColumnRequest(
    @Schema(description = "Name of the column/JSON path", example = "review_text")
    @NotBlank(message = "validation.not-blank")
    String columnName,

    @Schema(description = "Display name for the UI")
    String displayName,

    @Schema(description = "Data type of the column")
    @NotNull(message = "validation.not-null")
    ColumnDataType dataType,

    @Schema(description = "Role of the column in the dataset")
    @NotNull(message = "validation.not-null")
    ColumnRole role,

    @Schema(description = "Whether this column is required")
    boolean required,

    @Schema(description = "A sample value for this column")
    String sampleValue,

    @Schema(description = "Description or prompt context for this column")
    String description
) {}
