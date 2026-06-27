package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.FieldAggregation;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;

/**
 * Evaluation item request. Only fields relevant to the selected item type are used.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record VerificationItemRequest(
    @Schema(description = "Public ID of existing item, null for new") UUID publicId,
    @Schema(description = "Item type") @NotNull(message = "validation.not-null")
        VerificationItemType type,
    @Schema(description = "User-facing item name") @NotBlank(message = "validation.not-blank")
        String name,
    @Schema(description = "Whether this item is enabled") boolean enabled,
    @Schema(description = "Whether this item fails the case when it fails") boolean critical,
    @Schema(description = "Item weight in global score")
        @NotNull(message = "validation.not-null")
        @DecimalMin(value = "0.0")
        BigDecimal weight,
    @Schema(description = "Item threshold")
        @DecimalMin(value = "0.0")
        @DecimalMax(value = "1.0")
        BigDecimal threshold,
    @Schema(description = "Display order") @NotNull(message = "validation.not-null")
        Integer displayOrder,
    @Schema(description = "Group aggregation strategy") FieldAggregation aggregation,
    @Schema(description = "Minimum enabled child assertions that must pass for AT_LEAST")
        Integer minPassCount,
    @Schema(description = "Primitive assertion for FIELD_ASSERTION") @Valid
        FieldAssertionRequest fieldAssertion,
    @Schema(description = "Child assertions for FIELD_ASSERTION_GROUP") @Valid
        List<FieldAssertionRequest> fieldAssertions,
    @Schema(description = "Response target paths for LLM judge") List<String> targetPaths,
    @Schema(description = "SchemaColumn.publicId values referenced by LLM judge")
        List<UUID> referenceColumnKeys,
    @Schema(description = "Shared judge rubric") String rubric,
    @Schema(description = "Criteria mapped to individual LLM assertions") @Valid
        List<LlmCriterionRequest> criteria) {}
