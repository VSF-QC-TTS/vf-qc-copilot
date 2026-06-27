package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.ExpectedSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record FieldCheckRuleRequest(
    @Schema(description = "Public ID of the existing field check, null for new") UUID publicId,
    @Schema(description = "JSON Path or regex to extract value from response")
        @NotBlank(message = "validation.not-blank")
        String responsePath,
    @Schema(description = "The operator to use for checking")
        @NotNull(message = "validation.not-null")
        CheckOperator operator,
    @Schema(description = "Where to get the expected value from")
        @NotNull(message = "validation.not-null")
        ExpectedSource expectedSource,
    @Schema(description = "Stable UUID of the dataset column (SchemaColumn.publicId)")
        UUID expectedColumnKey,
    @Schema(description = "Literal expected value if source is LITERAL") String expectedValue,
    @Schema(description = "Threshold for similarity checks (0.0 to 1.0)")
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "1.0")
        BigDecimal threshold,
    @Schema(description = "Weight of this check in overall score")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        BigDecimal weight,
    @Schema(description = "Whether this check is enabled") boolean enabled,
    @Schema(description = "Display order") @NotNull(message = "validation.not-null")
        Integer displayOrder) {}
