package vn.vinfast.vfqc.api.model.ai.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record TestAiConfigRequest(
    @Schema(description = "System prompt for the test", example = "You are a QA evaluator.")
        @NotBlank(message = "validation.not-blank")
        String systemPrompt,
    @Schema(description = "User message for the test", example = "Evaluate this response: ...")
        @NotBlank(message = "validation.not-blank")
        String userMessage) {}
