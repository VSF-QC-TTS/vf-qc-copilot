package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record OperatorCatalogResponse(
    @Schema(description = "Operator enum name") CheckOperator operator,
    @Schema(description = "Display name") String displayName,
    @Schema(description = "Description") String description) {}
