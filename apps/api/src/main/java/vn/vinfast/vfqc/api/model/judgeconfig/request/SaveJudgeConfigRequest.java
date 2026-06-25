package vn.vinfast.vfqc.api.model.judgeconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record SaveJudgeConfigRequest(
    @Schema(description = "The LLM Provider")
    @NotNull(message = "validation.not-null")
    LlmProvider provider,

    @Schema(description = "Optional base URL to override provider's default (e.g. for Azure)")
    String baseUrl,

    @Schema(description = "The secret API Key for this provider", example = "sk-xxxx")
    String apiKey,

    @Schema(description = "Model ID to use", example = "gpt-4o")
    @NotBlank(message = "validation.not-blank")
    String model,

    @Schema(description = "Optional custom model name (e.g. for Azure deployments)")
    String customModelName,

    @Schema(description = "Temperature setting (0.0 to 2.0)", example = "0.0")
    @Min(value = 0, message = "validation.min")
    @Max(value = 2, message = "validation.max")
    BigDecimal temperature,

    @Schema(description = "Maximum tokens for the response")
    @Min(value = 1, message = "validation.min")
    Integer maxTokens,

    @Schema(description = "Timeout in milliseconds")
    @NotNull(message = "validation.not-null")
    @Min(value = 1000, message = "validation.min")
    Integer timeoutMs,

    @Schema(description = "Number of retries on failure")
    @NotNull(message = "validation.not-null")
    @Min(value = 0, message = "validation.min")
    Integer retryCount
) {}
