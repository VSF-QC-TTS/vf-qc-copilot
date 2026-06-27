package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record LlmRubricRuleRequest(
    @Schema(description = "Public ID of existing rubric, null for new") UUID publicId,
    @Schema(description = "Name of the rubric criteria") @NotBlank(message = "validation.not-blank")
        String name,
    @Schema(description = "Optional JSON path to extract specific response part for evaluation")
        String targetPath,
    @Schema(description = "The prompt/rubric for the AI judge")
        @NotBlank(message = "validation.not-blank")
        String rubric,
    @Schema(description = "Threshold score required to pass (0.0 to 1.0)")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "1.0")
        BigDecimal threshold,
    @Schema(description = "Weight of this rubric in overall score")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        BigDecimal weight,
    @Schema(description = "Whether this rubric is enabled") boolean enabled,
    @Schema(description = "Display order") @NotNull(message = "validation.not-null")
        Integer displayOrder) {}
