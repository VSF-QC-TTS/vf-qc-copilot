package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * LLM judge criterion response.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record LlmCriterionResponse(
    @Schema(description = "Public ID") UUID publicId,
    @Schema(description = "Criterion name") String name,
    @Schema(description = "Criterion description") String description,
    @Schema(description = "Criterion weight") BigDecimal weight,
    @Schema(description = "Enabled status") boolean enabled,
    @Schema(description = "Display order") Integer displayOrder) {}
