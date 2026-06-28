package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
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
    @Schema(description = "Primitive assertion for FIELD_ASSERTION") @Valid
        FieldAssertionRequest fieldAssertion,
    @Schema(description = "Response target paths for LLM judge") List<String> targetPaths,
    @Schema(description = "SchemaColumn.publicId values referenced by LLM judge")
        List<UUID> referenceColumnKeys,
    @Schema(description = "Judge prompt") String rubric) {}
