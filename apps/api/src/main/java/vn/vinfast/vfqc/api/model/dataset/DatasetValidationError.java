package vn.vinfast.vfqc.api.model.dataset;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "DatasetValidationError", description = "Validation error for a dataset row or schema.")
public record DatasetValidationError(
    @Schema(description = "Row index when the error is row-specific.") Integer rowIndex,
    @Schema(description = "Column name when the error is column-specific.") String columnName,
    @Schema(description = "Stable validation code.") String code,
    @Schema(description = "Human readable validation message.") String message) {}
