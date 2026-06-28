package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.UUID;
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
    @Schema(description = "Primitive assertion for FIELD_ASSERTION")
        FieldAssertionResponse fieldAssertion,
    @Schema(description = "Response target paths for LLM judge") List<String> targetPaths,
    @Schema(description = "SchemaColumn.publicId values referenced by LLM judge")
        List<UUID> referenceColumnKeys,
    @Schema(description = "Judge prompt") String rubric) {}
