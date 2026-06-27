package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;

/**
 * Primitive field assertion request.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record FieldAssertionRequest(
    @Schema(description = "Public ID of existing assertion, null for new") UUID publicId,
    @Schema(description = "JSON path of actual response value")
        @NotBlank(message = "validation.not-blank")
        String actualPath,
    @Schema(description = "Deterministic operator")
        @NotNull(message = "validation.not-null")
        CheckOperator operator,
    @Schema(description = "Expected value descriptor") @Valid ExpectedValueRequest expected,
    @Schema(description = "Assertion-specific threshold")
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "1.0")
        BigDecimal threshold,
    @Schema(description = "Weight inside group scoring")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        BigDecimal weight,
    @Schema(description = "Whether this assertion is enabled") boolean enabled,
    @Schema(description = "Display order") @NotNull(message = "validation.not-null")
        Integer displayOrder) {}
