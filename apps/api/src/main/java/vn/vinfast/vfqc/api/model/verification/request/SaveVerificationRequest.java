package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record SaveVerificationRequest(
    @Schema(description = "Verification mode") @NotNull(message = "validation.not-null")
        VerificationMode mode,
    @Schema(description = "Global weighted score threshold")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "1.0")
        BigDecimal threshold,
    @Schema(description = "Ordered evaluation items") @Valid List<VerificationItemRequest> items) {}
