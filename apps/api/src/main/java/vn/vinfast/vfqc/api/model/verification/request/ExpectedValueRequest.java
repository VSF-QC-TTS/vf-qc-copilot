package vn.vinfast.vfqc.api.model.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.ExpectedSource;

/**
 * Expected value descriptor for deterministic field assertions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record ExpectedValueRequest(
    @Schema(description = "Expected value source") @NotNull(message = "validation.not-null")
        ExpectedSource source,
    @Schema(description = "Stable SchemaColumn.publicId when source is DATASET_COLUMN")
        UUID columnKey,
    @Schema(description = "Static expected value when source is STATIC_VALUE") String value,
    @Schema(description = "Template expected value when source is TEMPLATE") String template) {}
