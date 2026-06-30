package vn.vinfast.vfqc.api.model.testrun.request;

import java.util.UUID;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

public record CreateTestRunRequest(
    String name, 
    UUID datasetPublicId,
    @Schema(description = "If true, runs as COMPARISON")
    Boolean isComparison,
    @Schema(description = "List of AI Config public IDs for comparison")
    List<UUID> compareAiConfigPublicIds,
    @Schema(description = "The prompt template used for the comparison models")
    String comparePromptTemplate
) {}
