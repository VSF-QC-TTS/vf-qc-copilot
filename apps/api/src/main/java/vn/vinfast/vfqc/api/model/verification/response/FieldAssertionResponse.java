package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;

/**
 * Primitive field assertion response.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record FieldAssertionResponse(
    @Schema(description = "Public ID") UUID publicId,
    @Schema(description = "Actual response JSON path") String actualPath,
    @Schema(description = "Operator") CheckOperator operator,
    @Schema(description = "Expected value descriptor") ExpectedValueResponse expected,
    @Schema(description = "Assertion-specific threshold") BigDecimal threshold,
    @Schema(description = "Weight inside group scoring") BigDecimal weight,
    @Schema(description = "Enabled status") boolean enabled,
    @Schema(description = "Display order") Integer displayOrder) {}
