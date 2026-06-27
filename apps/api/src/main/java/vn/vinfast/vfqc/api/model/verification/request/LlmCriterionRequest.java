package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * One LLM judge criterion request.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record LlmCriterionRequest(
    @Schema(description = "Public ID of existing criterion, null for new") UUID publicId,
    @Schema(description = "Criterion name") @NotBlank(message = "validation.not-blank")
        String name,
    @Schema(description = "Criterion description used in judge prompt")
        @NotBlank(message = "validation.not-blank")
        String description,
    @Schema(description = "Criterion weight")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        BigDecimal weight,
    @Schema(description = "Whether this criterion is enabled") boolean enabled,
    @Schema(description = "Display order") @NotNull(message = "validation.not-null")
        Integer displayOrder) {}
