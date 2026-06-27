package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.FieldAggregation;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;

/**
 * Evaluation item response.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record VerificationItemResponse(
    @Schema(description = "Public ID") UUID publicId,
    @Schema(description = "Item type") VerificationItemType type,
    @Schema(description = "User-facing item name") String name,
    @Schema(description = "Enabled status") boolean enabled,
    @Schema(description = "Critical item flag") boolean critical,
    @Schema(description = "Item weight") BigDecimal weight,
    @Schema(description = "Item threshold") BigDecimal threshold,
    @Schema(description = "Display order") Integer displayOrder,
    @Schema(description = "Group aggregation") FieldAggregation aggregation,
    @Schema(description = "Minimum pass count for AT_LEAST") Integer minPassCount,
    @Schema(description = "Primitive assertion for FIELD_ASSERTION")
        FieldAssertionResponse fieldAssertion,
    @Schema(description = "Child assertions for FIELD_ASSERTION_GROUP")
        List<FieldAssertionResponse> fieldAssertions,
    @Schema(description = "Response target paths for LLM judge") List<String> targetPaths,
    @Schema(description = "SchemaColumn.publicId values referenced by LLM judge")
        List<UUID> referenceColumnKeys,
    @Schema(description = "Shared judge rubric") String rubric,
    @Schema(description = "Criteria mapped to individual LLM assertions")
        List<LlmCriterionResponse> criteria) {}
