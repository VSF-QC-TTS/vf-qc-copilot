package vn.vinfast.vfqc.api.model.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.ExpectedSource;
import vn.vinfast.vfqc.api.model.verification.OperatorCategory;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record OperatorCatalogResponse(
    @Schema(description = "Operator enum name") CheckOperator operator,
    @Schema(description = "Display name") String displayName,
    @Schema(description = "Description") String description,
    @Schema(description = "Operator category") OperatorCategory category,
    @Schema(description = "Whether this operator requires an expected value") boolean requiresExpected,
    @Schema(description = "Supported expected value sources")
        Set<ExpectedSource> supportedExpectedSources) {}
