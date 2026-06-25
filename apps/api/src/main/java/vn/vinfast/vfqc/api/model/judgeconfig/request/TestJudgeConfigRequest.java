package vn.vinfast.vfqc.api.model.judgeconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record TestJudgeConfigRequest(
    @Schema(description = "The system prompt to send", example = "You are a helpful assistant.")
    @NotBlank(message = "validation.not-blank")
    String systemPrompt,

    @Schema(description = "The user message to send", example = "Hello, world!")
    @NotBlank(message = "validation.not-blank")
    String userMessage
) {}
