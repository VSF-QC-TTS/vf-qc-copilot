package vn.vinfast.vfqc.api.interfaces.dto.verification.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.domain.verification.VerificationMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record VerificationConfigResponse(
    @Schema(description = "Public ID")
    UUID publicId,

    @Schema(description = "Version")
    Integer version,

    @Schema(description = "Mode")
    VerificationMode mode,

    @Schema(description = "Field checks")
    List<FieldCheckRuleResponse> fieldChecks,

    @Schema(description = "LLM rubrics")
    List<LlmRubricRuleResponse> llmRubrics,

    @Schema(description = "Creation timestamp")
    OffsetDateTime createdAt,

    @Schema(description = "Update timestamp")
    OffsetDateTime updatedAt
) {}
