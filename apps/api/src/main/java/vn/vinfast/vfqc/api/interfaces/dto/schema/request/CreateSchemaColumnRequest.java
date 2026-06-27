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

    @Schema(description = "Data type of the column", example = "STRING")
    String dataType,

    @Schema(description = "Role of the column in evaluation", example = "EXPECTED")
    String role,

    @Schema(description = "Sample value for the column", example = "Tôi muốn hủy đơn #A1029")
    String sampleValue
) {}
