package vn.vinfast.vfqc.api.interfaces.dto.verification.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import vn.vinfast.vfqc.api.domain.verification.VerificationMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record SaveVerificationRequest(
    @Schema(description = "Verification mode")
    @NotNull(message = "validation.not-null")
    VerificationMode mode,

    @Schema(description = "List of field checks to apply")
    @Valid
    List<FieldCheckRuleRequest> fieldChecks,

    @Schema(description = "List of LLM rubrics to apply")
    @Valid
    List<LlmRubricRuleRequest> llmRubrics
) {}
