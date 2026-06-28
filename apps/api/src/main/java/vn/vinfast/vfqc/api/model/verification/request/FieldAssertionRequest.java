package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @Schema(description = "Stable SchemaColumn.publicId to compare against")
        @NotNull(message = "validation.not-null")
        UUID expectedColumnKey) {}
