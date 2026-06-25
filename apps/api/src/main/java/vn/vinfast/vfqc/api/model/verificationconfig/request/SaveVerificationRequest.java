package vn.vinfast.vfqc.api.model.verificationconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record SaveVerificationRequest(
    @Schema(description = "Verification mode")
    @NotNull(message = "validation.not-null")
    VerificationMode mode,

    @Schema(description = "List of field checks to apply")
    @Valid
    List<FieldCheckRequest> fieldChecks,

    @Schema(description = "List of LLM rubrics to apply")
    @Valid
    List<LlmRubricRequest> llmRubrics
) {}
