package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.verification.ExpectedSource;

/**
 * Expected value descriptor response.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public record ExpectedValueResponse(
    @Schema(description = "Expected value source") ExpectedSource source,
    @Schema(description = "Stable SchemaColumn.publicId") UUID columnKey,
    @Schema(description = "Static expected value") String value,
    @Schema(description = "Template expected value") String template) {}
