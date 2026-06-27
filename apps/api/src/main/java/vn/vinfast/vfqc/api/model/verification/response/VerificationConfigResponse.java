package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record VerificationConfigResponse(
    @Schema(description = "Public ID") UUID publicId,
    @Schema(description = "Version") Integer version,
    @Schema(description = "Mode") VerificationMode mode,
    @Schema(description = "Global weighted score threshold") BigDecimal threshold,
    @Schema(description = "Evaluation items") List<VerificationItemResponse> items,
    @Schema(description = "Creation timestamp") OffsetDateTime createdAt,
    @Schema(description = "Update timestamp") OffsetDateTime updatedAt) {}
