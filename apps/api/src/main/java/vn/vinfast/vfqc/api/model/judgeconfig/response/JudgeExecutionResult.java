package vn.vinfast.vfqc.api.model.judgeconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record JudgeExecutionResult(
    @Schema(description = "The generated text from the LLM")
    String generatedText,

    @Schema(description = "Total prompt tokens used")
    int promptTokens,

    @Schema(description = "Total completion tokens used")
    int completionTokens,

    @Schema(description = "Total latency in ms")
    long latencyMs,

    @Schema(description = "Error message if failed")
    String errorMessage,

    @Schema(description = "Whether the execution was successful")
    boolean successful
) {}
