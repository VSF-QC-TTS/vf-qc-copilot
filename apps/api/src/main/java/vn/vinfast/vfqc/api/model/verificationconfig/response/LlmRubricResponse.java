package vn.vinfast.vfqc.api.model.verificationconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record LlmRubricResponse(
    @Schema(description = "Public ID")
    UUID publicId,

    @Schema(description = "Name")
    String name,

    @Schema(description = "Target path")
    String targetPath,

    @Schema(description = "Rubric")
    String rubric,

    @Schema(description = "Threshold")
    BigDecimal threshold,

    @Schema(description = "Weight")
    BigDecimal weight,

    @Schema(description = "Enabled status")
    boolean enabled,

    @Schema(description = "Display order")
    Integer displayOrder
) {}
