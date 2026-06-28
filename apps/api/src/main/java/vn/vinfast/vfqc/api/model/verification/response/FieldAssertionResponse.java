package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
    @Schema(description = "Stable SchemaColumn.publicId compared against") UUID expectedColumnKey) {}
