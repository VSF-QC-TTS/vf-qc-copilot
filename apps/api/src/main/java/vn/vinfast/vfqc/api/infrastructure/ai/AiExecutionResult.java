package vn.vinfast.vfqc.api.infrastructure.ai;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Result of an AI provider execution (evaluation, generation, or test).
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record AiExecutionResult(
    @Schema(description = "The generated text from the AI model")
    String generatedText,

    @Schema(description = "Total prompt/input tokens used")
    int promptTokens,

    @Schema(description = "Total completion/output tokens used")
    int completionTokens,

    @Schema(description = "Total latency in ms")
    long latencyMs,

    @Schema(description = "Error message if failed")
    String errorMessage,

    @Schema(description = "Whether the execution was successful")
    boolean successful
) {}
