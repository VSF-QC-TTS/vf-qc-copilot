package vn.vinfast.vfqc.api.interfaces.dto.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;
import vn.vinfast.vfqc.api.domain.verification.CheckOperator;
import vn.vinfast.vfqc.api.domain.verification.ExpectedSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record FieldCheckRuleResponse(
    @Schema(description = "Public ID")
    UUID publicId,

    @Schema(description = "Response path")
    String responsePath,

    @Schema(description = "Operator")
    CheckOperator operator,

    @Schema(description = "Expected source")
    ExpectedSource expectedSource,

    @Schema(description = "Stable UUID of the dataset column")
    UUID expectedColumnKey,

    @Schema(description = "Expected value")
    String expectedValue,

    @Schema(description = "Threshold")
    BigDecimal threshold,

    @Schema(description = "Weight")
    BigDecimal weight,

    @Schema(description = "Enabled status")
    boolean enabled,

    @Schema(description = "Display order")
    Integer displayOrder
) {}
